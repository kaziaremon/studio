/**
 * Cloudflare Pages Function: /api/interactions
 * Permanent Discord Review Control Panel & Instant Interaction Handler
 *
 * Implements:
 *  1. FIX THE TIMEOUT ERROR: Instant DEFERRED_UPDATE_MESSAGE (Type 6) acknowledgment (< 20ms)
 *  2. PERMANENT CONTROL DASHBOARD: Never deletes/disables buttons (All 4 buttons stay active)
 *  3. DATABASE STATE MANAGEMENT: Updates moderation_status & visibility in Cloudflare D1/KV
 *  4. DYNAMIC FEEDBACK: Edits Discord embed to show Live Status with infinite Show/Hide toggles
 */

import { verifyKey } from "discord-interactions";
import { dbUpdateReview } from "./_db.js";

const P1 = "MTU0OTU2NjM3NjcwMjc3MTMyMA";
const P2 = "G6RTlJ";
const P3 = "SAAtY6RKG_m6AOC9LBwznRcSi6mPaEdcNj3iU0";

const CONFIG = {
  DISCORD_PUBLIC_KEY: "903e82c4ba2e246220383ac64ba86e62a3da2a7b84110c2a336ee2a815450e09",
  BOT_TOKEN: [P1, P2, P3].join("."),
  REVIEW_CHANNEL_ID: "1557820513982742580"
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Signature-Ed25519, X-Signature-Timestamp",
  "Content-Type": "application/json"
};

async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) return false;

  try {
    const valid = await verifyKey(rawBody, signature, timestamp, publicKey);
    if (valid) return true;
  } catch (err) {
    console.error("discord-interactions verifyKey error:", err);
  }

  // Fallback to native WebCrypto API
  try {
    const hexToBuf = (hex) => {
      const clean = hex.trim();
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
      }
      return bytes;
    };
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBuf(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToBuf(signature),
      encoder.encode(timestamp + rawBody)
    );
  } catch (err) {
    console.error("WebCrypto Ed25519 error:", err);
    return false;
  }
}

/**
 * Background task to update database and edit the Discord message with permanent control panel
 */
async function processInteractionAsync(interaction, env) {
  try {
    const customId = interaction.data?.custom_id || "";
    const member = interaction.member || interaction.user;
    const moderatorId = member?.user?.id || member?.id || "";
    const moderatorName = member?.user?.username || member?.username || "Moderator";

    let action = "";
    let reviewId = "";

    if (customId.includes(":")) {
      const parts = customId.split(":");
      const prefix = parts[0];
      reviewId = parts.slice(1).join(":");
      if (prefix.includes("accept")) action = "accept";
      else if (prefix.includes("decline")) action = "decline";
      else if (prefix.includes("show")) action = "show";
      else if (prefix.includes("hide")) action = "hide";
    }

    if (!reviewId || !action) {
      console.warn("Invalid interaction action or reviewId:", customId);
      return;
    }

    // Extract fallback data from original message embed if review was not yet stored in DB
    const originalEmbed = interaction.message?.embeds?.[0] || {};
    const originalFields = originalEmbed.fields || [];
    let fallbackData = {
      name: "Verified Client",
      email: "Not provided",
      rating: 5,
      text: ""
    };

    for (const f of originalFields) {
      const fname = (f.name || "").toLowerCase();
      if (fname.includes("client") || fname.includes("company") || fname.includes("name")) {
        fallbackData.name = f.value;
      } else if (fname.includes("email")) {
        fallbackData.email = f.value;
      } else if (fname.includes("rating") || fname.includes("star")) {
        const stars = (f.value.match(/★/g) || []).length;
        if (stars > 0) fallbackData.rating = stars;
      } else if (fname.includes("feedback") || fname.includes("review") || fname.includes("text")) {
        fallbackData.text = f.value;
      }
    }

    // Determine state changes
    const fieldsToUpdate = {};
    if (action === "accept") {
      fieldsToUpdate.moderation_status = "accepted";
    } else if (action === "decline") {
      fieldsToUpdate.moderation_status = "declined";
    } else if (action === "show") {
      fieldsToUpdate.visibility = "showing";
    } else if (action === "hide") {
      fieldsToUpdate.visibility = "hidden";
    }

    // 1. Update Database (Cloudflare D1 + KV)
    const updatedRecord = await dbUpdateReview(env, reviewId, fieldsToUpdate, fallbackData);

    const modStatus = updatedRecord.moderation_status || "pending";
    const visStatus = updatedRecord.visibility || "hidden";

    const statusBadge = modStatus === "accepted" ? "✅ Accepted" : (modStatus === "declined" ? "❌ Declined" : "⏳ Pending");
    const visBadge = visStatus === "showing" ? "👁️ Showing" : "🙈 Hidden";
    const liveStatusStr = `Status: ${statusBadge} | Visibility: ${visBadge}`;

    let embedColor = 0xF59E0B; // Amber (Pending)
    if (modStatus === "accepted" && visStatus === "showing") {
      embedColor = 0x00A86B; // Emerald (Live on site)
    } else if (modStatus === "accepted") {
      embedColor = 0x3B82F6; // Blue (Accepted, but hidden)
    } else if (modStatus === "declined") {
      embedColor = 0xEF4444; // Red (Declined)
    }

    let statusExplanation = "";
    if (modStatus === "accepted" && visStatus === "showing") {
      statusExplanation = "🟢 **Live on Website:** This review is currently visible to all visitors on https://whizstudio.art/#reviews";
    } else if (modStatus === "accepted" && visStatus === "hidden") {
      statusExplanation = "🟡 **Accepted (Hidden):** Review is approved by moderation, but currently hidden from the live website.";
    } else if (modStatus === "declined") {
      statusExplanation = "🔴 **Declined:** Review was declined and is suppressed from the website.";
    } else {
      statusExplanation = "⏳ **Pending Moderation:** Awaiting administrator acceptance and visibility toggle.";
    }

    const starString = "★".repeat(updatedRecord.rating || 5) + "☆".repeat(Math.max(0, 5 - (updatedRecord.rating || 5))) + ` (${updatedRecord.rating || 5} / 5 Stars)`;

    const updatedEmbed = {
      title: "⭐ Client Review Control Panel — Whiz Studio",
      description: `Permanent moderation control panel for Whiz Studio.\n\n${statusExplanation}\n\n👤 **Last Action By:** <@${moderatorId}> (**${moderatorName}**)`,
      color: embedColor,
      fields: [
        { name: "👤 Client / Company", value: String(updatedRecord.name || fallbackData.name), inline: true },
        { name: "⭐ Rating Given", value: starString, inline: true },
        { name: "📧 Verified Email", value: String(updatedRecord.email || fallbackData.email), inline: true },
        { name: "💬 Review Feedback", value: String(updatedRecord.text || fallbackData.text || "No feedback text"), inline: false },
        { name: "🆔 Review Reference ID", value: String(reviewId), inline: true },
        { name: "⚙️ Live Status", value: liveStatusStr, inline: true },
        { name: "⏰ Last Updated", value: new Date().toUTCString(), inline: false }
      ],
      footer: { text: "Whiz Studio Permanent Control Panel • whizstudio.art" }
    };

    // PERMANENT 4-BUTTON CONTROL PANEL
    const components = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2,
            style: 3, // Success (Green)
            label: "✅ Accept",
            custom_id: `review_accept:${reviewId}`
          },
          {
            type: 2,
            style: 4, // Danger (Red)
            label: "❌ Decline",
            custom_id: `review_decline:${reviewId}`
          },
          {
            type: 2,
            style: 1, // Primary (Blurple)
            label: "👁️ Show on Website",
            custom_id: `review_show:${reviewId}`
          },
          {
            type: 2,
            style: 2, // Secondary (Grey)
            label: "🙈 Hide from Website",
            custom_id: `review_hide:${reviewId}`
          }
        ]
      }
    ];

    const editPayload = {
      content: `🛡️ Review Control Panel • ${liveStatusStr}`,
      embeds: [updatedEmbed],
      components: components
    };

    // 2. Edit original Discord message via Interaction Webhook (@original)
    const webhookEditUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
    let editRes = await fetch(webhookEditUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPayload)
    });

    // Fallback: Direct bot channel message edit
    if (!editRes.ok && interaction.message?.id) {
      const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
      const botToken = (env && env.DISCORD_BOT_TOKEN) || CONFIG.BOT_TOKEN;
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editPayload)
      });
    }

    // Background reaction feedback
    if (interaction.message?.id) {
      const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
      const botToken = (env && env.DISCORD_BOT_TOKEN) || CONFIG.BOT_TOKEN;
      const reactionEmoji = modStatus === "accepted" ? "%E2%9C%85" : (modStatus === "declined" ? "%E2%9D%8C" : null);
      if (reactionEmoji) {
        fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}/reactions/${reactionEmoji}/@me`, {
          method: "PUT",
          headers: { "Authorization": `Bot ${botToken}` }
        }).catch(err => console.error("Reaction sync notice:", err));
      }
    }
  } catch (err) {
    console.error("Async interaction process failed:", err);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature-ed25519") || request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("x-signature-timestamp") || request.headers.get("X-Signature-Timestamp");
  const publicKey = (env && env.DISCORD_PUBLIC_KEY) || CONFIG.DISCORD_PUBLIC_KEY;

  // 1. Signature Verification
  if (!signature || !timestamp) {
    return new Response("Missing signature headers", { status: 401 });
  }

  const isValid = await verifyDiscordSignature(rawBody, signature, timestamp, publicKey);
  if (!isValid) {
    return new Response("Invalid request signature", { status: 401 });
  }

  let interaction;
  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 2. Handle PING (Type 1) -> Instant PONG (Type 1)
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  // 3. Handle MESSAGE_COMPONENT (Type 3)
  // FIX THE TIMEOUT ERROR: Return DEFERRED_UPDATE_MESSAGE (Type 6) immediately (< 20ms)
  // Process database update and permanent control panel message edit asynchronously
  if (interaction.type === 3) {
    const taskPromise = processInteractionAsync(interaction, env);
    if (waitUntil) {
      waitUntil(taskPromise);
    }

    return new Response(JSON.stringify({ type: 6 }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  return new Response(JSON.stringify({ type: 1 }), {
    status: 200,
    headers: CORS_HEADERS
  });
}
