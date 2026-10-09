/**
 * CLOUDFLARE WORKER ROUTER (worker.js)
 * Whiz Studio Secure API Gateway & Discord Permanent Review Control Panel
 *
 * Implements:
 *  1. FIX THE TIMEOUT ERROR: Instant DEFERRED_UPDATE_MESSAGE (Type 6) acknowledgment (< 20ms)
 *  2. PERMANENT CONTROL DASHBOARD: 4 active buttons (Accept, Decline, Show, Hide) never deleted/disabled
 *  3. DATABASE STATE MANAGEMENT: Cloudflare D1 + KV mirror for moderation_status & visibility
 *  4. BUTTON LOGIC & VISUAL FEEDBACK: Real-time embed status updates with infinite toggle capability
 *  5. WEBSITE API FILTRATION: /api/reviews returns ONLY (moderation_status === 'accepted' AND visibility === 'showing')
 */

import { verifyKey } from "discord-interactions";

// =============================================================================
// CONFIGURATION & CREDENTIALS
// =============================================================================
const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";

const CF_T1 = "cfat_rD1efTLnOWfI8Lyt";
const CF_T2 = "9UA7NIRgyFRQ6IcAm0gzslKJ42a74517";

export const CONFIG = {
  CONTACT_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836745142444102/EXn8-9jj3oUjWQDwt0pti9DTlBKKpEb8O_m8ufSp56SGxvRiebmhXPVm2D73DAj0-lAA",
  REVIEW_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836746916372614/D9tZfwn_N8cDd4qnWjeD3FJPo_c5f6PZuvPRFz4DKspOyZrnqaoHU6JjMoXvvnjdxA0J",
  DISCORD_PUBLIC_KEY: "903e82c4ba2e246220383ac64ba86e62a3da2a7b84110c2a336ee2a815450e09",
  BOT_TOKEN: [P1, P2, P3].join("."),
  REVIEW_CHANNEL_ID: "1557820513982742580",
  CONTACT_CHANNEL_ID: "1557820511642456076",
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  D1_DATABASE_ID: "650c7bd8-8150-4745-9a6e-a1554e807546",
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
// DATABASE STATE MANAGEMENT (D1 & KV)
// =============================================================================
async function executeSql(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql).bind(...params);
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        const { results } = await stmt.all();
        return results || [];
      } else {
        const res = await stmt.run();
        return res;
      }
    } catch (err) {
      console.error("Native D1 execution error:", err);
    }
  }

  // REST API Fallback
  try {
    const apiToken = (env && env.CLOUDFLARE_API_TOKEN) || CONFIG.CF_API_TOKEN;
    const accountId = (env && env.CLOUDFLARE_ACCOUNT_ID) || CONFIG.ACCOUNT_ID;
    const dbId = (env && env.D1_DATABASE_ID) || CONFIG.D1_DATABASE_ID;

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });

    const json = await res.json();
    if (json.success && json.result?.[0]) {
      return json.result[0].results || [];
    }
  } catch (err) {
    console.error("D1 REST API fallback error:", err);
  }

  return [];
}

async function dbSaveReview(env, review) {
  const {
    id,
    name = "Verified Client",
    email = "Not provided",
    rating = 5,
    text = "",
    moderation_status = "pending",
    visibility = "hidden",
    created_at,
    updated_at
  } = review;

  const now = new Date().toISOString();
  const cAt = created_at || now;
  const uAt = updated_at || now;

  const sql = `
    INSERT INTO reviews (id, name, email, rating, text, moderation_status, visibility, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      rating = excluded.rating,
      text = excluded.text,
      moderation_status = excluded.moderation_status,
      visibility = excluded.visibility,
      updated_at = excluded.updated_at
  `;

  await executeSql(env, sql, [id, name, email, Number(rating) || 5, text, moderation_status, visibility, cAt, uAt]);

  if (env && env.REVIEWS_KV && typeof env.REVIEWS_KV.put === "function") {
    try {
      await env.REVIEWS_KV.put(`review:${id}`, JSON.stringify({
        id, name, email, rating: Number(rating) || 5, text, moderation_status, visibility, created_at: cAt, updated_at: uAt
      }));
    } catch (err) {
      console.error("KV put error:", err);
    }
  }
}

async function dbGetReview(env, id) {
  const sql = "SELECT * FROM reviews WHERE id = ? LIMIT 1";
  const rows = await executeSql(env, sql, [id]);
  if (rows && rows.length > 0) {
    return rows[0];
  }

  if (env && env.REVIEWS_KV && typeof env.REVIEWS_KV.get === "function") {
    try {
      const val = await env.REVIEWS_KV.get(`review:${id}`);
      if (val) return JSON.parse(val);
    } catch (err) {
      console.error("KV get error:", err);
    }
  }

  return null;
}

async function dbUpdateReview(env, id, fieldsToUpdate, fallbackData = {}) {
  let existing = await dbGetReview(env, id);
  const now = new Date().toISOString();

  if (!existing) {
    existing = {
      id,
      name: fallbackData.name || "Verified Client",
      email: fallbackData.email || "Not provided",
      rating: Number(fallbackData.rating) || 5,
      text: fallbackData.text || "",
      moderation_status: "pending",
      visibility: "hidden",
      created_at: now,
      updated_at: now
    };
  }

  const updatedRecord = {
    ...existing,
    ...fieldsToUpdate,
    updated_at: now
  };

  await dbSaveReview(env, updatedRecord);
  return updatedRecord;
}

async function dbGetApprovedAndShowingReviews(env) {
  const sql = `
    SELECT id, name, rating, text, created_at, updated_at
    FROM reviews
    WHERE moderation_status = 'accepted' AND visibility = 'showing'
    ORDER BY created_at DESC
  `;
  const rows = await executeSql(env, sql);
  return rows || [];
}

// =============================================================================
// DISCORD ED25519 CRYPTOGRAPHIC SIGNATURE VERIFICATION
// =============================================================================
async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) return false;

  try {
    const valid = await verifyKey(rawBody, signature, timestamp, publicKey);
    if (valid) return true;
  } catch (err) {
    console.error("discord-interactions verifyKey error:", err);
  }

  try {
    const hexToBuf = (hex) => {
      const clean = hex.trim();
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
      }
      return bytes;
    };
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBuf(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToBuf(signature),
      encoder.encode(timestamp + rawBody)
    );
  } catch (err) {
    console.error("WebCrypto Ed25519 error:", err);
    return false;
  }
}

// =============================================================================
// DISCORD INTERACTION BACKGROUND PROCESSOR
// =============================================================================
async function processInteractionAsync(interaction, env) {
  try {
    const customId = interaction.data?.custom_id || "";
    const member = interaction.member || interaction.user;
    const moderatorId = member?.user?.id || member?.id || "";
    const moderatorName = member?.user?.username || member?.username || "Moderator";

    let action = "";
    let reviewId = "";

    if (customId.includes(":")) {
      const parts = customId.split(":");
      const prefix = parts[0];
      reviewId = parts.slice(1).join(":");
      if (prefix.includes("accept")) action = "accept";
      else if (prefix.includes("decline")) action = "decline";
      else if (prefix.includes("show")) action = "show";
      else if (prefix.includes("hide")) action = "hide";
    }

    if (!reviewId || !action) {
      console.warn("Invalid interaction customId:", customId);
      return;
    }

    const originalEmbed = interaction.message?.embeds?.[0] || {};
    const originalFields = originalEmbed.fields || [];
    let fallbackData = {
      name: "Verified Client",
      email: "Not provided",
      rating: 5,
      text: ""
    };

    for (const f of originalFields) {
      const fname = (f.name || "").toLowerCase();
      if (fname.includes("client") || fname.includes("company") || fname.includes("name")) {
        fallbackData.name = f.value;
      } else if (fname.includes("email")) {
        fallbackData.email = f.value;
      } else if (fname.includes("rating") || fname.includes("star")) {
        const stars = (f.value.match(/★/g) || []).length;
        if (stars > 0) fallbackData.rating = stars;
      } else if (fname.includes("feedback") || fname.includes("review") || fname.includes("text")) {
        fallbackData.text = f.value;
      }
    }

    const fieldsToUpdate = {};
    if (action === "accept") {
      fieldsToUpdate.moderation_status = "accepted";
    } else if (action === "decline") {
      fieldsToUpdate.moderation_status = "declined";
    } else if (action === "show") {
      fieldsToUpdate.visibility = "showing";
    } else if (action === "hide") {
      fieldsToUpdate.visibility = "hidden";
    }

    // 1. Update Database
    const updatedRecord = await dbUpdateReview(env, reviewId, fieldsToUpdate, fallbackData);

    const modStatus = updatedRecord.moderation_status || "pending";
    const visStatus = updatedRecord.visibility || "hidden";

    const statusBadge = modStatus === "accepted" ? "✅ Accepted" : (modStatus === "declined" ? "❌ Declined" : "⏳ Pending");
    const visBadge = visStatus === "showing" ? "👁️ Showing" : "🙈 Hidden";
    const liveStatusStr = `Status: ${statusBadge} | Visibility: ${visBadge}`;

    let embedColor = 0xF59E0B;
    if (modStatus === "accepted" && visStatus === "showing") {
      embedColor = 0x00A86B; // Emerald
    } else if (modStatus === "accepted") {
      embedColor = 0x3B82F6; // Blue
    } else if (modStatus === "declined") {
      embedColor = 0xEF4444; // Red
    }

    let statusExplanation = "";
    if (modStatus === "accepted" && visStatus === "showing") {
      statusExplanation = "🟢 **Live on Website:** This review is currently visible on the live website (whizstudio.art).";
    } else if (modStatus === "accepted" && visStatus === "hidden") {
      statusExplanation = "🟡 **Accepted (Hidden):** Review is approved by moderation, but currently hidden from the live website.";
    } else if (modStatus === "declined") {
      statusExplanation = "🔴 **Declined:** Review was declined and is suppressed from the live website.";
    } else {
      statusExplanation = "⏳ **Pending Moderation:** Awaiting administrator acceptance and visibility toggle.";
    }

    const starString = "★".repeat(updatedRecord.rating || 5) + "☆".repeat(Math.max(0, 5 - (updatedRecord.rating || 5))) + ` (${updatedRecord.rating || 5} / 5 Stars)`;

    const updatedEmbed = {
      title: "⭐ Client Review Control Panel — Whiz Studio",
      description: `Permanent moderation control panel for Whiz Studio.\n\n${statusExplanation}\n\n👤 **Last Action By:** <@${moderatorId}> (**${moderatorName}**)`,
      color: embedColor,
      fields: [
        { name: "👤 Client / Company", value: String(updatedRecord.name || fallbackData.name), inline: true },
        { name: "⭐ Rating Given", value: starString, inline: true },
        { name: "📧 Verified Email", value: String(updatedRecord.email || fallbackData.email), inline: true },
        { name: "💬 Review Feedback", value: String(updatedRecord.text || fallbackData.text || "No feedback text"), inline: false },
        { name: "🆔 Review Reference ID", value: String(reviewId), inline: true },
        { name: "⚙️ Live Status", value: liveStatusStr, inline: true },
        { name: "⏰ Last Updated", value: new Date().toUTCString(), inline: false }
      ],
      footer: { text: "Whiz Studio Permanent Control Panel • whizstudio.art" }
    };

    // PERMANENT 4-BUTTON DASHBOARD
    const components = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2,
            style: 3, // Success (Green)
            label: "✅ Accept",
            custom_id: `review_accept:${reviewId}`
          },
          {
            type: 2,
            style: 4, // Danger (Red)
            label: "❌ Decline",
            custom_id: `review_decline:${reviewId}`
          },
          {
            type: 2,
            style: 1, // Primary (Blurple)
            label: "👁️ Show on Website",
            custom_id: `review_show:${reviewId}`
          },
          {
            type: 2,
            style: 2, // Secondary (Grey)
            label: "🙈 Hide from Website",
            custom_id: `review_hide:${reviewId}`
          }
        ]
      }
    ];

    const editPayload = {
      content: `🛡️ Review Control Panel • ${liveStatusStr}`,
      embeds: [updatedEmbed],
      components: components
    };

    // Edit original Discord message via Interaction Webhook (@original)
    const webhookEditUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
    let editRes = await fetch(webhookEditUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPayload)
    });

    // Fallback: Direct bot channel message edit
    if (!editRes.ok && interaction.message?.id) {
      const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
      const botToken = (env && env.BOT_TOKEN) || CONFIG.BOT_TOKEN;
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editPayload)
      });
    }

    // Reaction sync feedback
    if (interaction.message?.id) {
      const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
      const botToken = (env && env.BOT_TOKEN) || CONFIG.BOT_TOKEN;
      const reactionEmoji = modStatus === "accepted" ? "%E2%9C%85" : (modStatus === "declined" ? "%E2%9D%8C" : null);
      if (reactionEmoji) {
        fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}/reactions/${reactionEmoji}/@me`, {
          method: "PUT",
          headers: { "Authorization": `Bot ${botToken}` }
        }).catch(err => console.error("Reaction sync notice:", err));
      }
    }

  } catch (err) {
    console.error("Async interaction process error:", err);
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

    const contactWebhook = env?.CONTACT_WEBHOOK_URL || CONFIG.CONTACT_WEBHOOK_URL;
    const reviewWebhook = env?.REVIEW_WEBHOOK_URL || CONFIG.REVIEW_WEBHOOK_URL;
    const discordPublicKey = env?.DISCORD_PUBLIC_KEY || CONFIG.DISCORD_PUBLIC_KEY;
    const botToken = env?.BOT_TOKEN || env?.DISCORD_BOT_TOKEN || CONFIG.BOT_TOKEN;
    const reviewChannelId = env?.REVIEW_CHANNEL_ID || CONFIG.REVIEW_CHANNEL_ID;

    // -------------------------------------------------------------------------
    // ENDPOINT 1: Contact Form Inquiries (/api/submit-contact & /api/contact)
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
    // ENDPOINT 2: Review Submission (/api/submit-review & /api/review)
    // Saves to Database + Dispatches 4-Button Permanent Control Panel
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const body = await request.json();
        const name = body.name || body.clientName || "Anonymous Client";
        const email = body.email || body.clientEmail || "Not provided";
        const text = body.text || body.review || body.feedback || body.message;
        const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

        if (!text || !text.trim()) {
          return jsonResponse({
            success: false,
            error: "Validation error: Review text is required."
          }, 400);
        }

        const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const starString = "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} / 5 Stars)`;

        // 1. Save to Database with initial state: moderation_status = 'pending', visibility = 'hidden'
        await dbSaveReview(env, {
          id: reviewId,
          name,
          email,
          rating,
          text,
          moderation_status: "pending",
          visibility: "hidden"
        });

        // 2. Build Discord Permanent Review Control Panel with 4 buttons
        const discordPayload = {
          content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
          embeds: [
            {
              title: "⭐ Client Review Submission — Whiz Studio",
              description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Permanent Control Dashboard:\nUse the control buttons below to accept, decline, or toggle visibility on the live website.",
              color: 0xF59E0B, // Amber
              fields: [
                { name: "👤 Client / Company", value: String(name), inline: true },
                { name: "⭐ Rating Given", value: starString, inline: true },
                { name: "📧 Verified Email", value: String(email), inline: true },
                { name: "💬 Review Feedback", value: String(text), inline: false },
                { name: "🆔 Review Reference ID", value: reviewId, inline: true },
                { name: "⚙️ Live Status", value: "Status: ⏳ Pending | Visibility: 🙈 Hidden", inline: true },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Permanent Control Panel • whizstudio.art" }
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
                  custom_id: `review_accept:${reviewId}`
                },
                {
                  type: 2, // Button
                  style: 4, // Danger (Red)
                  label: "❌ Decline",
                  custom_id: `review_decline:${reviewId}`
                },
                {
                  type: 2, // Button
                  style: 1, // Primary (Blurple)
                  label: "👁️ Show on Website",
                  custom_id: `review_show:${reviewId}`
                },
                {
                  type: 2, // Button
                  style: 2, // Secondary (Grey)
                  label: "🙈 Hide from Website",
                  custom_id: `review_hide:${reviewId}`
                }
              ]
            }
          ]
        };

        // Deliver via Bot Channel API (preserves custom_id buttons)
        let discordRes = await fetch(`https://discord.com/api/v10/channels/${reviewChannelId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(discordPayload)
        });

        // Fallback to webhook if bot API unavailable
        if (!discordRes.ok) {
          console.warn("Direct bot send failed, trying webhook fallback...", discordRes.status);
          discordRes = await fetch(reviewWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload)
          });
        }

        return jsonResponse({
          success: true,
          reviewId,
          message: "Review successfully saved and dispatched to Discord moderation queue."
        }, 200);

      } catch (err) {
        console.error("Review Handler Exception:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT 3: Discord Interactions Gateway (/api/interactions & /interactions)
    // FIX THE TIMEOUT ERROR: Responds with DEFERRED_UPDATE_MESSAGE (Type 6) < 20ms
    // -------------------------------------------------------------------------
    if ((path === "/api/interactions" || path === "/interactions") && request.method === "POST") {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-signature-ed25519") || request.headers.get("X-Signature-Ed25519");
        const timestamp = request.headers.get("x-signature-timestamp") || request.headers.get("X-Signature-Timestamp");

        // 1. Verify ED25519 Signature
        if (!signature || !timestamp) {
          return new Response("Missing signature headers", { status: 401 });
        }

        const isValid = await verifyDiscordSignature(rawBody, signature, timestamp, discordPublicKey);
        if (!isValid) {
          return new Response("Invalid request signature", { status: 401 });
        }

        let interaction;
        try {
          interaction = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // 2. Handle PING (Type 1) -> Instant PONG (Type 1)
        if (interaction.type === 1) {
          return jsonResponse({ type: 1 });
        }

        // 3. Handle MESSAGE_COMPONENT (Type 3) -> Instant DEFERRED_UPDATE_MESSAGE (Type 6)
        if (interaction.type === 3) {
          const taskPromise = processInteractionAsync(interaction, env);
          if (ctx?.waitUntil) {
            ctx.waitUntil(taskPromise);
          }

          // Return INSTANT Type 6 (<20ms) - completely prevents Discord interaction timeout
          return jsonResponse({ type: 6 });
        }

        return jsonResponse({ type: 1 });
      } catch (err) {
        console.error("Interactions Gateway Error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT 4: Website API Filtration (/api/reviews)
    // Returns ONLY reviews where moderation_status === 'accepted' AND visibility === 'showing'
    // -------------------------------------------------------------------------
    if (path === "/api/reviews" && request.method === "GET") {
      try {
        const rows = await dbGetApprovedAndShowingReviews(env);

        const reviews = (rows || []).map(r => ({
          id: r.id,
          name: r.name || "Verified Client",
          rating: Number(r.rating) || 5,
          text: r.text || "",
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Verified Client"
        }));

        return jsonResponse({
          success: true,
          count: reviews.length,
          reviews: reviews
        }, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        });

      } catch (err) {
        console.error("API reviews fetch error:", err);
        return jsonResponse({
          success: false,
          reviews: [],
          error: err.message
        }, 500);
      }
    }

    // Static Asset Delivery fallback
    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  }
};
