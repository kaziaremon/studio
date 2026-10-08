/**
 * Cloudflare Pages Function: /api/review
 * Handles client review submissions and dispatches rich Discord Embeds + Accept/Decline Moderation technology
 */

export async function onRequestPost({ request }) {
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

    const DISCORD_REVIEW_WEBHOOK_URL = "https://discord.com/api/webhooks/1557773251776614531/7dXCeX3KYnJFCM0pWBdbKnHaqUgjyByFilbCnMo3ickClHUwD01jpF81DmPIm57otu7O";

    const payload = {
      content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
      embeds: [
        {
          title: "⭐ Client Review Submission — Whiz Studio",
          description: "A new client review has been submitted for moderation on **https://whizstudio.art**.\nReview the feedback below and use the moderation actions to accept or decline.",
          color: 0xF59E0B,
          fields: [
            { name: "👤 Client / Company", value: name, inline: true },
            { name: "⭐ Rating", value: starString, inline: true },
            { name: "📧 Client Email", value: email, inline: true },
            { name: "💬 Review Feedback", value: text, inline: false },
            { name: "🛡️ Moderation Decision", value: "• Click **✅** to **Accept & Feature Review**\n• Click **❌** to **Decline & Discard**", inline: false },
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

    const discordRes = await fetch(DISCORD_REVIEW_WEBHOOK_URL, {
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
