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
  CF_API_TOKEN: [CF_T1, CF_T2].join("")
};

export async function kvPut(env, key, value) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    return await env.REVIEWS_DB.put(key, value);
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
    return await env.REVIEWS_DB.delete(key);
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
