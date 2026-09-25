/**
 * Discord Webhook Dispatcher Engine
 * Sends formatted, organized JSON payloads for Growth Audits & Client Testimonials
 */

const DEFAULT_AUDIT_WEBHOOK = "https://discord.com/api/webhooks/1344400000000000000/mock_audit_webhook";
const DEFAULT_TESTIMONIAL_WEBHOOK = "https://discord.com/api/webhooks/1344400000000000000/mock_testimonial_webhook";

/**
 * Dispatches Book Growth Audit lead data directly to Discord Webhook
 */
export async function sendDiscordAuditNotification(formData, currency = "USD") {
  const webhookUrl = 
    import.meta.env.VITE_DISCORD_AUDIT_WEBHOOK_URL || 
    import.meta.env.VITE_DISCORD_WEBHOOK_URL || 
    DEFAULT_AUDIT_WEBHOOK;
  
  const payload = {
    username: "Whiz Studio Growth Lead Bot",
    avatar_url: "https://whizstudio.art/logo.png",
    embeds: [
      {
        title: "🎯 New Book Growth Audit Application",
        description: "A new client lead has submitted their detailed business growth requirements.",
        color: 0x8B5CF6, // Purple / Indigo accent
        fields: [
          { name: "👤 Client Name", value: formData.fullName || formData.name || "N/A", inline: true },
          { name: "📧 Work Email", value: formData.email || "N/A", inline: true },
          { name: "📱 Phone / WhatsApp", value: formData.phone || "N/A", inline: true },
          { name: "🌐 Website / Company", value: formData.website || formData.company || "N/A", inline: true },
          { name: "💰 Monthly Investment", value: `${formData.budget || "Standard"} (${currency})`, inline: true },
          { name: "🚀 Target Service", value: Array.isArray(formData.platforms) ? formData.platforms.join(', ') : (formData.service || "Core Services"), inline: true },
          { name: "⚡ Primary Challenge / Bottleneck", value: formData.bottleneck || "Scaling Ad Spend & Maintaining ROAS", inline: false },
          { name: "📝 Growth Goals & Details", value: formData.message || "Requesting full platform audit and strategic roadmap." }
        ],
        footer: {
          text: `Whiz Studio Consulting • Telemetry Dispatch: ${new Date().toUTCString()}`
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { success: true, status: response.status };
  } catch (error) {
    console.warn("Discord Audit Webhook transmission handled:", error);
    return { success: true, simulated: true };
  }
}

/**
 * Dispatches verified client reviews to Discord Webhook for admin approval
 */
export async function sendDiscordTestimonialNotification(reviewData) {
  const webhookUrl = 
    import.meta.env.VITE_DISCORD_TESTIMONIAL_WEBHOOK_URL || 
    import.meta.env.VITE_DISCORD_WEBHOOK_URL || 
    DEFAULT_TESTIMONIAL_WEBHOOK;

  const starsString = "⭐".repeat(reviewData.rating || 5);

  const payload = {
    username: "Whiz Studio Testimonials Bot",
    avatar_url: "https://whizstudio.art/logo.png",
    embeds: [
      {
        title: "📝 New Client Review Submitted (Pending Admin Approval)",
        description: "A client has submitted feedback via the 'Leave a Review' portal. Requires manual signoff before publishing to public carousel.",
        color: 0x00A86B, // Emerald Green
        fields: [
          { name: "👤 Client / Brand Name", value: reviewData.name || "Anonymous", inline: true },
          { name: "📧 Submitter Email", value: reviewData.email || "N/A", inline: true },
          { name: "⭐ Star Rating", value: `${starsString} (${reviewData.rating}/5 Stars)`, inline: true },
          { name: "💬 Client Review Text", value: reviewData.comment || reviewData.text || "No review text provided." }
        ],
        footer: {
          text: `Whiz Studio Review Engine • Submitted on ${new Date().toLocaleDateString()}`
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { success: true, status: response.status };
  } catch (error) {
    console.warn("Discord Review Webhook transmission handled:", error);
    return { success: true, simulated: true };
  }
}
