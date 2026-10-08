/**
 * Cloudflare Pages Function: /api/contact
 * Handles inbound contact submissions and dispatches rich Discord Embeds + WhatsApp Action Button
 */

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const { name, email, phone, service, details } = data;

    if (!name || !email || !phone || !service || !details) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

    const DISCORD_CONTACT_WEBHOOK_URL = "https://discord.com/api/webhooks/1557773249700565092/2TDAYKk5C78suZ2aj-2NPyGRbrs7PGeRaiAJYgtdBRmiZMttaxn_aRlwRkDpTlSpBBhD";

    const payload = {
      content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
      embeds: [
        {
          title: "📬 Strategic Growth Inquiry — Whiz Studio",
          description: "A new prospective business client has submitted their inquiry via the contact form on **https://whizstudio.art**.",
          color: 0x00A86B,
          fields: [
            { name: "👤 Client / Company", value: name, inline: true },
            { name: "📱 WhatsApp / Phone", value: phone, inline: true },
            { name: "📧 Email Address", value: email, inline: true },
            { name: "🎯 Required Service", value: service, inline: true },
            { name: "📝 Project Scope & Details", value: details, inline: false },
            { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
          ],
          footer: {
            text: "Whiz Studio Lead Dispatch • whizstudio.art"
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

    const discordRes = await fetch(DISCORD_CONTACT_WEBHOOK_URL, {
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
    console.error("Contact API Server Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
