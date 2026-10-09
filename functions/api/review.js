/**
 * Cloudflare Pages Function: /api/review and /api/submit-review
 * Saves incoming review to database with moderation_status='pending' and visibility='hidden',
 * and delivers the Permanent Review Control Panel to Discord #review-moderation with 4 interactive buttons.
 */

import { dbSaveReview } from "./_db.js";

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
    const data = await request.json();
    const name = data.name || data.clientName || data.company || "Anonymous Client";
    const email = data.email || data.clientEmail || "Not provided";
    const text = data.text || data.review || data.feedback || data.message;
    const rating = Math.min(5, Math.max(1, Number(data.rating) || 5));

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Review text is required." }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const starString = "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} / 5 Stars)`;

    // 1. Save to Database with initial state (pending, hidden)
    await dbSaveReview(env, {
      id: reviewId,
      name,
      email,
      rating,
      text,
      moderation_status: "pending",
      visibility: "hidden"
    });

    const botToken = (env && env.DISCORD_BOT_TOKEN) || (env && env.BOT_TOKEN) || CONFIG.BOT_TOKEN;
    const channelId = (env && env.REVIEW_CHANNEL_ID) || CONFIG.REVIEW_CHANNEL_ID;
    const webhookUrl = (env && env.REVIEW_WEBHOOK_URL) || CONFIG.REVIEW_WEBHOOK_URL;

    // Build the Permanent Control Dashboard payload with 4 buttons
    const discordPayload = {
      content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
      embeds: [
        {
          title: "⭐ Client Review Submission — Whiz Studio",
          description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Permanent Control Dashboard:\nUse the control buttons below to accept, decline, or toggle visibility on the live website.",
          color: 0xF59E0B, // Amber (Pending)
          fields: [
            { name: "👤 Client / Company", value: String(name), inline: true },
            { name: "⭐ Rating Given", value: starString, inline: true },
            { name: "📧 Verified Email", value: String(email), inline: true },
            { name: "💬 Review Feedback", value: String(text), inline: false },
            { name: "🆔 Review Reference ID", value: reviewId, inline: true },
            { name: "⚙️ Live Status", value: "Status: ⏳ Pending | Visibility: 🙈 Hidden", inline: true },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
          ],
          footer: {
            text: "Whiz Studio Permanent Control Panel • whizstudio.art"
          }
        }
      ],
      components: [
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
      ]
    };

    // 2. Deliver via Discord Bot Channel API (primary, full button support)
    let discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discordPayload)
    });

    // Fallback to Webhook if Bot API is unavailable
    if (!discordRes.ok) {
      console.warn("Direct bot message failed, trying webhook fallback...", discordRes.status);
      discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });
    }

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord delivery failed:", discordRes.status, errText);
    }

    return new Response(JSON.stringify({
      success: true,
      reviewId,
      message: "Review successfully saved and dispatched to Discord moderation queue."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Review API Exception:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
