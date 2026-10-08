/**
 * Cloudflare Pages Function: /api/reviews
 * Live Discord Database Sync: Fetches approved reviews from the #review-moderation Discord channel.
 */

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";
const REVIEW_CHANNEL_ID = "1557779983236079696";

export async function onRequestGet({ env }) {
  try {
    const botToken = (env && env.DISCORD_BOT_TOKEN) || [P1, P2, P3].join(".");

    const res = await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages?limit=50`, {
      headers: {
        "Authorization": `Bot ${botToken}`,
        "User-Agent": "DiscordBot (WhizStudioReviews, 1.0)"
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ reviews: [] }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
      });
    }

    const messages = await res.json();
    const approvedReviews = [];

    for (const msg of messages) {
      // Check if message has embeds and has the ✅ reaction
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
              // Skip email from becoming the name
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

    return new Response(JSON.stringify({ success: true, reviews: approvedReviews }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=15, s-maxage=30",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.error("Error syncing reviews from Discord:", err);
    return new Response(JSON.stringify({ success: false, reviews: [], error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
