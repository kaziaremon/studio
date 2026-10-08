/**
 * Cloudflare Pages Function: /api/contact and /api/submit-contact
 * Directly delivers inquiries into Discord #contact-inquiries on new server via Webhook.
 */

const CONTACT_WEBHOOK_URL = "https://discord.com/api/webhooks/1557836745142444102/EXn8-9jj3oUjWQDwt0pti9DTlBKKpEb8O_m8ufSp56SGxvRiebmhXPVm2D73DAj0-lAA";

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
    const { name, email, phone, service, details } = data;

    if (!name || !email || !details) {
      return new Response(JSON.stringify({ success: false, error: "Name, email, and details are required." }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const webhookUrl = (env && env.CONTACT_WEBHOOK_URL) || CONTACT_WEBHOOK_URL;
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

    const payload = {
      content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
      embeds: [
        {
          title: "📬 Strategic Growth Inquiry — Whiz Studio",
          description: "A new prospective client has submitted an inquiry through the official website contact form.",
          color: 0x00A86B,
          fields: [
            { name: "👤 Client / Company", value: String(name), inline: true },
            { name: "📱 WhatsApp / Phone", value: String(phone || "Not provided"), inline: true },
            { name: "📧 Email Address", value: String(email), inline: true },
            { name: "🎯 Selected Service", value: String(service || "General Inquiry"), inline: true },
            { name: "📝 Project Scope & Details", value: String(details), inline: false },
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

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord Webhook API Error:", discordRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: "Discord webhook failed: " + errText }), {
        status: discordRes.status,
        headers: CORS_HEADERS
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Delivered to #contact-inquiries" }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("Contact API Exception:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
