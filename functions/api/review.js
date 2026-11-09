/**
 * Cloudflare Pages Function: /api/review and /api/submit-review
 * Client Review Ingestion Engine:
 * Authenticated clients submit reviews directly into Cloudflare KV database (prefix: review_).
 * Saved with default moderation_status: 'pending' and visibility: 'hidden'.
 * Completely disconnected from Discord.
 */

import { kvPut } from "./_db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Clerk-User-Id",
  "Content-Type": "application/json"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const clientName = body.clientName || body.name || "Anonymous Client";
    const reviewText = body.reviewText || body.text || body.review || body.feedback || "";
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const role = body.role || body.service || "Verified Client";
    const email = body.email || "";

    if (!reviewText || !reviewText.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: "Review feedback text is required."
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const reviewData = {
      id,
      clientName: String(clientName).trim(),
      name: String(clientName).trim(),
      email: String(email).trim().toLowerCase(),
      role: String(role).trim(),
      service: String(role).trim(),
      reviewText: String(reviewText).trim(),
      text: String(reviewText).trim(),
      rating: rating,
      moderation_status: "pending", // Default Pending requirement
      visibility: "hidden",         // Hidden until approved
      created_at: nowIso,
      timestamp: nowIso,
      updated_at: nowIso,
      moderated_by: ""
    };

    const saved = await kvPut(env, `review_${id}`, JSON.stringify(reviewData));
    if (!saved) {
      throw new Error("Failed to write review to KV database.");
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Review submitted successfully! It is now pending moderation in the Super Admin Console."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Client Review Submission Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Failed to submit review."
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
