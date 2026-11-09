/**
 * Cloudflare Pages Function: /api/inquiries
 * Super Admin CRM Inquiries & Lead Management API
 * Provides full CRUD operations for inbound leads stored in Cloudflare KV.
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

// GET: Retrieve all client inquiries
export async function onRequestGet({ env }) {
  try {
    const list = await kvGetAll(env, "inquiry_");
    
    // Sort newest first
    list.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));

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

// POST / PATCH: Update inquiry status or admin notes
export async function onRequestPost(context) {
  return handleUpdate(context);
}

export async function onRequestPatch(context) {
  return handleUpdate(context);
}

async function handleUpdate({ request, env }) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry ID is required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
    const raw = await kvGet(env, key);
    if (!raw) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry not found" }), {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    const record = JSON.parse(raw);
    if (status) record.status = status;
    if (typeof notes === "string") record.notes = notes;
    record.updated_at = new Date().toISOString();

    await kvPut(env, key, JSON.stringify(record));

    return new Response(JSON.stringify({
      success: true,
      inquiry: record,
      message: "Inquiry updated successfully."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error("Update /api/inquiries Error:", err);
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
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Inquiry ID required" }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;
    await kvDelete(env, key);
    if (key !== id) {
      await kvDelete(env, id);
    }

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

