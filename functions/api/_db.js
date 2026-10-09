/**
 * Cloudflare KV REVIEWS_DB State Management Module
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
    body: value
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

export async function kvList(env, prefix = "review_") {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.list === "function") {
    const res = await env.REVIEWS_DB.list({ prefix });
    return res.keys || [];
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CF_CONFIG.KV_NAMESPACE_ID}/keys?prefix=${prefix}`, {
    headers: { "Authorization": `Bearer ${CF_CONFIG.CF_API_TOKEN}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.result || [];
  }
  return [];
}
