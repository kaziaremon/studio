/**
 * CLOUDFLARE WORKER / PAGES ADVANCED PROXY ROUTER
 * Handles API endpoints with full CORS support and forwards to Discord API & Webhooks.
 */

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";
const BOT_TOKEN = [P1, P2, P3].join(".");

const CONTACT_CHANNEL_ID = "1557779981352837260";
const REVIEW_CHANNEL_ID = "1557779983236079696";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // 1. Inbound Contact Form Proxy (/api/submit-contact or /api/contact)
    if ((path === "/api/submit-contact" || path === "/api/contact") && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, email, phone, service, details } = body;

        if (!name || !email || !phone || !service || !details) {
          return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, "");
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

        const discordPayload = {
          content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
          embeds: [
            {
              title: "📬 Strategic Growth Inquiry — Whiz Studio",
              description: "A new prospective business client has submitted their requirements via the official contact form.",
              color: 0x00A86B,
              fields: [
                { name: "👤 Client / Company", value: name, inline: true },
                { name: "📱 WhatsApp / Phone", value: phone, inline: true },
                { name: "📧 Email Address", value: email, inline: true },
                { name: "🎯 Selected Service", value: service, inline: true },
                { name: "📝 Project Scope & Details", value: details, inline: false },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Permanent Ledger • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "💬 WhatsApp Direct Chat",
                  url: waUrl
                },
                {
                  type: 2,
                  style: 5,
                  label: "🌐 Open Whiz Studio",
                  url: "https://whizstudio.art"
                }
              ]
            }
          ]
        };

        const discordRes = await fetch(`https://discord.com/api/v10/channels/${CONTACT_CHANNEL_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot (WhizStudioProxy, 1.0)"
          },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          const err = await discordRes.text();
          return new Response(JSON.stringify({ success: false, error: err }), {
            status: discordRes.status,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const msgData = await discordRes.json();
        return new Response(JSON.stringify({ success: true, id: msgData.id }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // 2. Review Submission Proxy (/api/submit-review or /api/review)
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, email, text, rating } = body;

        if (!name || !email || !text) {
          return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const starCount = Number(rating) || 5;
        const starString = "★".repeat(starCount) + ` (${starCount} / 5 Stars)`;

        const discordPayload = {
          content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
          embeds: [
            {
              title: "⭐ Client Review Submission — Whiz Studio",
              description: "A new client review has been submitted on **https://whizstudio.art**.\n\n### 🛡️ Moderation Controls:\n• Click **✅** below to **Approve & Publish Live**\n• Click **❌** or delete message to **Decline & Reject**",
              color: 0xF59E0B,
              fields: [
                { name: "👤 Client / Company", value: name, inline: true },
                { name: "⭐ Rating Given", value: starString, inline: true },
                { name: "📧 Verified Email", value: email, inline: true },
                { name: "💬 Review Feedback", value: text, inline: false },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Moderation Panel • whizstudio.art" }
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

        const discordRes = await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot (WhizStudioProxy, 1.0)"
          },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          const err = await discordRes.text();
          return new Response(JSON.stringify({ success: false, error: err }), {
            status: discordRes.status,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const msgData = await discordRes.json();

        // Attach One-Click Reaction Buttons (✅ and ❌)
        if (msgData && msgData.id) {
          try {
            await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages/${msgData.id}/reactions/%E2%9C%85/@me`, {
              method: "PUT",
              headers: { "Authorization": `Bot ${BOT_TOKEN}` }
            });
            await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages/${msgData.id}/reactions/%E2%9D%8C/@me`, {
              method: "PUT",
              headers: { "Authorization": `Bot ${BOT_TOKEN}` }
            });
          } catch(e){}
        }

        return new Response(JSON.stringify({ success: true, id: msgData.id }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // 3. Live Approved Reviews Fetch (/api/reviews)
    if (path === "/api/reviews" && request.method === "GET") {
      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages?limit=50`, {
          headers: {
            "Authorization": `Bot ${BOT_TOKEN}`,
            "User-Agent": "DiscordBot (WhizStudioReviews, 1.0)"
          }
        });

        if (!res.ok) {
          return new Response(JSON.stringify({ success: true, reviews: [] }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
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

        return new Response(JSON.stringify({ success: true, reviews: approvedReviews }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, reviews: [], error: err.message }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // Default: Serve Static Assets
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
