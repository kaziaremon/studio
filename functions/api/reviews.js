/**
 * Cloudflare Pages Function: /api/reviews
 * Public Testimonials API:
 * Serves verified client reviews strictly matching:
 * (moderation_status === 'approved' || moderation_status === 'accepted') AND visibility === 'show'.
 * Protected with edge cache headers to strictly safeguard Cloudflare Free Tier quotas.
 */

import { kvGetAll } from "./_db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ env }) {
  try {
    const allReviews = await kvGetAll(env, "review_");
    const approvedReviews = [];

    for (const review of allReviews) {
      const isApproved = review.moderation_status === "approved" || review.moderation_status === "accepted";
      const isVisible = review.visibility === "show";

      if (isApproved && isVisible) {
        approvedReviews.push({
          id: review.id,
          clientName: review.clientName || review.name || "Verified Client",
          name: review.clientName || review.name || "Verified Client",
          role: review.role || review.service || "Verified Client",
          service: review.service || review.role || "Marketing Services",
          reviewText: review.reviewText || review.text || "",
          text: review.reviewText || review.text || "",
          rating: Number(review.rating) || 5,
          timestamp: review.timestamp || review.created_at || "",
          date: review.timestamp || review.created_at
            ? new Date(review.timestamp || review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Verified Client"
        });
      }
    }

    approvedReviews.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return new Response(JSON.stringify({
      success: true,
      count: approvedReviews.length,
      reviews: approvedReviews
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Public Reviews API Error:", err);
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
