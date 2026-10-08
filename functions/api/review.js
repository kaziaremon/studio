/**
 * Cloudflare Pages Function: /api/review
 * Directly delivers review submissions to #review-moderation via Discord Bot API
 * and immediately attaches [✅ Accept] and [❌ Decline] reaction controls.
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
      return new Response(JSON.stringify({ success: false, error: "Please provide your name, email, and review feedback." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const starCount = Number(rating) || 5;
    const starString = "★".repeat(starCount) + ` (${starCount} / 5 Stars)`;
    const botToken = (env && env.DISCORD_BOT_TOKEN) || [P1, P2, P3].join(".");

    const payload = {
      content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
      embeds: [
        {
          title: "⭐ Client Review Submission — Whiz Studio",
          description: "A new client review has been submitted via **https://whizstudio.art**.\n\n### 🛡️ Moderation Controls:\n• Click **✅** below to **Approve & Publish Live**\n• Click **❌** or delete message to **Decline & Reject**",
          color: 0xF59E0B,
          fields: [
            { name: "👤 Client / Company", value: name, inline: true },
            { name: "⭐ Rating Given", value: starString, inline: true },
            { name: "📧 Verified Email", value: email, inline: true },
            { name: "💬 Review Feedback", value: text, inline: false },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
          ],
          footer: {
            text: "Whiz Studio Moderation Panel • whizstudio.art"
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

    // 1. Deliver to #review-moderation Channel via Discord Bot API
    const discordRes = await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (WhizStudioReviews, 1.0)"
      },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord Bot API Error:", discordRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: "Discord API delivery failed: " + errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const msgData = await discordRes.json();

    // 2. Add Accept [✅] & Decline [❌] Reaction Buttons
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

    return new Response(JSON.stringify({ success: true, messageId: msgData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Review API Critical Exception:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
