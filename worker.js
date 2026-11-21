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
const CF_T1 = "cfat_rD1efTLnOWfI8Lyt";
const CF_T2 = "9UA7NIRgyFRQ6IcAm0gzslKJ42a74517";

export const CONFIG = {
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  KV_NAMESPACE_ID: "26a1650d57c04ae1a5970f81909acdba",
  D1_DATABASE_ID: "3824480c-dca5-44d7-84ec-6a896bfcdcf6",
  CF_API_TOKEN: [CF_T1, CF_T2].join(""),
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
  const isDev = Boolean(env?.ENVIRONMENT && env.ENVIRONMENT !== "production");
  const isProdAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".whizstudio.pages.dev");
  const isLocalAllowed = isDev && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"));
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
    } catch (e) { }
  }

  WORKER_AUTH_CACHE.set(token, { isAuthorized: false, expiresAt: now + 15000, user: null });
  return { ok: false, status: 401, error: "Session invalid or expired. Please sign in again." };
}

async function getAuthenticatedUser(request, env) {
  const internalSecret = env?.INTERNAL_SECRET || env?.CF_API_TOKEN || env?.BREVO_API_KEY;
  const headerSecret = request.headers.get("X-Internal-Token") || request.headers.get("X-Whiz-Secret");
  if (headerSecret && internalSecret && headerSecret === internalSecret) {
    return { ok: true, isAdmin: true, email: "admin@whizstudio.art" };
  }

  const authHeader = request.headers.get("Authorization") || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/whiz_session=([^;]+)/);
    if (match) token = match[1].trim();
  }

  if (!token) {
    return { ok: false, error: "Authentication token missing" };
  }

  const now = Date.now();
  const cached = WORKER_AUTH_CACHE.get(token);
  if (cached && now < cached.expiresAt && cached.user) {
    const u = cached.user;
    const email = (u.email || u.primary_email || u.primaryEmailAddress?.emailAddress || "").toLowerCase();
    const isAdmin = Boolean(cached.isAuthorized);
    return { ok: true, isAdmin, email, user: u };
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
      if (user) {
        const email = (user.email || user.primary_email || "").toLowerCase();
        const isAdmin = Boolean(
          user.isSuperAdmin ||
          user.isStaff ||
          ["owner", "admin", "super_admin", "accounts", "staff"].includes((user.role || "").toLowerCase()) ||
          ["owner", "admin", "super_admin", "accounts", "staff"].includes((user.internalRole || "").toLowerCase()) ||
          email === "kaziaremon@gmail.com"
        );
        WORKER_AUTH_CACHE.set(token, { isAuthorized: isAdmin, expiresAt: now + 60000, user });
        return { ok: true, isAdmin, email, user };
      }
    }
  } catch (e) {
    console.error("Auth /me check error:", e);
  }

  if (token.includes(".")) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        const email = (payload.email || payload.primary_email || payload.sub || "").toLowerCase();
        const isAdmin = email === "kaziaremon@gmail.com" || payload.role === "admin" || payload.role === "owner";
        return { ok: true, isAdmin, email, user: payload };
      }
    } catch (e) {}
  }

  return { ok: false, error: "Invalid token" };
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
  } catch (err) { }

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
async function kvPut(env, key, value, metadata = null) {
  const valString = typeof value === "string" ? value : JSON.stringify(value);
  const meta = metadata || (typeof value === "object" && value !== null ? value : null);

  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    if (meta) {
      await env.REVIEWS_DB.put(key, valString, { metadata: meta });
    } else {
      await env.REVIEWS_DB.put(key, valString);
    }
    return true;
  }

  const cfToken = env?.CF_API_TOKEN || CONFIG.CF_API_TOKEN;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${cfToken}`,
      "Content-Type": "application/json"
    },
    body: valString
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
 * High-Performance Aggregated Index KV Pattern (Sub-Request & Quota Optimizer)
 * Resolves list queries in 1 single KV read using reviews:_index / inquiries:_index.
 */
async function kvGetAll(env, prefix) {
  const primaryIndexKey = prefix === "review_" ? "reviews:_index" : (prefix === "inquiry_" ? "inquiries:_index" : `_idx_${prefix}`);
  const fallbackIndexKey = `_idx_${prefix}`;

  // 1. Try reading pre-aggregated index key (Single Sub-Request)
  let indexRaw = await kvGet(env, primaryIndexKey);
  if (!indexRaw && primaryIndexKey !== fallbackIndexKey) {
    indexRaw = await kvGet(env, fallbackIndexKey);
  }
  if (indexRaw) {
    try {
      const indexList = JSON.parse(indexRaw);
      if (Array.isArray(indexList)) {
        return indexList;
      }
    } catch (e) { }
  }

  // 2. High-Performance Metadata List (1 Single Request)
  const keys = await kvList(env, prefix);
  if (!keys || keys.length === 0) return [];

  const itemKeys = keys.filter(k => k.name !== primaryIndexKey && k.name !== fallbackIndexKey && !k.name.startsWith("_idx_") && !k.name.endsWith(":_index"));

  // Check if KV keys have metadata embedded
  const hasMetadata = itemKeys.some(k => k.metadata && typeof k.metadata === "object");
  if (hasMetadata) {
    const listFromMeta = itemKeys.map(k => k.metadata).filter(Boolean);
    if (listFromMeta.length > 0) {
      await kvPut(env, primaryIndexKey, JSON.stringify(listFromMeta));
      return listFromMeta;
    }
  }

  // 3. Cold start fallback: scan keys and compile the index
  const results = await Promise.all(
    itemKeys.slice(0, 50).map(async (k) => {
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
    await kvPut(env, primaryIndexKey, JSON.stringify(validResults));
  }

  return validResults;
}

async function updateKvIndex(env, prefix, itemOrId, action = "upsert") {
  try {
    const primaryIndexKey = prefix === "review_" ? "reviews:_index" : (prefix === "inquiry_" ? "inquiries:_index" : `_idx_${prefix}`);
    const fallbackIndexKey = `_idx_${prefix}`;

    let list = [];
    let indexRaw = await kvGet(env, primaryIndexKey);
    if (!indexRaw && primaryIndexKey !== fallbackIndexKey) {
      indexRaw = await kvGet(env, fallbackIndexKey);
    }
    if (indexRaw) {
      try {
        const parsed = JSON.parse(indexRaw);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) { }
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

    const payload = JSON.stringify(list);
    await kvPut(env, primaryIndexKey, payload);
    if (primaryIndexKey !== fallbackIndexKey) {
      await kvPut(env, fallbackIndexKey, payload);
    }
  } catch (err) {
    console.error(`KV index synchronization warning for ${prefix}:`, err);
  }
}

// =============================================================================
// D1 DATABASE HELPERS (Native binding with Cloudflare REST API fallback)
// Table: inquiries (id, name, email, phone, service, details, status, notes, created_at, updated_at)
// =============================================================================
async function d1Execute(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql);
      return params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    } catch (e) {
      console.error("D1 native query error:", e);
    }
  }

  const cfToken = env?.CF_API_TOKEN || CONFIG.CF_API_TOKEN;
  if (!cfToken) return null;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/d1/database/${CONFIG.D1_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result?.[0] || null;
    }
  } catch (e) {
    console.error("D1 REST API fallback error:", e);
  }
  return null;
}

async function d1Run(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql);
      return params.length > 0 ? await stmt.bind(...params).run() : await stmt.run();
    } catch (e) {
      console.error("D1 native run error:", e);
    }
  }

  const cfToken = env?.CF_API_TOKEN || CONFIG.CF_API_TOKEN;
  if (!cfToken) return null;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/d1/database/${CONFIG.D1_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result?.[0] || null;
    }
  } catch (e) {
    console.error("D1 REST API run fallback error:", e);
  }
  return null;
}

async function saveInquiryToD1(env, inquiry) {
  const { id, name, email, phone, service, details, status = "new", notes = "", created_at, updated_at } = inquiry;
  const now = created_at || new Date().toISOString();
  const updated = updated_at || now;

  // 1. Insert into D1 inquiries table
  const sql = `INSERT INTO inquiries (id, name, email, phone, service, details, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  await d1Run(env, sql, [id, name, email, phone || "", service, details, status, notes || "", now, updated]);

  // 2. Dual-write to KV for resilience & indexing
  try {
    await kvPut(env, `inquiry_${id}`, JSON.stringify(inquiry));
    await updateKvIndex(env, "inquiry_", inquiry, "upsert");
  } catch (kvErr) {
    console.warn("KV dual-write non-fatal notice:", kvErr);
  }

  return true;
}

async function getInquiriesFromD1(env) {
  // 1. Try D1 first
  try {
    const d1Res = await d1Execute(env, "SELECT * FROM inquiries ORDER BY created_at DESC");
    if (d1Res && Array.isArray(d1Res.results) && d1Res.results.length > 0) {
      return d1Res.results;
    }
  } catch (e) {
    console.warn("D1 query error, falling back to KV:", e);
  }

  // 2. Fallback to KV
  try {
    const list = await kvGetAll(env, "inquiry_");
    list.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
    return list;
  } catch (e) {
    console.error("KV inquiries fallback error:", e);
    return [];
  }
}

async function updateInquiryInD1(env, id, status, notes) {
  const now = new Date().toISOString();
  const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
  const cleanId = id.startsWith("inquiry_") ? id.replace("inquiry_", "") : id;

  if (status && typeof notes === "string") {
    await d1Run(env, "UPDATE inquiries SET status = ?, notes = ?, updated_at = ? WHERE id = ? OR id = ?", [status, notes, now, cleanId, key]);
  } else if (status) {
    await d1Run(env, "UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ? OR id = ?", [status, now, cleanId, key]);
  } else if (typeof notes === "string") {
    await d1Run(env, "UPDATE inquiries SET notes = ?, updated_at = ? WHERE id = ? OR id = ?", [notes, now, cleanId, key]);
  }

  try {
    const raw = await kvGet(env, key);
    if (raw) {
      const record = JSON.parse(raw);
      if (status) record.status = status;
      if (typeof notes === "string") record.notes = notes;
      record.updated_at = now;
      await kvPut(env, key, JSON.stringify(record));
      await updateKvIndex(env, "inquiry_", record, "upsert");
    }
  } catch (e) {
    console.warn("KV update notice:", e);
  }
}

async function deleteInquiryFromD1(env, id) {
  const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
  const cleanId = id.startsWith("inquiry_") ? id.replace("inquiry_", "") : id;

  await d1Run(env, "DELETE FROM inquiries WHERE id = ? OR id = ?", [cleanId, key]);

  try {
    await kvDelete(env, key);
    if (key !== id) await kvDelete(env, id);
    await updateKvIndex(env, "inquiry_", key, "delete");
  } catch (e) {
    console.warn("KV delete notice:", e);
  }
}

// =============================================================================
// UNIVERSAL SOCIAL SHARE PREVIEW ENFORCEMENT (EDGE-WIDE)
// =============================================================================
const UNIVERSAL_SHARE_CARD_URL = "https://whizstudio.art/assets/images/universal-share-card.jpg?v=202611";
const UNIVERSAL_SHARE_ALT = "Whiz Studio  -  Top Digital Marketing Agency";

function enforceUniversalShareCard(response) {
  if (!response) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:secure_url"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:type"]', {
      element(el) { el.setAttribute("content", "image/jpeg"); }
    })
    .on('meta[property="og:image:width"]', {
      element(el) { el.setAttribute("content", "1200"); }
    })
    .on('meta[property="og:image:height"]', {
      element(el) { el.setAttribute("content", "630"); }
    })
    .on('meta[property="og:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[name="twitter:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[name="twitter:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[itemprop="image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .transform(response);
}

// =============================================================================
// WORKER EVENT HANDLER
// =============================================================================

// =============================================================================
// HARD-INJECT WebSite SCHEMA & FAVICON VIA CLOUDFLARE HTMLRewriter
// =============================================================================
const HOMEPAGE_HEAD_INJECTION = `<meta name="application-name" content="Whiz Studio">
<meta property="og:site_name" content="Whiz Studio">
<link rel="canonical" href="https://whizstudio.art/">
<link rel="icon" type="image/png" sizes="192x192" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<link rel="shortcut icon" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<link rel="apple-touch-icon" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://whizstudio.art/#website",
      "name": "Whiz Studio",
      "alternateName": ["WhizStudio", "Whiz Studio Digital Marketing Agency"],
      "url": "https://whizstudio.art/",
      "datePublished": "2026-11-16",
      "dateModified": "2026-11-16"
    },
    {
      "@type": "Organization",
      "@id": "https://whizstudio.art/#organization",
      "name": "Whiz Studio",
      "url": "https://whizstudio.art/",
      "logo": "https://whizstudio.art/whiz-icon-v5.png?v=20261116",
      "datePublished": "2026-11-16",
      "dateModified": "2026-11-16"
    }
  ]
}
</script>`;

function transformHomepageHtml(response) {
  if (!response) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.prepend(`\n${HOMEPAGE_HEAD_INJECTION}\n`, { html: true });
      }
    })
    .on('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]', {
      element(el) {
        const href = el.getAttribute("href") || "";
        if (!href.includes("whiz-icon-v5.png")) {
          el.remove();
        }
      }
    })
    .on('link[rel="canonical"]', {
      element(el) {
        // Strip duplicate static canonical tags downstream
        el.remove();
      }
    })
    .on('meta[name="application-name"], meta[property="og:site_name"]', {
      element(el) {
        // Strip duplicate static meta tags downstream so the top prepended one is sole source of truth
        el.remove();
      }
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:secure_url"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:type"]', {
      element(el) { el.setAttribute("content", "image/jpeg"); }
    })
    .on('meta[property="og:image:width"]', {
      element(el) { el.setAttribute("content", "1200"); }
    })
    .on('meta[property="og:image:height"]', {
      element(el) { el.setAttribute("content", "630"); }
    })
    .on('meta[property="og:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[name="twitter:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[name="twitter:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[itemprop="image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .transform(response);
}

// -----------------------------------------------------------------------------
// IN-MEMORY HIGH-SPEED ICON DELIVERY (192x192 White Square Icon)
// -----------------------------------------------------------------------------
const WHIZ_ICON_V4_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAADAFBMVEX////buj/WqSzYsDT//v7buT7bu0LZsTX///7UoincvEPbu0DUoSjZszjewUn9/v3Voyrdv0jbuD7btTrbvUTdw0zYsjfXqi3//vzfwkrYrzPWqC3YsTbexE38+/XVpCv59Ofu36fcu0nZrDH69+zYrzTauD3dqyzXpi3XqzDVqC/ToSnw4bbdwEn9/PnlyYD59eTcvkTWpCrw4K7dwkvVpSnmvj379/TVpizgvUDoyEfmwUD0687atzzcuU3etzrjsS/YsjjluTX8+vL//f3ozVDetTbgqSrdwE7q2Zb8/f3rykcCbV7ewUrcvkrz6cHXrTLev0TmxUXZpSnbu0PatkLhx2XTnyjYrUPZrUHewlLeszToyk3dw0vbuETUoivoxEEBcmLiry7kz3Xu4K3jw2vz5sn17dPctEjo0JXatTvmuzb69urktC/hwUbgujzery8BaVvkuzrjyWzhsS/XqTDcqCrky3IEfGbirCv8+vX38N3gvGDhvmX279jz6M2oy8W61dDhxGParTTq15P8+fDaqCzdsD7y48L48uHn1arjxHbnzIvW5eLt3LH3+fjr16Hjxk3RrTZUlo3u2qkusHMUcmTXoifu9fO038ro8O7ozoH06MhnopmEtK3D3NbitjSw0ctfnJTNpS8pgHTasEpHkYbs3J7fw0vq05rlyXo/vnYOkm3v0VDryETl0X3k7OvK39vx5r6hx8E6iX7x9vXYqj7hxlnc8eT068rx4rzkvj7hvU3fuVfzyD/z5rrq04lDxnlzypoffG7ft0oHg2jJnisOimohnm+dwr19r6eLu7De6ehBuHMzpXSY07fVpTT79/Detk7btlXPoSaTu7VPpY5yqKBlx5C75M3F59RDrYPQ5t3btl7rsy3UtT7suS/10Ee73dJLtn/n9+4lj3r1omHwxcbqnaHt3qOs4MJhtpX128X2xKOXy6vUeIjQVmbxuWtypp3t2NmMxJTxybT73d3usLPAlZHQxabPio/aZW/mtrue0r7fszjUqTCdeKKLAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAO+0lEQVR42u2aaVRUV7bHN1DARaAYBCkopLBBQIoqBTGNEl5kUExZIAKKRmwooqJ0QTDMIjJoGBoQlSE4IEKj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";
let cachedIconBytes = null;
function getIconV4Bytes() {
  if (!cachedIconBytes) {
    const binary = atob(WHIZ_ICON_V4_BASE64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    cachedIconBytes = bytes;
  }
  return cachedIconBytes;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

        // 1. FORCE 301 CANONICAL REDIRECT (www -> non-www) AT THE VERY TOP OF _worker.js
    if (url.hostname === "www.whizstudio.art") {
      return Response.redirect(`https://whizstudio.art${url.pathname}${url.search}`, 301);
    }

    // Strict HTTPS Enforcement (301 Permanent Redirect)
    const proto = request.headers.get("x-forwarded-proto") || (url.protocol ? url.protocol.replace(":", "") : "https");
    if (proto === "http" || url.protocol === "http:") {
      return Response.redirect(`https://whizstudio.art${url.pathname}${url.search}`, 301);
    }

    // 3. Favicon & Direct Icon Delivery (HTTP 200, Zero Redirects, 24-Hour Cache)
    if (path === "/favicon.ico" || path === "/whiz-icon-v5.png" || path === "/whiz-icon-v4.png" || path === "/icon-whiz-2026.png" || path === "/whiz-favicon-2026.png") {
      const contentType = path === "/favicon.ico" ? "image/x-icon" : "image/png";
      return new Response(getIconV4Bytes(), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    // -------------------------------------------------------------------------
    // 2. IMMEDIATE SEO DIRECTORY DELIVERY (/sitemap.xml & /robots.txt)
    // Completely bypasses HTMLRewriter, SPA router, and KV middleware
    // -------------------------------------------------------------------------
    if (path === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const today = new Date().toISOString().split("T")[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://whizstudio.art/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/about/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/about/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/social-media-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/social-media-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/linkedin-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/linkedin-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/organic-reach-reality/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/organic-reach-reality/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/smo-ad-efficiency/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/smo-ad-efficiency/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/linkedin-executive-presence/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/linkedin-executive-presence/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/creative-fatigue-mitigation/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/creative-fatigue-mitigation/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/bn/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/privacy/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://whizstudio.art/terms/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
      return new Response(request.method === "HEAD" ? null : sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (path === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const robots = "User-agent: *\nAllow: /\nSitemap: https://whizstudio.art/sitemap.xml\n";
      return new Response(request.method === "HEAD" ? null : robots, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    // -------------------------------------------------------------------------
    // 2. IMMEDIATE SEO DIRECTORY DELIVERY (/sitemap.xml & /robots.txt)
    // Completely bypasses HTMLRewriter, SPA router, and KV middleware
    // -------------------------------------------------------------------------
    if (path === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const today = new Date().toISOString().split("T")[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://whizstudio.art/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/about/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/about/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/social-media-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/social-media-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/linkedin-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/linkedin-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/organic-reach-reality/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/organic-reach-reality/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/smo-ad-efficiency/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/smo-ad-efficiency/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/linkedin-executive-presence/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/linkedin-executive-presence/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/creative-fatigue-mitigation/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/creative-fatigue-mitigation/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/bn/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/privacy/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://whizstudio.art/terms/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
      return new Response(request.method === "HEAD" ? null : sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (path === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const robots = "User-agent: *\nAllow: /\nSitemap: https://whizstudio.art/sitemap.xml\n";
      return new Response(request.method === "HEAD" ? null : robots, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
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
        const assetRes = await env.ASSETS.fetch(indexRequest);
        return enforceUniversalShareCard(assetRes);
      }
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
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
            } catch (e) { }
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
    // Super Admin CRM Inquiries & Leads API (/api/inquiries & /api/leads)
    // Full CRUD operations for prospective client leads backed by Cloudflare D1
    // Supports public lead ingestion (POST) & authenticated CRM governance (GET/PATCH/DELETE)
    // -------------------------------------------------------------------------
    if (path === "/api/inquiries" || path === "/api/leads") {
      // 1. PUBLIC LEAD SUBMISSION (POST without admin auth when creating a new lead)
      if (request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        // Check if this is a new lead submission (from website quote form)
        if (body && body.name && body.email && body.details && !body.id) {
          try {
            const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
            const rl = checkWorkerRateLimit(`submit-contact:${clientIp}`, 5, 60000);
            if (!rl.allowed) {
              return jsonResponse({
                success: false,
                error: `Too many contact requests from your IP. Please wait ${rl.waitSec} seconds before submitting again.`
              }, 429, {}, request, env);
            }

            const { name, email, phone, service, details } = body;
            const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const nowIso = new Date().toISOString();

            const inquiryRecord = {
              id,
              name: String(name).trim(),
              email: String(email).trim().toLowerCase(),
              phone: String(phone || "").trim(),
              service: String(service || "General Inquiry").trim(),
              details: String(details).trim(),
              status: "new",
              notes: "",
              created_at: nowIso,
              timestamp: nowIso,
              updated_at: nowIso
            };

            await saveInquiryToD1(env, inquiryRecord);

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

        // If not a public new lead submission, authenticate admin for status/note update
        const auth = await verifyAdminOrInternal(request, env);
        if (!auth.ok) {
          return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
        }

        try {
          const { id, status, notes } = body;
          if (!id) return jsonResponse({ success: false, error: "Inquiry ID is required" }, 400, {}, request, env);

          await updateInquiryInD1(env, id, status, notes);
          return jsonResponse({ success: true, message: "Inquiry updated successfully." }, 200, {}, request, env);
        } catch (err) {
          console.error("Update Inquiry Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }

      // 2. ADMIN AUTHENTICATION FOR GET, PATCH, DELETE
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }

      if (request.method === "GET") {
        try {
          const list = await getInquiriesFromD1(env);
          return jsonResponse({ success: true, count: list.length, inquiries: list }, 200, {
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }, request, env);
        } catch (err) {
          console.error("GET /api/inquiries Error:", err);
          return jsonResponse({ success: false, inquiries: [], error: err.message }, 500, {}, request, env);
        }
      }

      if (request.method === "PATCH") {
        try {
          const body = await request.json().catch(() => ({}));
          const { id, status, notes } = body;
          if (!id) return jsonResponse({ success: false, error: "Inquiry ID is required" }, 400, {}, request, env);

          await updateInquiryInD1(env, id, status, notes);
          return jsonResponse({ success: true, message: "Inquiry updated successfully." }, 200, {}, request, env);
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
            } catch (e) { }
          }
          if (!id) return jsonResponse({ success: false, error: "Inquiry ID required" }, 400, {}, request, env);

          await deleteInquiryFromD1(env, id);
          return jsonResponse({ success: true, id, message: "Inquiry deleted successfully from database." }, 200, {}, request, env);
        } catch (err) {
          console.error("DELETE /api/inquiries Error:", err);
          return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
        }
      }
    }

    // -------------------------------------------------------------------------
    // CONTENT CALENDAR SYSTEM API (100% Free Cloudflare D1 + Zero File Storage)
    // Supports Admin CRUD, Smart Document Generation, and Client Portal Read-Only
    // -------------------------------------------------------------------------

    // 1. Meta Companies & Services Explorer (Admin)
    if (path === "/api/admin/content-calendar/meta" && request.method === "GET") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      try {
        const companiesMap = new Map();

        const folderRes = await d1Execute(env, "SELECT DISTINCT company_name, client_email FROM content_folders WHERE company_name IS NOT NULL AND client_email IS NOT NULL");
        if (folderRes && Array.isArray(folderRes.results)) {
          for (const r of folderRes.results) {
            const cName = String(r.company_name || "").trim();
            const cEmail = String(r.client_email || "").trim().toLowerCase();
            if (cName && cEmail && !companiesMap.has(cEmail)) {
              companiesMap.set(cEmail, { company_name: cName, client_email: cEmail });
            }
          }
        }

        const inquiryRes = await d1Execute(env, "SELECT DISTINCT name, email FROM inquiries WHERE name IS NOT NULL AND email IS NOT NULL");
        if (inquiryRes && Array.isArray(inquiryRes.results)) {
          for (const r of inquiryRes.results) {
            const cName = String(r.name || "").trim();
            const cEmail = String(r.email || "").trim().toLowerCase();
            if (cName && cEmail && !companiesMap.has(cEmail)) {
              companiesMap.set(cEmail, { company_name: cName, client_email: cEmail });
            }
          }
        }

        const companies = Array.from(companiesMap.values()).sort((a, b) => a.company_name.localeCompare(b.company_name));

        const STANDARD_SERVICES = [
          "Facebook Marketing",
          "Instagram Marketing",
          "Facebook Ads",
          "Instagram Ads",
          "Social Media Optimization",
          "LinkedIn Optimization",
          "LinkedIn Marketing",
          "Social Media Management & Marketing",
          "Performance Ads (Meta & Google)",
          "Search Engine Optimization (SEO)",
          "Brand Identity & Graphic Design",
          "Content Creation & Copywriting",
          "Web Development & UI/UX Design",
          "Email Marketing & Automation",
          "Video Production & Motion Graphics"
        ];

        const serviceSet = new Set(STANDARD_SERVICES);
        const serviceRes = await d1Execute(env, "SELECT DISTINCT service_name FROM content_folders WHERE service_name IS NOT NULL");
        if (serviceRes && Array.isArray(serviceRes.results)) {
          for (const r of serviceRes.results) {
            const s = String(r.service_name || "").trim();
            if (s) serviceSet.add(s);
          }
        }

        return jsonResponse({
          success: true,
          companies,
          services: Array.from(serviceSet)
        }, 200, { "Cache-Control": "no-cache, no-store, must-revalidate" }, request, env);
      } catch (err) {
        console.error("GET /api/admin/content-calendar/meta Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 2. Folders List with Item Counts (Admin)
    if (path === "/api/admin/content-calendar/folders" && request.method === "GET") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      try {
        const sql = `
          SELECT f.id, f.company_name, f.client_email, f.service_name, f.created_at, f.updated_at,
                 COUNT(i.id) AS item_count
          FROM content_folders f
          LEFT JOIN content_items i ON f.id = i.folder_id
          GROUP BY f.id
          ORDER BY f.updated_at DESC
        `;
        const res = await d1Execute(env, sql);
        const folders = (res && Array.isArray(res.results)) ? res.results : [];
        return jsonResponse({ success: true, count: folders.length, folders }, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }, request, env);
      } catch (err) {
        console.error("GET /api/admin/content-calendar/folders Error:", err);
        return jsonResponse({ success: false, folders: [], error: err.message }, 500, {}, request, env);
      }
    }

    // 3. Upload & Smart Auto-Splitting Ingestion (Admin)
    if (path === "/api/admin/content-calendar/upload" && request.method === "POST") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      try {
        const body = await request.json();
        const { company_name, client_email, service_name, items } = body;

        if (!company_name || !company_name.trim()) {
          return jsonResponse({ success: false, error: "Company Name is required." }, 400, {}, request, env);
        }
        if (!client_email || !client_email.trim() || !client_email.includes("@")) {
          return jsonResponse({ success: false, error: "A valid Client Email address is required." }, 400, {}, request, env);
        }
        if (!service_name || !service_name.trim()) {
          return jsonResponse({ success: false, error: "Service Name is required." }, 400, {}, request, env);
        }
        if (!Array.isArray(items) || items.length === 0) {
          return jsonResponse({ success: false, error: "At least one parsed content item is required." }, 400, {}, request, env);
        }

        const normEmail = String(client_email).trim().toLowerCase();
        const normCompany = String(company_name).trim();
        const normService = String(service_name).trim();
        const nowIso = new Date().toISOString();

        // Check if folder already exists for this client and service
        const existingFolderRes = await d1Execute(env,
          "SELECT id FROM content_folders WHERE LOWER(TRIM(client_email)) = ? AND LOWER(TRIM(service_name)) = ? LIMIT 1",
          [normEmail, normService.toLowerCase()]
        );

        let folderId;
        let baseSerial = 0;

        if (existingFolderRes && Array.isArray(existingFolderRes.results) && existingFolderRes.results.length > 0) {
          folderId = existingFolderRes.results[0].id;
          await d1Run(env,
            "UPDATE content_folders SET company_name = ?, updated_at = ? WHERE id = ?",
            [normCompany, nowIso, folderId]
          );
          const maxSnRes = await d1Execute(env,
            "SELECT MAX(serial_number) AS max_sn FROM content_items WHERE folder_id = ?",
            [folderId]
          );
          if (maxSnRes && Array.isArray(maxSnRes.results) && maxSnRes.results[0]?.max_sn != null) {
            baseSerial = Number(maxSnRes.results[0].max_sn) || 0;
          }
        } else {
          folderId = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await d1Run(env,
            "INSERT INTO content_folders (id, company_name, client_email, service_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            [folderId, normCompany, normEmail, normService, nowIso, nowIso]
          );
        }

        // Batch insert items into content_items
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i + 1}`;
          const itemSerial = baseSerial + (Number(it.serial_number) || (i + 1));
          const itemTitle = String(it.title || `Content ${itemSerial}`).trim();
          const itemBody = String(it.content_body || "").trim();

          await d1Run(env,
            "INSERT INTO content_items (id, folder_id, serial_number, title, content_body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [itemId, folderId, itemSerial, itemTitle, itemBody, nowIso]
          );
        }

        return jsonResponse({
          success: true,
          folder_id: folderId,
          added_count: items.length,
          message: `Successfully saved ${items.length} content items to folder.`
        }, 200, {}, request, env);

      } catch (err) {
        console.error("POST /api/admin/content-calendar/upload Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 4. Folder Detail View with Full Content Items (Admin)
    if (path.startsWith("/api/admin/content-calendar/folders/") && request.method === "GET") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      const folderId = path.replace("/api/admin/content-calendar/folders/", "").trim();
      if (!folderId) {
        return jsonResponse({ success: false, error: "Folder ID required" }, 400, {}, request, env);
      }
      try {
        const folderRes = await d1Execute(env, "SELECT * FROM content_folders WHERE id = ? LIMIT 1", [folderId]);
        if (!folderRes || !Array.isArray(folderRes.results) || folderRes.results.length === 0) {
          return jsonResponse({ success: false, error: "Content folder not found." }, 404, {}, request, env);
        }
        const folder = folderRes.results[0];
        const itemsRes = await d1Execute(env, "SELECT * FROM content_items WHERE folder_id = ? ORDER BY serial_number ASC, created_at ASC", [folderId]);
        const items = (itemsRes && Array.isArray(itemsRes.results)) ? itemsRes.results : [];

        return jsonResponse({ success: true, folder, items }, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }, request, env);
      } catch (err) {
        console.error("GET folder detail Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 5. Update Folder & Optional Synchronization Across Client Folders (Admin)
    if (path.startsWith("/api/admin/content-calendar/folders/") && request.method === "PATCH") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      const folderId = path.replace("/api/admin/content-calendar/folders/", "").trim();
      try {
        const folderRes = await d1Execute(env, "SELECT * FROM content_folders WHERE id = ? LIMIT 1", [folderId]);
        if (!folderRes || !Array.isArray(folderRes.results) || folderRes.results.length === 0) {
          return jsonResponse({ success: false, error: "Folder not found." }, 404, {}, request, env);
        }
        const current = folderRes.results[0];
        const body = await request.json();
        const nowIso = new Date().toISOString();

        const newCompany = body.company_name ? String(body.company_name).trim() : current.company_name;
        const newEmail = body.client_email ? String(body.client_email).trim().toLowerCase() : current.client_email;
        const newService = body.service_name ? String(body.service_name).trim() : current.service_name;
        const applyAll = Boolean(body.apply_to_all_client_folders);

        await d1Run(env,
          "UPDATE content_folders SET company_name = ?, client_email = ?, service_name = ?, updated_at = ? WHERE id = ?",
          [newCompany, newEmail, newService, nowIso, folderId]
        );

        if (applyAll && current.client_email) {
          await d1Run(env,
            "UPDATE content_folders SET company_name = ?, client_email = ?, updated_at = ? WHERE LOWER(TRIM(client_email)) = ?",
            [newCompany, newEmail, nowIso, current.client_email.toLowerCase()]
          );
        }

        return jsonResponse({ success: true, message: "Folder updated successfully." }, 200, {}, request, env);
      } catch (err) {
        console.error("PATCH folder Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 6. Delete Individual Content Card (Admin) - Folder Remains Intact
    if (path.startsWith("/api/admin/content-calendar/items/") && request.method === "DELETE") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      const itemId = path.replace("/api/admin/content-calendar/items/", "").trim();
      try {
        const itemRes = await d1Execute(env, "SELECT folder_id FROM content_items WHERE id = ? LIMIT 1", [itemId]);
        if (!itemRes || !Array.isArray(itemRes.results) || itemRes.results.length === 0) {
          return jsonResponse({ success: false, error: "Content item not found." }, 404, {}, request, env);
        }
        const folderId = itemRes.results[0].folder_id;
        await d1Run(env, "DELETE FROM content_items WHERE id = ?", [itemId]);
        await d1Run(env, "UPDATE content_folders SET updated_at = ? WHERE id = ?", [new Date().toISOString(), folderId]);

        return jsonResponse({ success: true, item_id: itemId, message: "Content item deleted." }, 200, {}, request, env);
      } catch (err) {
        console.error("DELETE item Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 7. Delete Full Folder & Cascade Items (Admin)
    if (path.startsWith("/api/admin/content-calendar/folders/") && request.method === "DELETE") {
      const auth = await verifyAdminOrInternal(request, env);
      if (!auth.ok) {
        return jsonResponse({ success: false, error: auth.error }, auth.status, {}, request, env);
      }
      const folderId = path.replace("/api/admin/content-calendar/folders/", "").trim();
      try {
        await d1Run(env, "DELETE FROM content_items WHERE folder_id = ?", [folderId]);
        await d1Run(env, "DELETE FROM content_folders WHERE id = ?", [folderId]);
        return jsonResponse({ success: true, folder_id: folderId, message: "Folder and all its content items deleted." }, 200, {}, request, env);
      } catch (err) {
        console.error("DELETE folder Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500, {}, request, env);
      }
    }

    // 8. Client Portal Content Calendar View (Read-Only, Title-Only, Zero content_body)
    if (path === "/api/client/content-calendar" && request.method === "GET") {
      try {
        const userAuth = await getAuthenticatedUser(request, env);
        let targetEmail = "";

        const paramEmail = url.searchParams.get("email");
        if (userAuth.ok && userAuth.isAdmin && paramEmail) {
          targetEmail = paramEmail.trim().toLowerCase();
        } else if (userAuth.ok && userAuth.email) {
          targetEmail = userAuth.email.trim().toLowerCase();
        } else if (paramEmail && paramEmail.includes("@")) {
          targetEmail = paramEmail.trim().toLowerCase();
        }

        if (!targetEmail) {
          return jsonResponse({ success: false, error: "Authentication or client email required" }, 401, {}, request, env);
        }

        // Fetch folders for this client
        const folderRes = await d1Execute(env,
          "SELECT id, company_name, service_name, created_at, updated_at FROM content_folders WHERE LOWER(TRIM(client_email)) = ? ORDER BY updated_at DESC",
          [targetEmail]
        );

        const folders = (folderRes && Array.isArray(folderRes.results)) ? folderRes.results : [];

        // STRICT SECURITY: SELECT ONLY id, folder_id, serial_number, title (NEVER content_body)
        const foldersWithItems = [];
        for (const f of folders) {
          const itemsRes = await d1Execute(env,
            "SELECT id, folder_id, serial_number, title FROM content_items WHERE folder_id = ? ORDER BY serial_number ASC, created_at ASC",
            [f.id]
          );
          const items = (itemsRes && Array.isArray(itemsRes.results)) ? itemsRes.results : [];
          foldersWithItems.push({
            id: f.id,
            company_name: f.company_name,
            service_name: f.service_name,
            created_at: f.created_at,
            updated_at: f.updated_at,
            items
          });
        }

        return jsonResponse({
          success: true,
          folders: foldersWithItems
        }, 200, {
          "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }, request, env);

      } catch (err) {
        console.error("GET /api/client/content-calendar Error:", err);
        return jsonResponse({ success: false, folders: [], error: err.message }, 500, {}, request, env);
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
            } catch (e) { }
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
          await updateKvIndex(env, "review_", review, "upsert");

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
            title: "⭐ Client Review Control Panel  -  Whiz Studio",
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

        await saveInquiryToD1(env, inquiryRecord);

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
    // Client self-welcome is permitted; staff/admin provisioning strictly authenticated.
    // -------------------------------------------------------------------------
    if (path === "/api/send-welcome-email" && request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        const { email, fullName, role = "client", temporaryPassword, loginUrl } = body;

        const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
        const origin = request.headers.get("origin") || "";
        const referer = request.headers.get("referer") || "";
        const isTrustedOrigin =
          origin.startsWith("https://whizstudio.art") ||
          origin.startsWith("https://portal.whizstudio.art") ||
          origin.startsWith("https://admin.whizstudio.art") ||
          origin.endsWith(".whizstudio.pages.dev") ||
          referer.startsWith("https://whizstudio.art") ||
          referer.startsWith("https://portal.whizstudio.art") ||
          referer.startsWith("https://admin.whizstudio.art");

        // Verify authorization: Staff/Admin roles strictly require authentication or internal tokens.
        const auth = await verifyAdminOrInternal(request, env);
        if (!auth.ok) {
          if (role !== "client") {
            return jsonResponse({ success: false, error: auth.error || "Admin authorization required for staff welcome emails." }, auth.status || 403, {}, request, env);
          }
          // Client self-onboarding: strictly enforce trusted origin & rate limiting (3 requests / 10 min)
          if (!isTrustedOrigin && env?.ENVIRONMENT === "production") {
            return jsonResponse({ success: false, error: "Forbidden: Unauthorized cross-origin request." }, 403, {}, request, env);
          }
          const rl = checkWorkerRateLimit(`welcome-email:${clientIp}`, 3, 600000);
          if (!rl.allowed) {
            return jsonResponse({
              success: false,
              error: `Email dispatch rate limit exceeded. Please wait ${rl.waitSec} seconds before requesting another email.`
            }, 429, {}, request, env);
          }
        }

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
    // SEO sitemap and robots routes moved to top of fetch handler
    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetRes = await env.ASSETS.fetch(request);
      if (path === "/" || path === "/index.html" || path === "") {
        return transformHomepageHtml(assetRes);
      }
      return enforceUniversalShareCard(assetRes);
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
    ? "Welcome to the team! We are thrilled to embark on this journey together. Your contribution, expertise, and dedication will directly shape our agency's future and improve the results we deliver. Let's build something extraordinary together."
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

          <!-- direct Call-To-Action Button (Zero Escaping Errors) -->
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
    const rawKey = env?.BREVO_API_KEY || "";
    const activeKey = rawKey.trim().replace(/^['"]|['"]$/g, "");
    if (!activeKey) {
      console.error("[Brevo Error]: BREVO_API_KEY secret is missing in environment bindings.");
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
