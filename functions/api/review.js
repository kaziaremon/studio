/**
 * Cloudflare Pages Function: /api/review
 * Dispatches client reviews to #review-moderation on the dedicated Discord server
 * and adds instant Accept / Decline reactions.
 */

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";
const REVIEW_CHANNEL_ID = "1557779983236079696";

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, text, rating } = data;

    if (!name || !email || !text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const starCount = Number(rating) || 5;
    const starString = "★".repeat(starCount) + ` (${starCount} / 5 Stars)`;
    const botToken = (env && env.DISCORD_BOT_TOKEN) || [P1, P2, P3].join(".");

    const DISCORD_REVIEW_WEBHOOK_URL = "https://discord.com/api/webhooks/1557779989485592687/-cgEHMTkMVGbpE2-PJNHuvXwpxlNZ6VwfqHElf3RcM_hli-P64jV6YHZWDnnLXvUHOdf";

    const payload = {
      content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
      embeds: [
        {
          title: "⭐ Client Review Submission — Whiz Studio",
          description: "A new client review has been submitted for moderation on **https://whizstudio.art**.\nReview the feedback below and moderate with the reactions.",
          color: 0xF59E0B,
          fields: [
            { name: "👤 Client / Company", value: name, inline: true },
            { name: "⭐ Star Rating", value: starString, inline: true },
            { name: "📧 Client Email", value: email, inline: true },
            { name: "💬 Review Feedback", value: text, inline: false },
            { name: "🛡️ Moderation Decision", value: "• React with **✅** to **Approve & Publish Live**\n• React with **❌** or delete message to **Decline**", inline: false },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
          ],
          footer: {
            text: "Whiz Studio Moderation System • whizstudio.art"
          }
        }
      ],
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

    // 1. Post to Discord Review Webhook
    const discordRes = await fetch(DISCORD_REVIEW_WEBHOOK_URL + "?wait=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord error:", discordRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: errText }), {
        status: discordRes.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const msgData = await discordRes.json();

    // 2. Add Accept / Decline Reactions for One-Click Moderation
    if (msgData && msgData.id) {
      try {
        await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages/${msgData.id}/reactions/%E2%9C%85/@me`, {
          method: "PUT",
          headers: { "Authorization": `Bot ${botToken}` }
        });
        await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages/${msgData.id}/reactions/%E2%9D%8C/@me`, {
          method: "PUT",
          headers: { "Authorization": `Bot ${botToken}` }
        });
      } catch (e) {
        console.warn("Reaction add notice:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Review API Server Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
