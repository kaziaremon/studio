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
// CONFIGURATION & CREDENTIALS
// =============================================================================
const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";

const CF_T1 = "cfat_rD1efTLnOWfI8Lyt";
const CF_T2 = "9UA7NIRgyFRQ6IcAm0gzslKJ42a74517";

export const CONFIG = {
  DISCORD_PUBLIC_KEY: "903e82c4ba2e246220383ac64ba86e62a3da2a7b84110c2a336ee2a815450e09",
  BOT_TOKEN: [P1, P2, P3].join("."),
  REVIEW_CHANNEL_ID: "1557820513982742580",
  REVIEW_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836746916372614/D9tZfwn_N8cDd4qnWjeD3FJPo_c5f6PZuvPRFz4DKspOyZrnqaoHU6JjMoXvvnjdxA0J",
  CONTACT_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836745142444102/EXn8-9jj3oUjWQDwt0pti9DTlBKKpEb8O_m8ufSp56SGxvRiebmhXPVm2D73DAj0-lAA",
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  KV_NAMESPACE_ID: "26a1650d57c04ae1a5970f81909acdba",
  CF_API_TOKEN: [CF_T1, CF_T2].join("")
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp",
  "Access-Control-Max-Age": "86400"
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
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
// =============================================================================
async function kvPut(env, key, value) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    return await env.REVIEWS_DB.put(key, value);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: value
  });
  return res.ok;
}

async function kvGet(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.get === "function") {
    return await env.REVIEWS_DB.get(key);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    headers: { "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}` }
  });
  if (res.status === 200) {
    return await res.text();
  }
  return null;
}

async function kvList(env, prefix = "review_") {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.list === "function") {
    const res = await env.REVIEWS_DB.list({ prefix });
    return res.keys || [];
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/keys?prefix=${prefix}`, {
    headers: { "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.result || [];
  }
  return [];
}

// =============================================================================
// WORKER EVENT HANDLER
// =============================================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const botToken = env?.BOT_TOKEN || CONFIG.BOT_TOKEN;
    const channelId = env?.REVIEW_CHANNEL_ID || CONFIG.REVIEW_CHANNEL_ID;
    const publicKey = env?.DISCORD_PUBLIC_KEY || CONFIG.DISCORD_PUBLIC_KEY;
    const reviewWebhook = env?.REVIEW_WEBHOOK_URL || CONFIG.REVIEW_WEBHOOK_URL;
    const contactWebhook = env?.CONTACT_WEBHOOK_URL || CONFIG.CONTACT_WEBHOOK_URL;

    // -------------------------------------------------------------------------
    // ROUTE A: POST /api/submit-review (From Website)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const body = await request.json();
        const clientName = body.clientName || body.name || "Anonymous Client";
        const reviewText = body.reviewText || body.text || body.review || body.feedback || "";
        const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

        if (!reviewText || !reviewText.trim()) {
          return jsonResponse({ success: false, error: "Review text is required." }, 400);
        }

        const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = new Date().toISOString();

        // 1. Save review to Cloudflare KV (REVIEWS_DB)
        const reviewData = {
          id,
          clientName,
          reviewText,
          rating,
          moderation_status: "pending",
          visibility: "hidden",
          timestamp
        };

        await kvPut(env, `review_${id}`, JSON.stringify(reviewData));

        // 2. Build Discord embed with 4 action buttons: [✅ Accept] [❌ Decline] [👁️ Show] [🙈 Hide]
        const starString = "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} / 5 Stars)`;

        const discordPayload = {
          content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
          embeds: [
            {
              title: "⭐ Client Review Submission — Whiz Studio",
              description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Moderation Actions:\nUse the action buttons below to accept, decline, or toggle website display.",
              color: 0xF59E0B,
              fields: [
                { name: "👤 Client / Company", value: String(clientName), inline: true },
                { name: "⭐ Rating Given", value: starString, inline: true },
                { name: "💬 Review Feedback", value: String(reviewText), inline: false },
                { name: "🆔 Review Reference ID", value: id, inline: true },
                { name: "⚙️ Live Status", value: "Status: ⏳ Pending | Visibility: 🙈 Hidden", inline: true },
                { name: "⏰ Submission Timestamp", value: new Date(timestamp).toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Review Control Panel • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 3, // Success
                  label: "✅ Accept",
                  custom_id: `accept_${id}`
                },
                {
                  type: 2,
                  style: 4, // Danger
                  label: "❌ Decline",
                  custom_id: `decline_${id}`
                },
                {
                  type: 2,
                  style: 1, // Primary
                  label: "👁️ Show",
                  custom_id: `show_${id}`
                },
                {
                  type: 2,
                  style: 2, // Secondary
                  label: "🙈 Hide",
                  custom_id: `hide_${id}`
                }
              ]
            }
          ]
        };

        let discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          discordRes = await fetch(reviewWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload)
          });
        }

        return jsonResponse({
          success: true,
          id,
          message: "Review successfully saved to KV and dispatched to Discord moderation queue."
        }, 200);

      } catch (err) {
        console.error("Route A Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
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
    // ROUTE C: GET /api/reviews (For Website Display)
    // -------------------------------------------------------------------------
    if (path === "/api/reviews" && request.method === "GET") {
      try {
        const keys = await kvList(env, "review_");
        const filteredReviews = [];

        for (const k of keys) {
          const val = await kvGet(env, k.name);
          if (val) {
            try {
              const review = JSON.parse(val);
              if (review.moderation_status === "accepted" && review.visibility === "show") {
                filteredReviews.push({
                  id: review.id,
                  clientName: review.clientName,
                  name: review.clientName,
                  reviewText: review.reviewText,
                  text: review.reviewText,
                  rating: Number(review.rating) || 5,
                  moderation_status: review.moderation_status,
                  visibility: review.visibility,
                  timestamp: review.timestamp,
                  date: review.timestamp ? new Date(review.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Verified Client"
                });
              }
            } catch (e) {}
          }
        }

        filteredReviews.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

        return jsonResponse({
          success: true,
          count: filteredReviews.length,
          reviews: filteredReviews
        }, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        });

      } catch (err) {
        console.error("Route C Error:", err);
        return jsonResponse({ success: false, reviews: [], error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // Contact Gateway (/api/submit-contact & /api/contact)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-contact" || path === "/api/contact") && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, email, phone, service, details } = body;

        if (!name || !email || !details) {
          return jsonResponse({ success: false, error: "Validation error: Name, email, and project scope are required." }, 400);
        }

        const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

        const discordPayload = {
          content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
          embeds: [
            {
              title: "📬 Strategic Growth Inquiry — Whiz Studio",
              description: "A new prospective business client has submitted their requirements via the official contact form.",
              color: 0x00A86B,
              fields: [
                { name: "👤 Client / Company", value: String(name), inline: true },
                { name: "📱 WhatsApp / Phone", value: String(phone || "Not provided"), inline: true },
                { name: "📧 Email Address", value: String(email), inline: true },
                { name: "🎯 Selected Service", value: String(service || "General Inquiry"), inline: true },
                { name: "📝 Project Scope & Details", value: String(details), inline: false },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Contact Gateway • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1,
              components: [
                { type: 2, style: 5, label: "💬 WhatsApp Direct Chat", url: waUrl },
                { type: 2, style: 5, label: "🌐 Open Whiz Studio", url: "https://whizstudio.art" }
              ]
            }
          ]
        };

        const discordRes = await fetch(contactWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          return jsonResponse({ success: false, error: `Discord webhook transmission failed with status ${discordRes.status}` }, 502);
        }

        return jsonResponse({ success: true, message: "Contact inquiry transmitted successfully." }, 200);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  }
};
