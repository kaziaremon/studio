/**
 * Cloudflare Pages Function: /discord/interactions & /api/interactions
 * Instant Type 7 Button Interaction Handler using Cloudflare KV REVIEWS_DB
 */

import nacl from "tweetnacl";
import { kvGet, kvPut } from "./_db.js";

const CONFIG = {
  DISCORD_PUBLIC_KEY: "903e82c4ba2e246220383ac64ba86e62a3da2a7b84110c2a336ee2a815450e09"
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Signature-Ed25519, X-Signature-Timestamp",
  "Content-Type": "application/json"
};

function hexToUint8Array(hex) {
  const clean = hex.trim();
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return arr;
}

async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    const verified = await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToUint8Array(signature),
      encoder.encode(timestamp + rawBody)
    );
    if (verified) return true;
  } catch (err) {}

  try {
    const encoder = new TextEncoder();
    return nacl.sign.detached.verify(
      encoder.encode(timestamp + rawBody),
      hexToUint8Array(signature),
      hexToUint8Array(publicKey)
    );
  } catch (err) {
    return false;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature-ed25519") || request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("x-signature-timestamp") || request.headers.get("X-Signature-Timestamp");
  const publicKey = (env && env.DISCORD_PUBLIC_KEY) || CONFIG.DISCORD_PUBLIC_KEY;

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

  // PING -> Instant PONG
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  // Button Click (Type 3) -> Instant Type 7 Response
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id || "";
    const member = interaction.member || interaction.user;
    const moderatorName = member?.user?.username || member?.username || "Moderator";

    let action = "";
    let id = "";

    if (customId.startsWith("accept_")) {
      action = "accept";
      id = customId.replace("accept_", "");
    } else if (customId.startsWith("decline_")) {
      action = "decline";
      id = customId.replace("decline_", "");
    } else if (customId.startsWith("show_")) {
      action = "show";
      id = customId.replace("show_", "");
    } else if (customId.startsWith("hide_")) {
      action = "hide";
      id = customId.replace("hide_", "");
    }

    if (!id || !action) {
      return new Response(JSON.stringify({ type: 6 }), { status: 200, headers: CORS_HEADERS });
    }

    // 1. Fetch from KV
    let review = null;
    const existingRaw = await kvGet(env, `review_${id}`);
    if (existingRaw) {
      try {
        review = JSON.parse(existingRaw);
      } catch (e) {}
    }

    if (!review) {
      const originalEmbed = interaction.message?.embeds?.[0] || {};
      const fields = originalEmbed.fields || [];
      let name = "Verified Client";
      let text = "";
      let rating = 5;

      for (const f of fields) {
        const fn = (f.name || "").toLowerCase();
        if (fn.includes("client") || fn.includes("company") || fn.includes("name")) name = f.value;
        else if (fn.includes("feedback") || fn.includes("review") || fn.includes("text")) text = f.value;
        else if (fn.includes("rating") || fn.includes("star")) {
          const s = (f.value.match(/★/g) || []).length;
          if (s > 0) rating = s;
        }
      }

      review = {
        id,
        clientName: name,
        reviewText: text,
        rating,
        moderation_status: "pending",
        visibility: "hidden",
        timestamp: new Date().toISOString()
      };
    }

    // 2. Update KV fields
    if (action === "accept") review.moderation_status = "accepted";
    else if (action === "decline") review.moderation_status = "declined";
    else if (action === "show") review.visibility = "show";
    else if (action === "hide") review.visibility = "hidden";

    review.updated_at = new Date().toISOString();
    await kvPut(env, `review_${id}`, JSON.stringify(review));

    // 3. Badges and color
    const modStatus = review.moderation_status;
    const visStatus = review.visibility;

    const statusBadge = modStatus === "accepted" ? "✅ Accepted" : (modStatus === "declined" ? "❌ Declined" : "⏳ Pending");
    const visBadge = visStatus === "show" ? "👁️ Showing" : "🙈 Hidden";
    const liveStatusStr = `Status: ${statusBadge} | Visibility: ${visBadge}`;

    let embedColor = 0xF59E0B;
    if (modStatus === "accepted" && visStatus === "show") embedColor = 0x00A86B;
    else if (modStatus === "accepted") embedColor = 0x3B82F6;
    else if (modStatus === "declined") embedColor = 0xEF4444;

    let statusDetail = "";
    if (modStatus === "accepted" && visStatus === "show") {
      statusDetail = "🟢 **Live on Website:** This review is currently visible on https://whizstudio.art/#reviews";
    } else if (modStatus === "accepted" && visStatus === "hidden") {
      statusDetail = "🟡 **Accepted (Hidden):** Review is approved, but currently hidden from website display.";
    } else if (modStatus === "declined") {
      statusDetail = "🔴 **Declined:** Review was declined and is suppressed from the website.";
    } else {
      statusDetail = "⏳ **Pending:** Awaiting administrator authorization.";
    }

    const starString = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5)) + ` (${review.rating || 5} / 5 Stars)`;

    const updatedEmbed = {
      title: "⭐ Client Review Control Panel — Whiz Studio",
      description: `Permanent moderation control panel for Whiz Studio.\n\n${statusDetail}\n👤 **Last Updated By:** **@${moderatorName}**`,
      color: embedColor,
      fields: [
        { name: "👤 Client / Company", value: String(review.clientName || "Client"), inline: true },
        { name: "⭐ Rating Given", value: starString, inline: true },
        { name: "💬 Review Feedback", value: String(review.reviewText || "No review feedback"), inline: false },
        { name: "🆔 Review Reference ID", value: String(id), inline: true },
        { name: "⚙️ Live Status", value: liveStatusStr, inline: true },
        { name: "⏰ Last Updated", value: new Date().toUTCString(), inline: false }
      ],
      footer: { text: "Whiz Studio Review Control Panel • whizstudio.art" }
    };

    const components = [
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "✅ Accept", custom_id: `accept_${id}` },
          { type: 2, style: 4, label: "❌ Decline", custom_id: `decline_${id}` },
          { type: 2, style: 1, label: "👁️ Show", custom_id: `show_${id}` },
          { type: 2, style: 2, label: "🙈 Hide", custom_id: `hide_${id}` }
        ]
      }
    ];

    // Return instant Type 7
    return new Response(JSON.stringify({
      type: 7,
      data: {
        content: `🛡️ Review Control Panel • ${liveStatusStr}`,
        embeds: [updatedEmbed],
        components: components
      }
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  return new Response(JSON.stringify({ type: 1 }), { status: 200, headers: CORS_HEADERS });
}
