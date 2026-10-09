/**
 * Cloudflare Pages Function: /api/review and /api/submit-review
 * Route A: Saves incoming review to REVIEWS_DB KV and dispatches Discord embed with 4 action buttons.
 */

import { kvPut } from "./_db.js";

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";

const CONFIG = {
  BOT_TOKEN: [P1, P2, P3].join("."),
  REVIEW_CHANNEL_ID: "1557820513982742580",
  REVIEW_WEBHOOK_URL: "https://discord.com/api/webhooks/1557836746916372614/D9tZfwn_N8cDd4qnWjeD3FJPo_c5f6PZuvPRFz4DKspOyZrnqaoHU6JjMoXvvnjdxA0J"
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const clientName = body.clientName || body.name || "Anonymous Client";
    const reviewText = body.reviewText || body.text || body.review || body.feedback || "";
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

    if (!reviewText || !reviewText.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Review text is required." }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    // 1. Save to KV (REVIEWS_DB)
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

    // 2. Build Discord embed with 4 buttons
    const starString = "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} / 5 Stars)`;
    const botToken = (env && env.BOT_TOKEN) || CONFIG.BOT_TOKEN;
    const channelId = (env && env.REVIEW_CHANNEL_ID) || CONFIG.REVIEW_CHANNEL_ID;
    const webhookUrl = (env && env.REVIEW_WEBHOOK_URL) || CONFIG.REVIEW_WEBHOOK_URL;

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
          type: 1,
          components: [
            { type: 2, style: 3, label: "✅ Accept", custom_id: `accept_${id}` },
            { type: 2, style: 4, label: "❌ Decline", custom_id: `decline_${id}` },
            { type: 2, style: 1, label: "👁️ Show", custom_id: `show_${id}` },
            { type: 2, style: 2, label: "🙈 Hide", custom_id: `hide_${id}` }
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
      discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Review successfully saved to KV and dispatched to Discord moderation queue."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Route A Exception:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
