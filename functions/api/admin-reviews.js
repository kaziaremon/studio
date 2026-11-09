/**
 * Cloudflare Pages Function: /api/admin-reviews
 * Super Admin Review Moderation API
 * Full moderation controls: Approve, Reject, Hide, Show, Toggle Visibility, and Delete.
 */

import { kvGetAll, kvGet, kvPut, kvDelete } from "./_db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Clerk-User-Id",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET: Fetch ALL reviews across all statuses for moderation
export async function onRequestGet({ env }) {
  try {
    const reviews = await kvGetAll(env, "review_");

    reviews.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));

    return new Response(JSON.stringify({
      success: true,
      count: reviews.length,
      reviews
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("GET /api/admin-reviews Error:", err);
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

// POST / PATCH: Moderate review (Approve, Reject, Hide/Show, Toggle Visibility)
export async function onRequestPost(context) {
  return handleModeration(context);
}

export async function onRequestPatch(context) {
  return handleModeration(context);
}

async function handleModeration({ request, env }) {
  try {
    const body = await request.json();
    const { id, action, status, visibility } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Review ID is required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const key = id.startsWith("review_") ? id : `review_${id}`;
    const raw = await kvGet(env, key);
    if (!raw) {
      return new Response(JSON.stringify({ success: false, error: "Review not found" }), {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    const review = JSON.parse(raw);

    // Explicit Action Logic
    if (action === "approve") {
      review.moderation_status = "approved";
      review.visibility = "show"; // When approved, make live on public site
    } else if (action === "reject") {
      review.moderation_status = "rejected";
      review.visibility = "hidden"; // When rejected, hide from public site
    } else if (action === "toggle_visibility") {
      review.visibility = review.visibility === "show" ? "hidden" : "show";
    } else if (action === "hide") {
      review.visibility = "hidden";
    } else if (action === "show") {
      review.visibility = "show";
    } else if (action === "delete") {
      await kvDelete(env, key);
      return new Response(JSON.stringify({ success: true, id, message: "Review deleted successfully." }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    if (status) review.moderation_status = status;
    if (visibility) review.visibility = visibility;

    review.updated_at = new Date().toISOString();
    review.moderated_by = "Super Admin";

    await kvPut(env, key, JSON.stringify(review));

    return new Response(JSON.stringify({
      success: true,
      review,
      message: `Review successfully updated (${review.moderation_status} | ${review.visibility})`
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Moderation Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

// DELETE: Permanently remove review
export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Review ID required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const key = id.startsWith("review_") ? id : `review_${id}`;
    await kvDelete(env, key);

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Review permanently deleted."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("DELETE /api/admin-reviews Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

