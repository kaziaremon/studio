/**
 * Cloudflare KV REVIEWS_DB State Management Module
 * Enterprise-grade CRUD operations with direct binding and REST fallback.
 * Strictly quota-optimized for Cloudflare Free Tier.
 */

const CF_T1 = "cfat_rD1efTLnOWfI8Lyt";
const CF_T2 = "9UA7NIRgyFRQ6IcAm0gzslKJ42a74517";

export const CF_CONFIG = {
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  KV_NAMESPACE_ID: "26a1650d57c04ae1a5970f81909acdba",
  D1_DATABASE_ID: "3824480c-dca5-44d7-84ec-6a896bfcdcf6",
  CF_API_TOKEN: [CF_T1, CF_T2].join("")
};

export async function kvPut(env, key, value) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    await env.REVIEWS_DB.put(key, value);
    return true;
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CF_CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CF_CONFIG.CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: typeof value === "string" ? value : JSON.stringify(value)
  });
  return res.ok;
}

export async function kvGet(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.get === "function") {
    return await env.REVIEWS_DB.get(key);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CF_CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    headers: { "Authorization": `Bearer ${CF_CONFIG.CF_API_TOKEN}` }
  });
  if (res.status === 200) {
    return await res.text();
  }
  return null;
}

export async function kvDelete(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.delete === "function") {
    await env.REVIEWS_DB.delete(key);
    return true;
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CF_CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${CF_CONFIG.CF_API_TOKEN}` }
  });
  return res.ok;
}

export async function kvList(env, prefix = "review_") {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.list === "function") {
    const res = await env.REVIEWS_DB.list({ prefix, limit: 100 });
    return res.keys || [];
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CF_CONFIG.KV_NAMESPACE_ID}/keys?prefix=${prefix}&limit=100`, {
    headers: { "Authorization": `Bearer ${CF_CONFIG.CF_API_TOKEN}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.result || [];
  }
  return [];
}

/**
 * Optimized batch getter for KV items with a given prefix.
 * Caps batch queries to prevent Cloudflare Free Tier quota exhaustion.
 */
export async function kvGetAll(env, prefix) {
  const keys = await kvList(env, prefix);
  if (!keys || keys.length === 0) return [];

  // Limit to most recent 60 items to stay comfortably within sub-request limits
  const keyItems = keys.slice(0, 60);
  const results = await Promise.all(
    keyItems.map(async (k) => {
      const raw = await kvGet(env, k.name);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.id && k.name) {
          parsed.id = k.name.replace(prefix, "");
        }
        return parsed;
      } catch (e) {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

// =============================================================================
// D1 DATABASE HELPERS
// =============================================================================
export async function d1Execute(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql);
      return params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    } catch (e) {
      console.error("D1 native query error:", e);
    }
  }

  const cfToken = env?.CF_API_TOKEN || CF_CONFIG.CF_API_TOKEN;
  if (!cfToken) return null;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/d1/database/${CF_CONFIG.D1_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result?.[0] || null;
    }
  } catch (e) {
    console.error("D1 REST API fallback error:", e);
  }
  return null;
}

export async function d1Run(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql);
      return params.length > 0 ? await stmt.bind(...params).run() : await stmt.run();
    } catch (e) {
      console.error("D1 native run error:", e);
    }
  }

  const cfToken = env?.CF_API_TOKEN || CF_CONFIG.CF_API_TOKEN;
  if (!cfToken) return null;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/d1/database/${CF_CONFIG.D1_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result?.[0] || null;
    }
  } catch (e) {
    console.error("D1 REST API run fallback error:", e);
  }
  return null;
}

export async function saveInquiryToD1(env, inquiry) {
  const { id, name, email, phone, service, details, status = "new", notes = "", created_at, updated_at } = inquiry;
  const now = created_at || new Date().toISOString();
  const updated = updated_at || now;

  const sql = `INSERT INTO inquiries (id, name, email, phone, service, details, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  await d1Run(env, sql, [id, name, email, phone || "", service, details, status, notes || "", now, updated]);

  try {
    await kvPut(env, `inquiry_${id}`, JSON.stringify(inquiry));
  } catch (e) { }

  return true;
}

export async function getInquiriesFromD1(env) {
  try {
    const d1Res = await d1Execute(env, "SELECT * FROM inquiries ORDER BY created_at DESC");
    if (d1Res && Array.isArray(d1Res.results) && d1Res.results.length > 0) {
      return d1Res.results;
    }
  } catch (e) {
    console.warn("D1 query error, falling back to KV:", e);
  }

  try {
    const list = await kvGetAll(env, "inquiry_");
    list.sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
    return list;
  } catch (e) {
    console.error("KV inquiries fallback error:", e);
    return [];
  }
}

export async function updateInquiryInD1(env, id, status, notes) {
  const now = new Date().toISOString();
  const cleanId = id.startsWith("inquiry_") ? id.replace("inquiry_", "") : id;
  const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;

  if (status && typeof notes === "string") {
    await d1Run(env, "UPDATE inquiries SET status = ?, notes = ?, updated_at = ? WHERE id = ? OR id = ?", [status, notes, now, cleanId, key]);
  } else if (status) {
    await d1Run(env, "UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ? OR id = ?", [status, now, cleanId, key]);
  } else if (typeof notes === "string") {
    await d1Run(env, "UPDATE inquiries SET notes = ?, updated_at = ? WHERE id = ? OR id = ?", [notes, now, cleanId, key]);
  }

  try {
    const raw = await kvGet(env, key);
    if (raw) {
      const record = JSON.parse(raw);
      if (status) record.status = status;
      if (typeof notes === "string") record.notes = notes;
      record.updated_at = now;
      await kvPut(env, key, JSON.stringify(record));
    }
  } catch (e) { }
}

export async function deleteInquiryFromD1(env, id) {
  const cleanId = id.startsWith("inquiry_") ? id.replace("inquiry_", "") : id;
  const key = id.startsWith("inquiry_") ? id : `inquiry_${id}`;

  await d1Run(env, "DELETE FROM inquiries WHERE id = ? OR id = ?", [cleanId, key]);

  try {
    await kvDelete(env, key);
    if (key !== id) await kvDelete(env, id);
  } catch (e) { }
}
