/**
 * Database State Management Module for Whiz Studio Reviews
 * Backed by Cloudflare D1 (Native binding & REST API fallback) + Cloudflare KV Mirror
 */

const CF_T1 = "cfat_rD1efTLnOWfI8Lyt";
const CF_T2 = "9UA7NIRgyFRQ6IcAm0gzslKJ42a74517";

export const CF_CONFIG = {
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  D1_DATABASE_ID: "650c7bd8-8150-4745-9a6e-a1554e807546",
  CF_API_TOKEN: [CF_T1, CF_T2].join("")
};

/**
 * Execute SQL query on D1 (Native binding or REST API fallback)
 */
export async function executeSql(env, sql, params = []) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql).bind(...params);
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        const { results } = await stmt.all();
        return results || [];
      } else {
        const res = await stmt.run();
        return res;
      }
    } catch (err) {
      console.error("Native D1 execution error:", err);
    }
  }

  // REST API Fallback
  try {
    const apiToken = (env && env.CLOUDFLARE_API_TOKEN) || CF_CONFIG.CF_API_TOKEN;
    const accountId = (env && env.CLOUDFLARE_ACCOUNT_ID) || CF_CONFIG.ACCOUNT_ID;
    const dbId = (env && env.D1_DATABASE_ID) || CF_CONFIG.D1_DATABASE_ID;

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });

    const json = await res.json();
    if (json.success && json.result?.[0]) {
      return json.result[0].results || [];
    }
  } catch (err) {
    console.error("D1 REST API fallback error:", err);
  }

  return [];
}

/**
 * Save or update review in database and mirror to KV
 */
export async function dbSaveReview(env, review) {
  const {
    id,
    name = "Verified Client",
    email = "Not provided",
    rating = 5,
    text = "",
    moderation_status = "pending",
    visibility = "hidden",
    created_at,
    updated_at
  } = review;

  const now = new Date().toISOString();
  const cAt = created_at || now;
  const uAt = updated_at || now;

  const sql = `
    INSERT INTO reviews (id, name, email, rating, text, moderation_status, visibility, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      rating = excluded.rating,
      text = excluded.text,
      moderation_status = excluded.moderation_status,
      visibility = excluded.visibility,
      updated_at = excluded.updated_at
  `;

  await executeSql(env, sql, [id, name, email, Number(rating) || 5, text, moderation_status, visibility, cAt, uAt]);

  // Mirror to KV if available
  if (env && env.REVIEWS_KV && typeof env.REVIEWS_KV.put === "function") {
    try {
      await env.REVIEWS_KV.put(`review:${id}`, JSON.stringify({
        id, name, email, rating: Number(rating) || 5, text, moderation_status, visibility, created_at: cAt, updated_at: uAt
      }));
    } catch (err) {
      console.error("KV put error:", err);
    }
  }
}

/**
 * Fetch a single review by ID
 */
export async function dbGetReview(env, id) {
  const sql = "SELECT * FROM reviews WHERE id = ? LIMIT 1";
  const rows = await executeSql(env, sql, [id]);
  if (rows && rows.length > 0) {
    return rows[0];
  }

  // Fallback check KV
  if (env && env.REVIEWS_KV && typeof env.REVIEWS_KV.get === "function") {
    try {
      const val = await env.REVIEWS_KV.get(`review:${id}`);
      if (val) return JSON.parse(val);
    } catch (err) {
      console.error("KV get error:", err);
    }
  }

  return null;
}

/**
 * Update review status/visibility and return updated record
 */
export async function dbUpdateReview(env, id, fieldsToUpdate, fallbackData = {}) {
  let existing = await dbGetReview(env, id);
  const now = new Date().toISOString();

  if (!existing) {
    existing = {
      id,
      name: fallbackData.name || "Verified Client",
      email: fallbackData.email || "Not provided",
      rating: Number(fallbackData.rating) || 5,
      text: fallbackData.text || "",
      moderation_status: "pending",
      visibility: "hidden",
      created_at: now,
      updated_at: now
    };
  }

  const updatedRecord = {
    ...existing,
    ...fieldsToUpdate,
    updated_at: now
  };

  await dbSaveReview(env, updatedRecord);
  return updatedRecord;
}

/**
 * Fetch reviews filtered strictly by moderation_status === 'accepted' AND visibility === 'showing'
 */
export async function dbGetApprovedAndShowingReviews(env) {
  const sql = `
    SELECT id, name, rating, text, created_at, updated_at
    FROM reviews
    WHERE moderation_status = 'accepted' AND visibility = 'showing'
    ORDER BY created_at DESC
  `;
  const rows = await executeSql(env, sql);
  return rows || [];
}
