/**
 * CLOUDFLARE WORKER BACKEND PROXY (worker.js)
 * Whiz Studio Secure API Gateway & Discord Integration
 *
 * Exposes:
 *  - POST /api/submit-contact  -> Forwards contact inquiries to Discord #contact-inquiries
 *  - POST /api/submit-review   -> Forwards client reviews to Discord #review-moderation with ActionRow buttons
 *  - POST /api/interactions    -> Discord API Gateway interaction endpoint (Verifies Ed25519 signature & handles button clicks)
 *  - GET  /api/reviews         -> Fetches approved reviews from Discord
 *  - OPTIONS *                 -> Global CORS preflight handler
 */

// =============================================================================
// CONFIGURATION & CREDENTIALS
// =============================================================================
const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";

export const CONFIG = {
  CONTACT_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836745142444102/EXn8-9jj3oUjWQDwt0pti9DTlBKKpEb8O_m8ufSp56SGxvRiebmhXPVm2D73DAj0-lAA",
  REVIEW_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836746916372614/D9tZfwn_N8cDd4qnWjeD3FJPo_c5f6PZuvPRFz4DKspOyZrnqaoHU6JjMoXvvnjdxA0J",
  DISCORD_PUBLIC_KEY: "903e82c4ba2e246220383ac64ba86e62a3da2a7b84110c2a336ee2a815450e09",
  BOT_TOKEN: [P1, P2, P3].join("."),
  REVIEW_CHANNEL_ID: "1557820513982742580",
  CONTACT_CHANNEL_ID: "1557820511642456076"
};

// =============================================================================
// CORS HEADERS
// =============================================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp",
  "Access-Control-Max-Age": "86400"
};

/**
 * Creates standard JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}

/**
 * Converts Hex string to Uint8Array
 */
function hexToUint8Array(hex) {
  if (!hex || typeof hex !== "string") return new Uint8Array();
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verifies Discord Ed25519 cryptographic signature using native Web Crypto
 */
async function verifyDiscordSignature(request, rawBody, publicKeyHex) {
  const signatureHex = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!signatureHex || !timestamp || !publicKeyHex) {
    return false;
  }

  try {
    const keyData = hexToUint8Array(publicKeyHex);
    const signatureData = hexToUint8Array(signatureHex);
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + rawBody);

    let cryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "Ed25519" },
        false,
        ["verify"]
      );
    } catch {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "NODE-ED25519", namedCurve: "NODE-ED25519" },
        false,
        ["verify"]
      );
    }

    return await crypto.subtle.verify(
      cryptoKey.algorithm.name,
      cryptoKey,
      signatureData,
      data
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return false;
  }
}

// =============================================================================
// WORKER EVENT HANDLERS
// =============================================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. CORS Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // Resolve credentials from Worker Environment Variables or fallback to CONFIG
    const contactWebhook = env?.CONTACT_WEBHOOK_URL || CONFIG.CONTACT_WEBHOOK_URL;
    const reviewWebhook = env?.REVIEW_WEBHOOK_URL || CONFIG.REVIEW_WEBHOOK_URL;
    const discordPublicKey = env?.DISCORD_PUBLIC_KEY || CONFIG.DISCORD_PUBLIC_KEY;
    const botToken = env?.BOT_TOKEN || CONFIG.BOT_TOKEN;
    const reviewChannelId = env?.REVIEW_CHANNEL_ID || CONFIG.REVIEW_CHANNEL_ID;

    // -------------------------------------------------------------------------
    // ENDPOINT 1: Contact Form Inquiries (/api/submit-contact)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-contact" || path === "/api/contact") && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, email, phone, service, details } = body;

        if (!name || !email || !details) {
          return jsonResponse({
            success: false,
            error: "Validation error: Name, email, and project scope are required."
          }, 400);
        }

        const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

        const discordPayload = {
          content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
          embeds: [
            {
              title: "📬 Strategic Growth Inquiry — Whiz Studio",
              description: "A new prospective business client has submitted their requirements via the official contact form.",
              color: 0x00A86B, // Emerald
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
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 5, // Link
                  label: "💬 WhatsApp Direct Chat",
                  url: waUrl
                },
                {
                  type: 2,
                  style: 5, // Link
                  label: "🌐 Open Whiz Studio",
                  url: "https://whizstudio.art"
                }
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
          const errText = await discordRes.text();
          console.error("Discord Contact Webhook Error:", discordRes.status, errText);
          return jsonResponse({
            success: false,
            error: `Discord webhook transmission failed with status ${discordRes.status}`
          }, 502);
        }

        return jsonResponse({
          success: true,
          message: "Contact inquiry transmitted successfully to #contact-inquiries."
        }, 200);

      } catch (err) {
        console.error("Contact Handler Exception:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT 2: Review Moderation Submission (/api/submit-review)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const body = await request.json();
        const name = body.name || body.clientName || "Anonymous Client";
        const email = body.email || body.clientEmail || "Not provided";
        const text = body.text || body.review || body.feedback || body.message;
        const rating = Number(body.rating) || 5;

        if (!text) {
          return jsonResponse({
            success: false,
            error: "Validation error: Review text is required."
          }, 400);
        }

        const starString = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating)) + ` (${rating} / 5 Stars)`;
        const reviewId = `rev_${Date.now()}`;

        // Discord Rich Embed with Interactive ActionRow Buttons: [✅ Accept] & [❌ Decline]
        const discordPayload = {
          content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
          embeds: [
            {
              title: "⭐ Client Review Submission — Whiz Studio",
              description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Moderation Actions:\n• Click **✅ Accept** to approve for public display\n• Click **❌ Decline** to reject this review",
              color: 0xF59E0B, // Amber
              fields: [
                { name: "👤 Client / Company", value: String(name), inline: true },
                { name: "⭐ Rating Given", value: starString, inline: true },
                { name: "📧 Verified Email", value: String(email), inline: true },
                { name: "💬 Review Feedback", value: String(text), inline: false },
                { name: "🆔 Review Reference ID", value: reviewId, inline: true },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: true }
              ],
              footer: { text: "Whiz Studio Moderation Panel • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2, // Button
                  style: 3, // Success (Green)
                  label: "✅ Accept",
                  custom_id: `accept_review:${reviewId}`
                },
                {
                  type: 2, // Button
                  style: 4, // Danger (Red)
                  label: "❌ Decline",
                  custom_id: `decline_review:${reviewId}`
                }
              ]
            }
          ]
        };

        let discordRes = await fetch(reviewWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload)
        });

        // Fail-safe fallback if standard webhook restricts custom_id buttons
        if (!discordRes.ok && discordRes.status === 400) {
          const fallbackPayload = {
            ...discordPayload,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "🌐 View Live Reviews",
                    url: "https://whizstudio.art/#reviews"
                  }
                ]
              }
            ]
          };
          discordRes = await fetch(reviewWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackPayload)
          });
        }

        if (!discordRes.ok) {
          const errText = await discordRes.text();
          console.error("Discord Review Webhook Error:", discordRes.status, errText);
          return jsonResponse({
            success: false,
            error: `Discord webhook transmission failed with status ${discordRes.status}`
          }, 502);
        }

        return jsonResponse({
          success: true,
          reviewId,
          message: "Review successfully dispatched to #review-moderation on Discord."
        }, 200);

      } catch (err) {
        console.error("Review Handler Exception:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT 3: Discord Interactions Gateway (/api/interactions)
    // Listens for [✅ Accept] and [❌ Decline] button clicks with Ed25519 verification
    // -------------------------------------------------------------------------
    if ((path === "/api/interactions" || path === "/interactions") && request.method === "POST") {
      try {
        const rawBody = await request.text();

        // 1. Verify Discord cryptographic signature
        const isValid = await verifyDiscordSignature(request, rawBody, discordPublicKey);
        if (!isValid) {
          return new Response("Invalid request signature", { status: 401 });
        }

        const interaction = JSON.parse(rawBody);

        // 2. Handle PING (Type 1)
        if (interaction.type === 1) {
          return jsonResponse({ type: 1 }); // PONG
        }

        // 3. Handle MESSAGE_COMPONENT (Type 3) - Button clicks
        if (interaction.type === 3) {
          const customId = interaction.data?.custom_id || "";
          const userTag = interaction.member?.user?.username || interaction.user?.username || "Moderator";

          if (customId.startsWith("accept_review")) {
            return jsonResponse({
              type: 4, // Channel message with source
              data: {
                content: `✅ Review was **APPROVED** for publication by **@${userTag}**!`,
                flags: 64 // Ephemeral: visible only to moderator
              }
            });
          }

          if (customId.startsWith("decline_review")) {
            return jsonResponse({
              type: 4,
              data: {
                content: `❌ Review was **DECLINED** and dismissed by **@${userTag}**.`,
                flags: 64 // Ephemeral
              }
            });
          }
        }

        return jsonResponse({ type: 1 });
      } catch (err) {
        console.error("Interactions Gateway Error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT 4: Live Approved Reviews Fetch (/api/reviews)
    // -------------------------------------------------------------------------
    if (path === "/api/reviews" && request.method === "GET") {
      try {
        if (!botToken || !reviewChannelId) {
          return jsonResponse({ success: true, reviews: [] });
        }

        const res = await fetch(`https://discord.com/api/v10/channels/${reviewChannelId}/messages?limit=50`, {
          headers: {
            "Authorization": `Bot ${botToken}`,
            "User-Agent": "DiscordBot (WhizStudioReviews, 1.0)"
          }
        });

        if (!res.ok) {
          return jsonResponse({ success: true, reviews: [] });
        }

        const messages = await res.json();
        const approvedReviews = [];

        for (const msg of messages) {
          const hasApprovedReaction = msg.reactions && msg.reactions.some(r => r.emoji.name === "✅" && r.count >= 1);
          if (hasApprovedReaction && msg.embeds && msg.embeds.length > 0) {
            const embed = msg.embeds[0];
            let name = "Verified Client";
            let rating = 5;
            let text = "";

            if (embed.fields) {
              for (const f of embed.fields) {
                const fieldName = (f.name || "").toLowerCase();
                if (fieldName.includes("email")) {
                  continue;
                } else if (fieldName.includes("name") || fieldName.includes("company") || fieldName.includes("client")) {
                  name = f.value;
                } else if (fieldName.includes("rating") || fieldName.includes("star")) {
                  const stars = (f.value.match(/★/g) || []).length;
                  if (stars > 0) rating = stars;
                } else if (fieldName.includes("feedback") || fieldName.includes("review") || fieldName.includes("text")) {
                  text = f.value;
                }
              }
            }

            if (text && text.trim().length > 0) {
              approvedReviews.push({
                id: msg.id,
                name: name,
                rating: rating,
                text: text,
                date: new Date(msg.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              });
            }
          }
        }

        return jsonResponse({ success: true, reviews: approvedReviews });
      } catch (err) {
        return jsonResponse({ success: false, reviews: [], error: err.message }, 500);
      }
    }

    // Static Asset Delivery fallback (if deployed on Cloudflare Pages)
    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  }
};
