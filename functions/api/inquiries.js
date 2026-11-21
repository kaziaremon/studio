/**
 * Cloudflare Pages Function: /api/inquiries
 * Super Admin CRM Inquiries & Lead Management API
 * Provides full CRUD operations for inbound leads stored in Cloudflare D1.
 */

import { getInquiriesFromD1, saveInquiryToD1, updateInquiryInD1, deleteInquiryFromD1 } from "./_db.js";

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

// GET: Retrieve all client inquiries
export async function onRequestGet({ env }) {
  try {
    const list = await getInquiriesFromD1(env);

    return new Response(JSON.stringify({
      success: true,
      count: list.length,
      inquiries: list
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("GET /api/inquiries Error:", err);
    return new Response(JSON.stringify({
      success: false,
      inquiries: [],
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

// POST: Handles public quote submissions (when name/email/details present) or admin status updates
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));

    // Public lead inquiry submission
    if (body && body.name && body.email && body.details && !body.id) {
      const { name, email, phone, service, details } = body;
      const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const inquiryRecord = {
        id,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || "").trim(),
        service: String(service || "General Inquiry").trim(),
        details: String(details).trim(),
        status: "new",
        notes: "",
        created_at: nowIso,
        timestamp: nowIso,
        updated_at: nowIso
      };

      await saveInquiryToD1(env, inquiryRecord);

      return new Response(JSON.stringify({
        success: true,
        id,
        message: "Your inquiry has been successfully registered with Whiz Studio. Our executive team will review and respond shortly."
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Admin status/notes update
    const { id, status, notes } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry ID is required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await updateInquiryInD1(env, id, status, notes);

    return new Response(JSON.stringify({
      success: true,
      message: "Inquiry updated successfully."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("POST /api/inquiries Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, notes } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry ID is required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await updateInquiryInD1(env, id, status, notes);

    return new Response(JSON.stringify({
      success: true,
      message: "Inquiry updated successfully."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("PATCH /api/inquiries Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

// DELETE: Remove an inquiry
export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry ID required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await deleteInquiryFromD1(env, id);

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Inquiry deleted successfully from database."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("DELETE /api/inquiries Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
}

