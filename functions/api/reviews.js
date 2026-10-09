/**
 * Cloudflare Pages Function: /api/reviews
 * Route C: Fetches reviews from REVIEWS_DB KV and filters for moderation_status === 'accepted' AND visibility === 'show'.
 */

import { kvList, kvGet } from "./_db.js";

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
    const keys = await kvList(env, "review_");
    const filteredReviews = [];

    for (const k of keys) {
      const val = await kvGet(env, k.name);
      if (val) {
        try {
          const review = JSON.parse(val);
          if (review.moderation_status === "accepted" && review.visibility === "show") {
            filteredReviews.push({
              id: review.id,
              clientName: review.clientName,
              name: review.clientName,
              reviewText: review.reviewText,
              text: review.reviewText,
              rating: Number(review.rating) || 5,
              moderation_status: review.moderation_status,
              visibility: review.visibility,
              timestamp: review.timestamp,
              date: review.timestamp ? new Date(review.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Verified Client"
            });
          }
        } catch (e) {}
      }
    }

    filteredReviews.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return new Response(JSON.stringify({
      success: true,
      count: filteredReviews.length,
      reviews: filteredReviews
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Route C Error:", err);
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
