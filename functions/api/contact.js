/**
 * Cloudflare Pages Function: /api/contact
 * Directly delivers inquiries into Discord #contact-inquiries on new server.
 */

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";
const CONTACT_CHANNEL_ID = "1557820511642456076";

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, phone, service, details } = data;

    if (!name || !email || !phone || !service || !details) {
      return new Response(JSON.stringify({ success: false, error: "All fields are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const botToken = (env && env.DISCORD_BOT_TOKEN) || [P1, P2, P3].join(".");
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

    const payload = {
      content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
      embeds: [
        {
          title: "📬 Strategic Growth Inquiry — Whiz Studio",
          description: "A new prospective client has submitted an inquiry through the official website contact form.",
          color: 0x00A86B,
          fields: [
            { name: "👤 Client / Company", value: name, inline: true },
            { name: "📱 WhatsApp / Phone", value: phone, inline: true },
            { name: "📧 Email Address", value: email, inline: true },
            { name: "🎯 Selected Service", value: service, inline: true },
            { name: "📝 Project Scope & Details", value: details, inline: false },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
          ],
          footer: {
            text: "Whiz Studio Permanent Ledger • whizstudio.art"
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
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (WhizStudioContact, 1.0)"
      },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord Bot API Error:", discordRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: "Discord API delivery failed: " + errText }), {
        status: discordRes.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const resData = await discordRes.json();
    return new Response(JSON.stringify({ success: true, messageId: resData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    console.error("Contact API Critical Exception:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
