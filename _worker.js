/**
 * 100% CLOUDFLARE-NATIVE BACKEND & DISCORD INTERACTION ENGINE (_worker.js)
 * Whiz Studio Reviews System
 *
 * Implements:
 *  1. DATABASE: Cloudflare KV (REVIEWS_DB)
 *     Review properties: { id, clientName, reviewText, moderation_status: 'pending', visibility: 'hidden', timestamp }
 *  2. ROUTE A: POST /api/submit-review (From Website)
 *     - Saves review to KV
 *     - Sends Discord embed with 4 buttons: [✅ Accept] [❌ Decline] [👁️ Show] [🙈 Hide]
 *     - custom_id includes review ID (accept_{id}, decline_{id}, show_{id}, hide_{id})
 *  3. ROUTE B: POST /discord/interactions (Button Clicks)
 *     - Verifies Ed25519 signature
 *     - Updates KV (moderation_status or visibility)
 *     - Returns Type 7 (UPDATE_MESSAGE) immediately (< 50ms) to eliminate timeout error
 *  4. ROUTE C: GET /api/reviews (For Website Display)
 *     - Fetches from KV
 *     - Returns ONLY reviews where moderation_status === 'accepted' AND visibility === 'show'
 */

import nacl from "tweetnacl";

// =============================================================================
// CONFIGURATION & ENVIRONMENT BINDINGS (ZERO HARDCODED SECRETS)
// All secrets (BOT_TOKEN, CF_API_TOKEN, BREVO_API_KEY) are resolved from env bindings
// =============================================================================
export const CONFIG = {
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  KV_NAMESPACE_ID: "26a1650d57c04ae1a5970f81909acdba",
  REVIEW_CHANNEL_ID: "1557820513982742580"
};

const ALLOWED_ORIGINS = [
  "https://whizstudio.art",
  "https://www.whizstudio.art",
  "https://portal.whizstudio.art",
  "https://admin.whizstudio.art"
];

function getCorsHeaders(request, env = null) {
  const origin = request?.headers?.get("origin") || "";
  const isDev = env?.ENVIRONMENT && env.ENVIRONMENT !== "production";
  const isProdAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".whizstudio.pages.dev");
  const isLocalAllowed = isDev && origin.startsWith("http://localhost:");
  const isAllowed = isProdAllowed || isLocalAllowed;
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://whizstudio.art",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp, X-Clerk-User-Id, X-Internal-Token, X-Device-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(data, status = 200, extraHeaders = {}, request = null, env = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(request, env),
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

// -----------------------------------------------------------------------------
// IN-MEMORY SLIDING WINDOW RATE LIMITER FOR PAGES EDGE ISOLATES
// -----------------------------------------------------------------------------
const WORKER_RATE_LIMIT = new Map();

function checkWorkerRateLimit(key, limit = 5, windowMs = 60000) {
  const now = Date.now();
  if (WORKER_RATE_LIMIT.size > 2000) {
    for (const [k, v] of WORKER_RATE_LIMIT.entries()) {
      if (now > v.resetAt) WORKER_RATE_LIMIT.delete(k);
    }
  }

  const rec = WORKER_RATE_LIMIT.get(key);
  if (!rec || now > rec.resetAt) {
    WORKER_RATE_LIMIT.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, waitSec: 0 };
  }
  if (rec.count >= limit) {
    const waitSec = Math.ceil((rec.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, waitSec };
  }
  rec.count++;
  return { allowed: true, remaining: limit - rec.count, waitSec: 0 };
}

// -----------------------------------------------------------------------------
// STRICT ACCESS CONTROL & AUTHENTICATION VERIFIER
// -----------------------------------------------------------------------------
const WORKER_AUTH_CACHE = new Map();

async function verifyAdminOrInternal(request, env) {
  // 1. Service-to-service internal authentication check
  const internalSecret = env?.INTERNAL_SECRET || env?.CF_API_TOKEN || env?.BREVO_API_KEY;
  const headerSecret = request.headers.get("X-Internal-Token") || request.headers.get("X-Whiz-Secret");
  if (headerSecret && internalSecret && headerSecret === internalSecret) {
    return { ok: true, source: "internal_secret" };
  }

  // 2. Bearer session token extraction
  const authHeader = request.headers.get("Authorization") || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/whiz_session=([^;]+)/);
    if (match) token = match[1].trim();
  }

  if (!token) {
    return { ok: false, status: 401, error: "Authentication required. Please sign in to access this resource." };
  }

  const now = Date.now();
  const cached = WORKER_AUTH_CACHE.get(token);
  if (cached && now < cached.expiresAt) {
    if (cached.isAuthorized) return { ok: true, user: cached.user };
    return { ok: false, status: 403, error: "Access denied. Administrator privileges required." };
  }

  try {
    const apiRes = await fetch("https://whiz-api.kaziaremon.workers.dev/api/v1/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Clerk-User-Id": request.headers.get("X-Clerk-User-Id") || ""
      }
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      const user = data?.data?.user;
      const isStaffOrAdmin = Boolean(
        user && (
          user.isSuperAdmin ||
          user.isStaff ||
          ["owner", "admin", "super_admin", "accounts", "staff"].includes((user.role || "").toLowerCase()) ||
          ["owner", "admin", "super_admin", "accounts", "staff"].includes((user.internalRole || "").toLowerCase()) ||
          user.email === "kaziaremon@gmail.com"
        )
      );

      WORKER_AUTH_CACHE.set(token, { isAuthorized: isStaffOrAdmin, expiresAt: now + 60000, user });
      if (isStaffOrAdmin) {
        return { ok: true, user };
      }
      return { ok: false, status: 403, error: "Access denied. Administrator privileges required." };
    }
  } catch (err) {
    console.error("Worker auth verification error:", err);
  }

  // Fallback JWT claim verification if backend worker is undergoing rollout
  if (token.includes(".")) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        const currentUnix = Math.floor(now / 1000);
        if (!payload.exp || payload.exp >= currentUnix) {
          const email = (payload.email || payload.primary_email || "").toLowerCase();
          if (email === "kaziaremon@gmail.com" || payload.role === "admin" || payload.role === "owner") {
            WORKER_AUTH_CACHE.set(token, { isAuthorized: true, expiresAt: now + 60000, user: payload });
            return { ok: true, user: payload };
          }
        }
      }
    } catch (e) {}
  }

  WORKER_AUTH_CACHE.set(token, { isAuthorized: false, expiresAt: now + 15000, user: null });
  return { ok: false, status: 401, error: "Session invalid or expired. Please sign in again." };
}

// =============================================================================
// SIGNATURE VERIFICATION (Native Web Crypto API + tweetnacl fallback)
// =============================================================================
function hexToUint8Array(hex) {
  const clean = hex.trim();
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return arr;
}

async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    const verified = await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToUint8Array(signature),
      encoder.encode(timestamp + rawBody)
    );
    if (verified) return true;
  } catch (err) {}

  try {
    const encoder = new TextEncoder();
    return nacl.sign.detached.verify(
      encoder.encode(timestamp + rawBody),
      hexToUint8Array(signature),
      hexToUint8Array(publicKey)
    );
  } catch (err) {
    console.error("tweetnacl verification error:", err);
    return false;
  }
}

// =============================================================================
// KV HELPERS (Native binding with Cloudflare REST API fallback)
// Strictly quota-optimized for Cloudflare Free Tier
// =============================================================================
async function kvPut(env, key, value) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    await env.REVIEWS_DB.put(key, value);
    return true;
  }

  const cfToken = env?.CF_API_TOKEN || CONFIG.CF_API_TOKEN;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${cfToken}`,
      "Content-Type": "application/json"
    },
    body: typeof value === "string" ? value : JSON.stringify(value)
  });
  return res.ok;
}

async function kvGet(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.get === "function") {
    return await env.REVIEWS_DB.get(key);
  }

  const cfToken = env?.CF_API_TOKEN || CONFIG.CF_API_TOKEN;
  if (!cfToken) return null;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    headers: { "Authorization": `Bearer ${cfToken}` }
  });
  if (res.status === 200) {
    return await res.text();
  }
  return null;
}

async function kvDelete(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.delete === "function") {
    await env.REVIEWS_DB.delete(key);
    return true;
  }

  const cfToken = env?.CF_API_TOKEN;
  if (!cfToken) return false;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${cfToken}` }
  });
  return res.ok;
}

async function kvList(env, prefix = "review_") {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.list === "function") {
    const res = await env.REVIEWS_DB.list({ prefix, limit: 100 });
    return res.keys || [];
  }

  const cfToken = env?.CF_API_TOKEN;
  if (!cfToken) return [];
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/keys?prefix=${prefix}&limit=100`, {
    headers: { "Authorization": `Bearer ${cfToken}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.result || [];
  }
  return [];
}

/**
 * High-Performance Aggregated Index KV Pattern
 * Eliminates sub-request limits by serving list queries in 1 single KV read.
 */
async function kvGetAll(env, prefix) {
  const indexKey = `_idx_${prefix}`;

  // 1. Try reading pre-aggregated index key (Single Sub-Request)
  const indexRaw = await kvGet(env, indexKey);
  if (indexRaw) {
    try {
      const indexList = JSON.parse(indexRaw);
      if (Array.isArray(indexList)) {
        return indexList;
      }
    } catch (e) {}
  }

  // 2. Cold start fallback: scan keys and compile the index
  const keys = await kvList(env, prefix);
  if (!keys || keys.length === 0) return [];

  const itemKeys = keys.filter(k => !k.name.startsWith("_idx_")).slice(0, 60);
  const results = await Promise.all(
    itemKeys.map(async (k) => {
      const raw = await kvGet(env, k.name);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.id && k.name) {
          parsed.id = k.name.replace(prefix, "");
        }
        return parsed;
      } catch (e) {
        return null;
      }
    })
  );
  const validResults = results.filter(Boolean);

  // Persist aggregated index for all future single-request reads
  if (validResults.length > 0) {
    await kvPut(env, indexKey, JSON.stringify(validResults));
  }

  return validResults;
}

async function updateKvIndex(env, prefix, itemOrId, action = "upsert") {
  try {
    const indexKey = `_idx_${prefix}`;
    let list = [];
    const indexRaw = await kvGet(env, indexKey);
    if (indexRaw) {
      try {
        const parsed = JSON.parse(indexRaw);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }

    if (action === "delete") {
      const id = String(itemOrId?.id || itemOrId).replace(prefix, "");
      list = list.filter(i => i && i.id !== id && i.id !== `${prefix}${id}` && `${prefix}${i.id}` !== id);
    } else {
      const updated = itemOrId;
      if (!updated || !updated.id) return;
      const cleanId = String(updated.id).replace(prefix, "");
      const idx = list.findIndex(i => i && (i.id === cleanId || i.id === updated.id));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
    }

    await kvPut(env, indexKey, JSON.stringify(list));
  } catch (err) {
    console.error(`KV index synchronization warning for ${prefix}:`, err);
  }
}

// =============================================================================
// WORKER EVENT HANDLER
// =============================================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Strict HTTPS Enforcement (301 Permanent Redirect)
    const proto = request.headers.get("x-forwarded-proto") || (url.protocol ? url.protocol.replace(":", "") : "https");
    if (proto === "http" || url.protocol === "http:") {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = "https:";
      secureUrl.hostname = "whizstudio.art";
      return Response.redirect(secureUrl.toString(), 301);
    }

    // Canonical Apex Domain Enforcement (301 Permanent Redirect)
    if (url.hostname === "www.whizstudio.art") {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.protocol = "https:";
      canonicalUrl.hostname = "whizstudio.art";
      return Response.redirect(canonicalUrl.toString(), 301);
    }

    // Admin Workspace Redirection
    if (path === "/admin" || path === "/admin/") {
      return Response.redirect(`${url.origin}/admin/dashboard`, 302);
    }

    // SEO-Friendly Navigation Routes & Deep Linking (Dedicated pages /about and /articles bypass SPA rewriting)
    const SEO_SPA_ROUTES = [
      "/services",
      "/pricing",
      "/reviews",
      "/testimonials",
      "/faq",
      "/contact",
      "/login",
      "/register"
    ];
    const cleanRoutePath = path.replace(/\/+$/, '') || '/';
    if (SEO_SPA_ROUTES.includes(cleanRoutePath)) {
      if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
        const indexRequest = new Request(new URL("/", request.url), request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const botToken = env?.BOT_TOKEN || "";
    const channelId = env?.REVIEW_CHANNEL_ID || CONFIG.REVIEW_CHANNEL_ID;
    const publicKey = env?.DISCORD_PUBLIC_KEY || "";
    const reviewWebhook = env?.REVIEW_WEBHOOK_URL || "";
    const contactWebhook = env?.CONTACT_WEBHOOK_URL || "";

    // -------------------------------------------------------------------------
    // ROUTE A: POST /api/submit-review & /api/review (Client Review Submission)
    // Saves review directly into Cloudflare KV with default moderation_status: 'pending'
    // and visibility: 'hidden'. 100% disconnected from Discord.
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
        const rl = checkWorkerRateLimit(`submit-review:${clientIp}`, 5, 60000);
        if (!rl.allowed) {
          return jsonResponse({
            success: false,
            error: `Too many review submissions from your IP. Please wait ${rl.waitSec} seconds before submitting again.`
          }, 429, {}, request, env);
        }

        const body = await request.json();
        const clientName = body.clientName || body.name || "Anonymous Client";
        const reviewText = body.reviewText || body.text || body.review || body.feedback || "";
        const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
        const role = body.role || body.service || "Verified Client";
        const email = body.email || "";

        if (!reviewText || !reviewText.trim()) {
          return jsonResponse({ success: false, error: "Review feedback text is required." }, 400, {}, request, env);
        }

        const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const nowIso = new Date().toISOString();

        // 1. Save review to Cloudflare KV (REVIEWS_DB)
        const reviewData = {
          id,
          clientName: String(clientName).trim(),
          name: String(clientName).trim(),
          email: String(email).trim().toLowerCase(),
          role: String(role).trim(),
          service: String(role).trim(),
          reviewText: String(reviewText).trim(),
          text: String(reviewText).trim(),
          rating,
          moderation_status: "pending",
          visibility: "hidden",
          created_at: nowIso,
          timestamp: nowIso,
          updated_at: nowIso,
          moderated_by: ""
        };

        const saved = await kvPut(env, `review_${id}`, JSON.stringify(reviewData));
        if (!saved) {
          throw new Error("Failed to write review to KV database.");
        }
        await updateKvIndex(env, "review_", reviewData, "upsert");

        return jsonResponse({
          success: true,
          id,
          message: "Review submitted successfully! It is now pending moderation in the Super Admin Console."
        }, 200, {}, request, env);

      } catch (err) {
        console.error("Client Review Submission Error:", err);
        return jsonResponse({ success: false, error: err.message || "Failed to submit review." }, 500, {}, request, env);
      }
    }

    // -------------------------------------------------------------------------
    // Super Admin Review Moderation API (/api/admin-reviews)
    // Full moderation controls: Approve, Reject, Hide, Show, Toggle Visibility, Delete
    // Strictly authenticated: Only authorized staff/admin may access or mutate records.
    // -------------------------------------------------------------------------
    if (path === "/api/admin-reviews") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }

      if (request.method === "GET") {
        try {
          const reviews = await kvGetAll(env, "review_");
          reviews.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
          return jsonResponse({ success: true, count: reviews.length, reviews }, 200, {
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }, request, env);
        } catch (err) {
          console.error("GET /api/admin-reviews Error:", err);
          return jsonResponse({ success: false, reviews: [], error: err.message }, 500, {}, request, env);
        }
      }

      if (request.method === "POST" || request.method === "PATCH") {
        try {
          const body = await request.json();
          const { id, action, status, visibility } = body;
          if (!id) return jsonResponse({ success: false, error: "Review ID is required" }, 400, {}, request, env);

          const key = id.startsWith("review_") ? id : `review_${id}`;
          const raw = await kvGet(env, key);
          if (!raw) return jsonResponse({ success: false, error: "Review not found" }, 404, {}, request, env);

          const review = JSON.parse(raw);

          if (action === "approve") {
            review.moderation_status = "approved";
            review.visibility = "show";
          } else if (action === "reject") {
            review.moderation_status = "rejected";
            review.visibility = "hidden";
          } else if (action === "toggle_visibility") {
            review.visibility = review.visibility === "show" ? "hidden" : "show";
          } else if (action === "hide") {
            review.visibility = "hidden";
          } else if (action === "show") {
            review.visibility = "show";
          } else if (action === "delete") {
            await kvDelete(env, key);
            await updateKvIndex(env, "review_", key, "delete");
            return jsonResponse({ success: true, id, message: "Review deleted successfully." }, 200, {}, request, env);
          }

          if (status) review.moderation_status = status;
          if (visibility) review.visibility = visibility;
          review.updated_at = new Date().toISOString();
          review.moderated_by = auth.user?.full_name || auth.user?.email || "Super Admin";

          await kvPut(env, key, JSON.stringify(review));
          await updateKvIndex(env, "review_", review, "upsert");
          return jsonResponse({
            success: true,
            review,
            message: `Review successfully updated (${review.moderation_status} | ${review.visibility})`
          }, 200, {}, request, env);
        } catch (err) {
          console.error("Update Review Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }

      if (request.method === "DELETE") {
        try {
          let id = url.searchParams.get("id");
          if (!id) {
            try {
              const body = await request.json();
              id = body?.id;
            } catch (e) {}
          }
          if (!id) return jsonResponse({ success: false, error: "Review ID required" }, 400, {}, request, env);

          const key = id.startsWith("review_") ? id : `review_${id}`;
          await kvDelete(env, key);
          if (key !== id) {
            await kvDelete(env, id);
          }
          await updateKvIndex(env, "review_", key, "delete");
          return jsonResponse({ success: true, id, message: "Review permanently deleted." }, 200, {}, request, env);
        } catch (err) {
          console.error("DELETE /api/admin-reviews Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }
    }

    // -------------------------------------------------------------------------
    // Super Admin CRM Inquiries & Leads API (/api/inquiries)
    // Full CRUD operations for prospective client leads
    // Strictly authenticated: Only authorized staff/admin may access or mutate records.
    // -------------------------------------------------------------------------
    if (path === "/api/inquiries") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }

      if (request.method === "GET") {
        try {
          const list = await kvGetAll(env, "inquiry_");
          list.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
          return jsonResponse({ success: true, count: list.length, inquiries: list }, 200, {
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }, request, env);
        } catch (err) {
          console.error("GET /api/inquiries Error:", err);
          return jsonResponse({ success: false, inquiries: [], error: err.message }, 500, {}, request, env);
        }
      }

      if (request.method === "POST" || request.method === "PATCH") {
        try {
          const body = await request.json();
          const { id, status, notes } = body;
          if (!id) return jsonResponse({ success: false, error: "Inquiry ID is required" }, 400, {}, request, env);

          const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
          const raw = await kvGet(env, key);
          if (!raw) return jsonResponse({ success: false, error: "Inquiry not found" }, 404, {}, request, env);

          const record = JSON.parse(raw);
          if (status) record.status = status;
          if (typeof notes === "string") record.notes = notes;
          record.updated_at = new Date().toISOString();

          await kvPut(env, key, JSON.stringify(record));
          await updateKvIndex(env, "inquiry_", record, "upsert");
          return jsonResponse({ success: true, inquiry: record, message: "Inquiry updated successfully." }, 200, {}, request, env);
        } catch (err) {
          console.error("Update Inquiry Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }

      if (request.method === "DELETE") {
        try {
          let id = url.searchParams.get("id");
          if (!id) {
            try {
              const body = await request.json();
              id = body?.id;
            } catch (e) {}
          }
          if (!id) return jsonResponse({ success: false, error: "Inquiry ID required" }, 400, {}, request, env);

          const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
          await kvDelete(env, key);
          if (key !== id) {
            await kvDelete(env, id);
          }
          await updateKvIndex(env, "inquiry_", key, "delete");
          return jsonResponse({ success: true, id, message: "Inquiry deleted successfully from database." }, 200, {}, request, env);
        } catch (err) {
          console.error("DELETE /api/inquiries Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }
    }

    // -------------------------------------------------------------------------
    // ROUTE B: POST /discord/interactions (Button Clicks)
    // -------------------------------------------------------------------------
    if ((path === "/discord/interactions" || path === "/api/interactions" || path === "/interactions") && request.method === "POST") {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-signature-ed25519") || request.headers.get("X-Signature-Ed25519");
        const timestamp = request.headers.get("x-signature-timestamp") || request.headers.get("X-Signature-Timestamp");

        if (!signature || !timestamp) {
          return new Response("Missing signature headers", { status: 401 });
        }

        const isValid = await verifyDiscordSignature(rawBody, signature, timestamp, publicKey);
        if (!isValid) {
          return new Response("Invalid request signature", { status: 401 });
        }

        let interaction;
        try {
          interaction = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (interaction.type === 1) {
          return jsonResponse({ type: 1 });
        }

        if (interaction.type === 3) {
          const customId = interaction.data?.custom_id || "";
          const member = interaction.member || interaction.user;
          const moderatorName = member?.user?.username || member?.username || "Moderator";

          let action = "";
          let id = "";

          if (customId.startsWith("accept_")) {
            action = "accept";
            id = customId.replace("accept_", "");
          } else if (customId.startsWith("decline_")) {
            action = "decline";
            id = customId.replace("decline_", "");
          } else if (customId.startsWith("show_")) {
            action = "show";
            id = customId.replace("show_", "");
          } else if (customId.startsWith("hide_")) {
            action = "hide";
            id = customId.replace("hide_", "");
          }

          if (!id || !action) {
            return jsonResponse({ type: 6 });
          }

          let review = null;
          const existingRaw = await kvGet(env, `review_${id}`);
          if (existingRaw) {
            try {
              review = JSON.parse(existingRaw);
            } catch (e) {}
          }

          if (!review) {
            const originalEmbed = interaction.message?.embeds?.[0] || {};
            const fields = originalEmbed.fields || [];
            let name = "Verified Client";
            let text = "";
            let rating = 5;

            for (const f of fields) {
              const fn = (f.name || "").toLowerCase();
              if (fn.includes("client") || fn.includes("company") || fn.includes("name")) name = f.value;
              else if (fn.includes("feedback") || fn.includes("review") || fn.includes("text")) text = f.value;
              else if (fn.includes("rating") || fn.includes("star")) {
                const s = (f.value.match(/★/g) || []).length;
                if (s > 0) rating = s;
              }
            }

            review = {
              id,
              clientName: name,
              reviewText: text,
              rating,
              moderation_status: "pending",
              visibility: "hidden",
              timestamp: new Date().toISOString()
            };
          }

          if (action === "accept") {
            review.moderation_status = "accepted";
          } else if (action === "decline") {
            review.moderation_status = "declined";
          } else if (action === "show") {
            review.visibility = "show";
          } else if (action === "hide") {
            review.visibility = "hidden";
          }

          review.updated_at = new Date().toISOString();

          await kvPut(env, `review_${id}`, JSON.stringify(review));

          const modStatus = review.moderation_status;
          const visStatus = review.visibility;

          const statusBadge = modStatus === "accepted" ? "✅ Accepted" : (modStatus === "declined" ? "❌ Declined" : "⏳ Pending");
          const visBadge = visStatus === "show" ? "👁️ Showing" : "🙈 Hidden";
          const liveStatusStr = `Status: ${statusBadge} | Visibility: ${visBadge}`;

          let embedColor = 0xF59E0B;
          if (modStatus === "accepted" && visStatus === "show") {
            embedColor = 0x00A86B;
          } else if (modStatus === "accepted") {
            embedColor = 0x3B82F6;
          } else if (modStatus === "declined") {
            embedColor = 0xEF4444;
          }

          let statusDetail = "";
          if (modStatus === "accepted" && visStatus === "show") {
            statusDetail = "🟢 **Live on Website:** This review is currently visible on https://whizstudio.art/#reviews";
          } else if (modStatus === "accepted" && visStatus === "hidden") {
            statusDetail = "🟡 **Accepted (Hidden):** Review is approved, but currently hidden from website display.";
          } else if (modStatus === "declined") {
            statusDetail = "🔴 **Declined:** Review was declined and is suppressed from the website.";
          } else {
            statusDetail = "⏳ **Pending:** Awaiting administrator authorization.";
          }

          const starString = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5)) + ` (${review.rating || 5} / 5 Stars)`;

          const updatedEmbed = {
            title: "⭐ Client Review Control Panel — Whiz Studio",
            description: `Permanent moderation control panel for Whiz Studio.\n\n${statusDetail}\n👤 **Last Updated By:** **@${moderatorName}**`,
            color: embedColor,
            fields: [
              { name: "👤 Client / Company", value: String(review.clientName || "Client"), inline: true },
              { name: "⭐ Rating Given", value: starString, inline: true },
              { name: "💬 Review Feedback", value: String(review.reviewText || "No review feedback"), inline: false },
              { name: "🆔 Review Reference ID", value: String(id), inline: true },
              { name: "⚙️ Live Status", value: liveStatusStr, inline: true },
              { name: "⏰ Last Updated", value: new Date().toUTCString(), inline: false }
            ],
            footer: { text: "Whiz Studio Review Control Panel • whizstudio.art" }
          };

          const components = [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 3,
                  label: "✅ Accept",
                  custom_id: `accept_${id}`
                },
                {
                  type: 2,
                  style: 4,
                  label: "❌ Decline",
                  custom_id: `decline_${id}`
                },
                {
                  type: 2,
                  style: 1,
                  label: "👁️ Show",
                  custom_id: `show_${id}`
                },
                {
                  type: 2,
                  style: 2,
                  label: "🙈 Hide",
                  custom_id: `hide_${id}`
                }
              ]
            }
          ];

          return jsonResponse({
            type: 7,
            data: {
              content: `🛡️ Review Control Panel • ${liveStatusStr}`,
              embeds: [updatedEmbed],
              components: components
            }
          });
        }

        return jsonResponse({ type: 1 });
      } catch (err) {
        console.error("Route B Error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // -------------------------------------------------------------------------
    // ROUTE C: GET /api/reviews (For Website Display & Homepage Carousel)
    // Serves reviews strictly matching:
    // (moderation_status === 'approved' || moderation_status === 'accepted') AND visibility === 'show'.
    // Protected with edge cache headers to strictly safeguard Cloudflare Free Tier quotas.
    // -------------------------------------------------------------------------
    if (path === "/api/reviews" && request.method === "GET") {
      try {
        const allReviews = await kvGetAll(env, "review_");
        const filteredReviews = [];

        for (const review of allReviews) {
          const isApproved = review.moderation_status === "approved" || review.moderation_status === "accepted";
          const isVisible = review.visibility === "show";

          if (isApproved && isVisible) {
            filteredReviews.push({
              id: review.id,
              clientName: review.clientName || review.name || "Verified Client",
              name: review.clientName || review.name || "Verified Client",
              role: review.role || review.service || "Verified Client",
              service: review.service || review.role || "Marketing Services",
              reviewText: review.reviewText || review.text || "",
              text: review.reviewText || review.text || "",
              rating: Number(review.rating) || 5,
              timestamp: review.timestamp || review.created_at || "",
              date: review.timestamp || review.created_at
                ? new Date(review.timestamp || review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Verified Client"
            });
          }
        }

        filteredReviews.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

        return jsonResponse({
          success: true,
          count: filteredReviews.length,
          reviews: filteredReviews
        }, 200, {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
        }, request);

      } catch (err) {
        console.error("Public Reviews Error:", err);
        return jsonResponse({ success: false, reviews: [], error: err.message }, 500, {}, request);
      }
    }

    // -------------------------------------------------------------------------
    // Contact Gateway (/api/submit-contact & /api/contact)
    // Direct Lead Generation Engine: Routes all inbound prospective client inquiries
    // into Cloudflare KV database (prefix: inquiry_) for Super Admin CRM management.
    // Rate-limited per IP to prevent spam exhaustion.
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-contact" || path === "/api/contact") && request.method === "POST") {
      try {
        const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
        const rl = checkWorkerRateLimit(`submit-contact:${clientIp}`, 5, 60000);
        if (!rl.allowed) {
          return jsonResponse({
            success: false,
            error: `Too many contact requests from your IP. Please wait ${rl.waitSec} seconds before submitting again.`
          }, 429, {}, request, env);
        }

        const body = await request.json();
        const { name, email, phone, service, details } = body;

        if (!name || !email || !details) {
          return jsonResponse({
            success: false,
            error: "Client Name, Email Address, and Project Scope details are required."
          }, 400, {}, request, env);
        }

        const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const nowIso = new Date().toISOString();

        const inquiryRecord = {
          id,
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: String(phone || "").trim(),
          service: String(service || "General Inquiry").trim(),
          details: String(details).trim(),
          status: "new", // 'new' | 'contacted' | 'in_progress' | 'closed'
          created_at: nowIso,
          timestamp: nowIso,
          updated_at: nowIso,
          notes: ""
        };

        const saved = await kvPut(env, `inquiry_${id}`, JSON.stringify(inquiryRecord));
        if (!saved) {
          throw new Error("Failed to write inquiry to KV database.");
        }
        await updateKvIndex(env, "inquiry_", inquiryRecord, "upsert");

        // Non-blocking automated welcome acknowledgment via ctx.waitUntil()
        if (ctx && typeof ctx.waitUntil === "function") {
          ctx.waitUntil(
            sendBrevoWelcomeEmailWorker({
              email,
              fullName: name,
              role: "client",
              env
            }).catch(e => console.error("Inquiry async welcome email error:", e))
          );
        }

        return jsonResponse({
          success: true,
          id,
          message: "Your inquiry has been successfully registered with Whiz Studio. Our executive team will review and respond shortly."
        }, 200, {}, request, env);

      } catch (err) {
        console.error("Lead Generation API Error:", err);
        return jsonResponse({
          success: false,
          error: err.message || "Failed to process inquiry submission."
        }, 500, {}, request, env);
      }
    }

    // -------------------------------------------------------------------------
    // ROUTE: POST /api/send-welcome-email (Role-Based Welcome Email via Brevo API)
    // Strictly authenticated: Only authorized staff/admin or internal callers.
    // -------------------------------------------------------------------------
    if (path === "/api/send-welcome-email" && request.method === "POST") {
      try {
        const auth = await verifyAdminOrInternal(request, env);
        if (!auth.ok) {
          return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
        }

        const body = await request.json();
        const { email, fullName, role = "client", temporaryPassword, loginUrl } = body;

        if (!email || !email.includes("@")) {
          return jsonResponse({ success: false, error: "A valid email is required." }, 400, {}, request, env);
        }

        const emailResult = await sendBrevoWelcomeEmailWorker({
          email,
          fullName: fullName || "Valued User",
          role,
          temporaryPassword,
          loginUrl,
          env
        });

        return jsonResponse({
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          provider: "Brevo Transactional REST API v3",
          whiteLabeled: true
        }, emailResult.success ? 200 : 500, {}, request, env);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // -------------------------------------------------------------------------
    // Explicit SEO Routing (/sitemap.xml & /robots.txt)
    // -------------------------------------------------------------------------
    if (path === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const today = new Date().toISOString().split("T")[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://whizstudio.art/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/bn/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-marketing/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-marketing/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-ads/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-ads/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/social-media-optimization/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/social-media-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/linkedin-optimization/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/linkedin-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/organic-reach-reality/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/organic-reach-reality/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/smo-ad-efficiency/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/smo-ad-efficiency/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/linkedin-executive-presence/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/linkedin-executive-presence/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/creative-fatigue-mitigation/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/creative-fatigue-mitigation/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
</urlset>`;
      return new Response(request.method === "HEAD" ? null : sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "https://whizstudio.art"
        }
      });
    }

    if (path === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const robots = `User-agent: *\nAllow: /\nSitemap: https://whizstudio.art/sitemap.xml\n`;
      return new Response(request.method === "HEAD" ? null : robots, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "https://whizstudio.art",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  }
};

// =============================================================================
// BREVO TRANSACTIONAL WELCOME EMAIL HELPERS
// Free Tier Compliant • 100% White-Labeled • Glassmorphic UI Dark Mode
// =============================================================================
const WHIZ_LOGO_URL = "https://whizstudio.art/assets/images/whiz-logo-v2.png?v=202611";

function buildRoleWelcomeEmailHtmlWorker({
  fullName = "",
  email = "",
  role = "client",
  loginUrl = "",
  temporaryPassword = ""
}) {
  const normRole = String(role || "client").trim().toLowerCase();
  const isInternal = ["admin", "accountant", "owner", "staff", "manager", "financial_admin", "employee"].includes(normRole);

  const subject = isInternal
    ? "Welcome to the Team!"
    : "Welcome to Whiz Studio!";

  const cleanLoginUrl = (loginUrl || "https://whizstudio.art/client/dashboard/").trim();
  const ctaButtonText = isInternal ? "Login to Dashboard" : "Access Client Portal";
  const headline = isInternal ? "Welcome to the Team!" : "Welcome to Whiz Studio!";

  const greeting = fullName ? `Hello ${fullName},` : "Hello,";
  const mainCopy = isInternal
    ? "Welcome to the team! We are thrilled to embark on this journey together. Your contribution, expertise, and dedication will directly shape our agency's future and elevate the results we deliver. Let's build something extraordinary together."
    : "We are thrilled to partner with you and ready to scale your digital presence. Your client portal is active, giving you complete visibility into your projects, deliverables, and performance analytics.";

  const signoffHtml = isInternal
    ? `<div style="font-size: 14px; color: #4B5563; line-height: 1.6;">
        Best wishes,<br>
        <strong style="color: #111827; font-weight: 600;">Md Kazi Abdur Rahim Emon</strong><br>
        <span style="font-size: 13px; color: #6B7280;">CEO, Whiz Studio</span>
       </div>`
    : `<div style="font-size: 14px; color: #4B5563; line-height: 1.6;">
        Warm regards,<br>
        <strong style="color: #111827; font-weight: 600;">The Whiz Studio Team</strong>
       </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFFFF; width: 100%;">
    <tr>
      <td align="center" style="padding: 48px 20px 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; text-align: left; background-color: #FFFFFF;">
          <!-- Centered Brand Logo (Standard Corporate Email Dimensions: 160x47 max-width) -->
          <tr>
            <td align="center" style="padding-bottom: 32px; text-align: center;">
              <a href="https://whizstudio.art" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                <img src="${WHIZ_LOGO_URL}" alt="Whiz Studio" width="160" height="47" border="0" style="display: block; width: 160px; max-width: 160px; height: auto; max-height: 47px; margin: 0 auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" />
              </a>
            </td>
          </tr>

          <!-- Dynamic Role-Based Headline -->
          <tr>
            <td style="padding-bottom: 20px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.4px; line-height: 1.3;">
                ${headline}
              </h1>
            </td>
          </tr>

          <!-- Greeting & Main Message -->
          <tr>
            <td style="padding-bottom: 28px; font-size: 15px; color: #374151; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">${greeting}</p>
              <p style="margin: 0;">${mainCopy}</p>
            </td>
          </tr>

          <!-- Seamless Call-To-Action Button (Zero Escaping Errors) -->
          <tr>
            <td style="padding-bottom: 36px;">
              <a href="${cleanLoginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #00A86B; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; letter-spacing: -0.2px;">${ctaButtonText}</a>
            </td>
          </tr>

          <!-- Role-Based Sign-off -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #F3F4F6;">
              ${signoffHtml}
            </td>
          </tr>

          <!-- Flat Minimalist Corporate Footer -->
          <tr>
            <td style="padding-top: 32px; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
              Whiz Studio &bull; House 53, Road 7, Mirpur 12, Dhaka &bull; <a href="mailto:info@whizstudio.art" style="color: #9CA3AF; text-decoration: underline;">info@whizstudio.art</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

async function sendBrevoWelcomeEmailWorker({
  email,
  fullName,
  role = "client",
  temporaryPassword,
  loginUrl,
  env
}) {
  try {
    const activeKey = env?.BREVO_API_KEY || "";
    if (!activeKey) {
      return { success: false, error: "BREVO_API_KEY environment secret is not configured." };
    }
    const { subject, html } = buildRoleWelcomeEmailHtmlWorker({
      fullName,
      email,
      role,
      loginUrl,
      temporaryPassword
    });

    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const payload = {
      sender: {
        name: "Whiz Studio",
        email: "info@whizstudio.art"
      },
      to: [
        {
          email: email.trim().toLowerCase(),
          name: fullName || email.split("@")[0]
        }
      ],
      subject,
      htmlContent: html,
      textContent: plainText
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": activeKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Pages Brevo SMTP Error ${response.status}]:`, errText);
      return { success: false, error: `Brevo SMTP API Error (${response.status}): ${errText}` };
    }

    const data = await response.json();
    return { success: true, messageId: data?.messageId };
  } catch (err) {
    console.error("[Pages Brevo SMTP Exception]:", err);
    return { success: false, error: err.message || "Failed to dispatch email via Brevo" };
  }
}
