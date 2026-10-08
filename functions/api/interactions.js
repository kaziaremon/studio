/**
 * Cloudflare Pages Function: /api/interactions
 * Instant Discord Interaction Handler (< 50ms)
 * 
 * Satisfies Discord's strict 3-second acknowledgment window:
 *  - Handles PING (Type 1) -> Returns PONG (Type 1)
 *  - Handles MESSAGE_COMPONENT (Type 3) -> Returns Instant UPDATE_MESSAGE (Type 7)
 *  - Validates ED25519 signatures via discord-interactions / WebCrypto
 *  - Dispatches background sync via ctx.waitUntil
 */

import { verifyKey } from "discord-interactions";

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

  // 3. Handle MESSAGE_COMPONENT (Type 3) -> Instant UPDATE_MESSAGE (Type 7)
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id || "";
    const member = interaction.member || interaction.user;
    const moderatorId = member?.user?.id || member?.id || "";
    const moderatorName = member?.user?.username || member?.username || "Moderator";
    const originalEmbed = interaction.message?.embeds?.[0] || {};
    const originalFields = originalEmbed.fields || [];

    // APPROVE
    if (customId.startsWith("accept_review")) {
      const updatedEmbed = {
        title: "✅ Client Review Approved & Published — Whiz Studio",
        description: `This review was **APPROVED** by <@${moderatorId}> (**${moderatorName}**).\nIt is verified and approved for live display.`,
        color: 0x00A86B, // Emerald
        fields: originalFields,
        footer: { text: "Whiz Studio Moderation Panel • Approved" },
        timestamp: new Date().toISOString()
      };

      // Background task: Add reaction to message
      if (waitUntil && interaction.message?.id) {
        const botToken = (env && env.DISCORD_BOT_TOKEN) || CONFIG.BOT_TOKEN;
        const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
        waitUntil(
          fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}/reactions/%E2%9C%85/@me`, {
            method: "PUT",
            headers: { "Authorization": `Bot ${botToken}` }
          }).catch(console.error)
        );
      }

      // Return INSTANT 200 OK with Type 7
      return new Response(JSON.stringify({
        type: 7,
        data: {
          content: `✅ Review accepted and published by **@${moderatorName}**!`,
          embeds: [updatedEmbed],
          components: [] // Removes buttons immediately
        }
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // DECLINE
    if (customId.startsWith("decline_review")) {
      const updatedEmbed = {
        title: "❌ Client Review Declined — Whiz Studio",
        description: `This review was **DECLINED** and dismissed by <@${moderatorId}> (**${moderatorName}**).`,
        color: 0xEF4444, // Red
        fields: originalFields,
        footer: { text: "Whiz Studio Moderation Panel • Declined" },
        timestamp: new Date().toISOString()
      };

      if (waitUntil && interaction.message?.id) {
        const botToken = (env && env.DISCORD_BOT_TOKEN) || CONFIG.BOT_TOKEN;
        const channelId = interaction.channel_id || CONFIG.REVIEW_CHANNEL_ID;
        waitUntil(
          fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${interaction.message.id}/reactions/%E2%9D%8C/@me`, {
            method: "PUT",
            headers: { "Authorization": `Bot ${botToken}` }
          }).catch(console.error)
        );
      }

      return new Response(JSON.stringify({
        type: 7,
        data: {
          content: `❌ Review declined and dismissed by **@${moderatorName}**.`,
          embeds: [updatedEmbed],
          components: []
        }
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Fallback: Type 6 DeferredUpdateMessage
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
