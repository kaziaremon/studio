/**
 * Cloudflare Pages Function: /api/reviews
 * Website Reviews API Endpoint
 *
 * Filters and returns ONLY reviews where:
 *  moderation_status === 'accepted' AND visibility === 'showing'
 */

import { dbGetApprovedAndShowingReviews } from "./_db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ env }) {
  try {
    // Fetch ONLY reviews where moderation_status = 'accepted' AND visibility = 'showing'
    const rows = await dbGetApprovedAndShowingReviews(env);

    const reviews = (rows || []).map(r => ({
      id: r.id,
      name: r.name || "Verified Client",
      rating: Number(r.rating) || 5,
      text: r.text || "",
      date: r.created_at
        ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Verified Client"
    }));

    return new Response(JSON.stringify({
      success: true,
      count: reviews.length,
      reviews: reviews
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Error fetching filtered reviews:", err);
    return new Response(JSON.stringify({
      success: false,
      reviews: [],
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
