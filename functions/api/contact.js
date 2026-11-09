/**
 * Cloudflare Pages Function: /api/contact and /api/submit-contact
 * Direct Lead Generation Engine: Routes all inbound prospective client inquiries
 * into Cloudflare KV database (prefix: inquiry_) for Super Admin CRM management.
 * Disconnected entirely from Discord.
 */

import { kvPut } from "./_db.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, phone, service, details } = data;

    if (!name || !email || !details) {
      return new Response(JSON.stringify({
        success: false,
        error: "Client Name, Email Address, and Project Scope details are required."
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const inquiryRecord = {
      id,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      service: String(service || "General Inquiry").trim(),
      details: String(details).trim(),
      status: "new", // 'new' | 'contacted' | 'in_progress' | 'closed'
      created_at: nowIso,
      timestamp: nowIso,
      updated_at: nowIso,
      notes: ""
    };

    const saved = await kvPut(env, `inquiry_${id}`, JSON.stringify(inquiryRecord));
    if (!saved) {
      throw new Error("Database write failed");
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Your inquiry has been successfully registered with Whiz Studio. Our executive team will review and respond shortly."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error("Lead Generation API Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Failed to process inquiry submission."
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
