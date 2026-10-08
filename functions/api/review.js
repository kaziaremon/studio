/**
 * Cloudflare Pages Function: /api/review and /api/submit-review
 * Delivers review submissions to Discord #review-moderation with ActionRow [✅ Accept] and [❌ Decline] buttons.
 */

const REVIEW_WEBHOOK_URL = "https://discord.com/api/webhooks/1557836746916372614/D9tZfwn_N8cDd4qnWjeD3FJPo_c5f6PZuvPRFz4DKspOyZrnqaoHU6JjMoXvvnjdxA0J";

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
    const rating = Number(data.rating) || 5;

    if (!text) {
      return new Response(JSON.stringify({ success: false, error: "Review text is required." }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const webhookUrl = (env && env.REVIEW_WEBHOOK_URL) || REVIEW_WEBHOOK_URL;
    const starString = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating)) + ` (${rating} / 5 Stars)`;
    const reviewId = `rev_${Date.now()}`;

    const payload = {
      content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
      embeds: [
        {
          title: "⭐ Client Review Submission — Whiz Studio",
          description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Moderation Actions:\n• Click **✅ Accept** to approve for public display\n• Click **❌ Decline** to reject this review",
          color: 0xF59E0B,
          fields: [
            { name: "👤 Client / Company", value: String(name), inline: true },
            { name: "⭐ Rating Given", value: starString, inline: true },
            { name: "📧 Verified Email", value: String(email), inline: true },
            { name: "💬 Review Feedback", value: String(text), inline: false },
            { name: "🆔 Review Reference ID", value: reviewId, inline: true },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: true }
          ],
          footer: {
            text: "Whiz Studio Moderation Panel • whizstudio.art"
          }
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
              custom_id: `accept_review:${reviewId}`
            },
            {
              type: 2,
              style: 4, // Danger
              label: "❌ Decline",
              custom_id: `decline_review:${reviewId}`
            }
          ]
        }
      ]
    };

    let discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok && discordRes.status === 400) {
      // Fallback without interactive buttons if needed
      payload.components = [
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
      ];
      discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord Webhook API Error:", discordRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: "Discord webhook failed: " + errText }), {
        status: discordRes.status,
        headers: CORS_HEADERS
      });
    }

    return new Response(JSON.stringify({ success: true, reviewId, message: "Review sent to #review-moderation" }), {
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
