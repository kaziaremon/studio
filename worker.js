/**
 * 100% CLOUDFLARE-NATIVE BACKEND & DISCORD INTERACTION ENGINE (_worker.js)
 * Whiz Studio Reviews System
 *
 * Implements:
 *  1. DATABASE: Cloudflare KV (REVIEWS_DB)
 *     Review properties: { id, clientName, reviewText, moderation_status: 'pending', visibility: 'hidden', timestamp }
 *  2. ROUTE A: POST /api/submit-review (From Website)
 *     - Saves review to KV
 *     - Sends Discord embed with 4 buttons: [✅ Accept] [❌ Decline] [👁️ Show] [🙈 Hide]
 *     - custom_id includes review ID (accept_{id}, decline_{id}, show_{id}, hide_{id})
 *  3. ROUTE B: POST /discord/interactions (Button Clicks)
 *     - Verifies Ed25519 signature
 *     - Updates KV (moderation_status or visibility)
 *     - Returns Type 7 (UPDATE_MESSAGE) immediately (< 50ms) to eliminate timeout error
 *  4. ROUTE C: GET /api/reviews (For Website Display)
 *     - Fetches from KV
 *     - Returns ONLY reviews where moderation_status === 'accepted' AND visibility === 'show'
 */

import nacl from "tweetnacl";

// =============================================================================
// CONFIGURATION & ENVIRONMENT BINDINGS (ZERO HARDCODED SECRETS)
// All secrets (BOT_TOKEN, CF_API_TOKEN, webhooks) are resolved from env bindings
// =============================================================================
export const CONFIG = {
  ACCOUNT_ID: "c71a151e01e6c71669dd8e3fce7d5598",
  KV_NAMESPACE_ID: "26a1650d57c04ae1a5970f81909acdba",
  REVIEW_CHANNEL_ID: "1557820513982742580"
};

const ALLOWED_ORIGINS = [
  "https://whizstudio.art",
  "https://www.whizstudio.art",
  "https://portal.whizstudio.art",
  "https://admin.whizstudio.art"
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".whizstudio.pages.dev") || origin.startsWith("http://localhost:");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://whizstudio.art",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(data, status = 200, extraHeaders = {}, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

// =============================================================================
// SIGNATURE VERIFICATION (Native Web Crypto API + tweetnacl fallback)
// =============================================================================
function hexToUint8Array(hex) {
  const clean = hex.trim();
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return arr;
}

async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    const verified = await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToUint8Array(signature),
      encoder.encode(timestamp + rawBody)
    );
    if (verified) return true;
  } catch (err) {}

  try {
    const encoder = new TextEncoder();
    return nacl.sign.detached.verify(
      encoder.encode(timestamp + rawBody),
      hexToUint8Array(signature),
      hexToUint8Array(publicKey)
    );
  } catch (err) {
    console.error("tweetnacl verification error:", err);
    return false;
  }
}

// =============================================================================
// KV HELPERS (Native binding with Cloudflare REST API fallback)
// =============================================================================
async function kvPut(env, key, value) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.put === "function") {
    return await env.REVIEWS_DB.put(key, value);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: value
  });
  return res.ok;
}

async function kvGet(env, key) {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.get === "function") {
    return await env.REVIEWS_DB.get(key);
  }

  const cfToken = env?.CF_API_TOKEN;
  if (!cfToken) return null;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/values/${key}`, {
    headers: { "Authorization": `Bearer ${cfToken}` }
  });
  if (res.status === 200) {
    return await res.text();
  }
  return null;
}

async function kvList(env, prefix = "review_") {
  if (env && env.REVIEWS_DB && typeof env.REVIEWS_DB.list === "function") {
    const res = await env.REVIEWS_DB.list({ prefix });
    return res.keys || [];
  }

  const cfToken = env?.CF_API_TOKEN;
  if (!cfToken) return [];
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONFIG.ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.KV_NAMESPACE_ID}/keys?prefix=${prefix}`, {
    headers: { "Authorization": `Bearer ${cfToken}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.result || [];
  }
  return [];
}

// =============================================================================
// WORKER EVENT HANDLER
// =============================================================================

// =============================================================================
// HARD-INJECT WebSite SCHEMA & FAVICON VIA CLOUDFLARE HTMLRewriter
// =============================================================================
const HOMEPAGE_HEAD_INJECTION = `<meta name="application-name" content="Whiz Studio">
<meta property="og:site_name" content="Whiz Studio">
<link rel="canonical" href="https://whizstudio.art/">
<link rel="icon" type="image/png" sizes="192x192" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<link rel="shortcut icon" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<link rel="apple-touch-icon" href="https://whizstudio.art/whiz-icon-v5.png?v=20261116">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://whizstudio.art/#website",
      "name": "Whiz Studio",
      "alternateName": ["WhizStudio", "Whiz Studio Digital Marketing Agency"],
      "url": "https://whizstudio.art/",
      "datePublished": "2026-11-16",
      "dateModified": "2026-11-16"
    },
    {
      "@type": "Organization",
      "@id": "https://whizstudio.art/#organization",
      "name": "Whiz Studio",
      "url": "https://whizstudio.art/",
      "logo": "https://whizstudio.art/whiz-icon-v5.png?v=20261116",
      "datePublished": "2026-11-16",
      "dateModified": "2026-11-16"
    }
  ]
}
</script>`;

function transformHomepageHtml(response) {
  if (!response) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.prepend(`\n${HOMEPAGE_HEAD_INJECTION}\n`, { html: true });
      }
    })
    .on('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]', {
      element(el) {
        const href = el.getAttribute("href") || "";
        if (!href.includes("whiz-icon-v5.png")) {
          el.remove();
        }
      }
    })
    .on('link[rel="canonical"]', {
      element(el) {
        // Strip duplicate static canonical tags downstream
        el.remove();
      }
    })
    .on('meta[name="application-name"], meta[property="og:site_name"]', {
      element(el) {
        // Strip duplicate static meta tags downstream so the top prepended one is sole source of truth
        el.remove();
      }
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:secure_url"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[property="og:image:type"]', {
      element(el) { el.setAttribute("content", "image/jpeg"); }
    })
    .on('meta[property="og:image:width"]', {
      element(el) { el.setAttribute("content", "1200"); }
    })
    .on('meta[property="og:image:height"]', {
      element(el) { el.setAttribute("content", "630"); }
    })
    .on('meta[property="og:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[name="twitter:image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .on('meta[name="twitter:image:alt"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_ALT); }
    })
    .on('meta[itemprop="image"]', {
      element(el) { el.setAttribute("content", UNIVERSAL_SHARE_CARD_URL); }
    })
    .transform(response);
}

// -----------------------------------------------------------------------------
// IN-MEMORY HIGH-SPEED ICON DELIVERY (192x192 White Square Icon)
// -----------------------------------------------------------------------------
const WHIZ_ICON_V4_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAADAFBMVEX////buj/WqSzYsDT//v7buT7bu0LZsTX///7UoincvEPbu0DUoSjZszjewUn9/v3Voyrdv0jbuD7btTrbvUTdw0zYsjfXqi3//vzfwkrYrzPWqC3YsTbexE38+/XVpCv59Ofu36fcu0nZrDH69+zYrzTauD3dqyzXpi3XqzDVqC/ToSnw4bbdwEn9/PnlyYD59eTcvkTWpCrw4K7dwkvVpSnmvj379/TVpizgvUDoyEfmwUD0687atzzcuU3etzrjsS/YsjjluTX8+vL//f3ozVDetTbgqSrdwE7q2Zb8/f3rykcCbV7ewUrcvkrz6cHXrTLev0TmxUXZpSnbu0PatkLhx2XTnyjYrUPZrUHewlLeszToyk3dw0vbuETUoivoxEEBcmLiry7kz3Xu4K3jw2vz5sn17dPctEjo0JXatTvmuzb69urktC/hwUbgujzery8BaVvkuzrjyWzhsS/XqTDcqCrky3IEfGbirCv8+vX38N3gvGDhvmX279jz6M2oy8W61dDhxGParTTq15P8+fDaqCzdsD7y48L48uHn1arjxHbnzIvW5eLt3LH3+fjr16Hjxk3RrTZUlo3u2qkusHMUcmTXoifu9fO038ro8O7ozoH06MhnopmEtK3D3NbitjSw0ctfnJTNpS8pgHTasEpHkYbs3J7fw0vq05rlyXo/vnYOkm3v0VDryETl0X3k7OvK39vx5r6hx8E6iX7x9vXYqj7hxlnc8eT068rx4rzkvj7hvU3fuVfzyD/z5rrq04lDxnlzypoffG7ft0oHg2jJnisOimohnm+dwr19r6eLu7De6ehBuHMzpXSY07fVpTT79/Detk7btlXPoSaTu7VPpY5yqKBlx5C75M3F59RDrYPQ5t3btl7rsy3UtT7suS/10Ee73dJLtn/n9+4lj3r1omHwxcbqnaHt3qOs4MJhtpX128X2xKOXy6vUeIjQVmbxuWtypp3t2NmMxJTxybT73d3usLPAlZHQxabPio/aZW/mtrue0r7fszjUqTCdeKKLAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAO+0lEQVR42u2aaVRUV7bHN1DARaAYBCkopLBBQIoqBTGNEl5kUExZIAKKRmwooqJ0QTDMIjJoGBoQlSE4IEKj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";
let cachedIconBytes = null;
function getIconV4Bytes() {
  if (!cachedIconBytes) {
    const binary = atob(WHIZ_ICON_V4_BASE64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    cachedIconBytes = bytes;
  }
  return cachedIconBytes;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

        // 1. FORCE 301 CANONICAL REDIRECT (www -> non-www) AT THE VERY TOP OF _worker.js
    if (url.hostname === "www.whizstudio.art") {
      return Response.redirect(`https://whizstudio.art${url.pathname}${url.search}`, 301);
    }

    // Strict HTTPS Enforcement (301 Permanent Redirect)
    const proto = request.headers.get("x-forwarded-proto") || (url.protocol ? url.protocol.replace(":", "") : "https");
    if (proto === "http" || url.protocol === "http:") {
      return Response.redirect(`https://whizstudio.art${url.pathname}${url.search}`, 301);
    }

    // 3. Favicon & Direct Icon Delivery (HTTP 200, Zero Redirects, 24-Hour Cache)
    if (path === "/favicon.ico" || path === "/whiz-icon-v5.png" || path === "/whiz-icon-v4.png" || path === "/icon-whiz-2026.png" || path === "/whiz-favicon-2026.png") {
      const contentType = path === "/favicon.ico" ? "image/x-icon" : "image/png";
      return new Response(getIconV4Bytes(), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    // -------------------------------------------------------------------------
    // 2. IMMEDIATE SEO DIRECTORY DELIVERY (/sitemap.xml & /robots.txt)
    // Completely bypasses HTMLRewriter, SPA router, and KV middleware
    // -------------------------------------------------------------------------
    if (path === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const today = new Date().toISOString().split("T")[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://whizstudio.art/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/about/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/about/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/social-media-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/social-media-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/linkedin-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/linkedin-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/organic-reach-reality/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/organic-reach-reality/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/smo-ad-efficiency/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/smo-ad-efficiency/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/linkedin-executive-presence/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/linkedin-executive-presence/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/creative-fatigue-mitigation/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/creative-fatigue-mitigation/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/bn/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/privacy/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://whizstudio.art/terms/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
      return new Response(request.method === "HEAD" ? null : sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (path === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const robots = "User-agent: *\nAllow: /\nSitemap: https://whizstudio.art/sitemap.xml\n";
      return new Response(request.method === "HEAD" ? null : robots, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    // -------------------------------------------------------------------------
    // 2. IMMEDIATE SEO DIRECTORY DELIVERY (/sitemap.xml & /robots.txt)
    // Completely bypasses HTMLRewriter, SPA router, and KV middleware
    // -------------------------------------------------------------------------
    if (path === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
      const today = new Date().toISOString().split("T")[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://whizstudio.art/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/about/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/about/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-marketing/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-marketing/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/facebook-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/facebook-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/instagram-ads/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/instagram-ads/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/social-media-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/social-media-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/services/linkedin-optimization/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/services/linkedin-optimization/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/organic-reach-reality/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/organic-reach-reality/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/smo-ad-efficiency/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/smo-ad-efficiency/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/linkedin-executive-presence/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/linkedin-executive-presence/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/articles/creative-fatigue-mitigation/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/articles/creative-fatigue-mitigation/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/bn/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://whizstudio.art/"/>
    <xhtml:link rel="alternate" hreflang="bn" href="https://whizstudio.art/bn/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://whizstudio.art/"/>
  </url>
  <url>
    <loc>https://whizstudio.art/privacy/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://whizstudio.art/terms/</loc>
    <lastmod>2026-11-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
      return new Response(request.method === "HEAD" ? null : sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (path === "/robots.txt" && (request.method === "GET" || request.method === "HEAD")) {
      const robots = "User-agent: *\nAllow: /\nSitemap: https://whizstudio.art/sitemap.xml\n";
      return new Response(request.method === "HEAD" ? null : robots, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    // Admin Workspace Redirection
    if (path === "/admin" || path === "/admin/") {
      return Response.redirect(`${url.origin}/admin/dashboard`, 302);
    }

    // SEO-Friendly Navigation Routes & Deep Linking (Dedicated pages /about and /articles bypass SPA rewriting)
    const SEO_SPA_ROUTES = [
      "/services",
      "/pricing",
      "/reviews",
      "/testimonials",
      "/faq",
      "/contact",
      "/login",
      "/register"
    ];
    const cleanRoutePath = path.replace(/\/+$/, '') || '/';
    if (SEO_SPA_ROUTES.includes(cleanRoutePath)) {
      if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
        const indexRequest = new Request(new URL("/", request.url), request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const botToken = env?.BOT_TOKEN || "";
    const channelId = env?.REVIEW_CHANNEL_ID || CONFIG.REVIEW_CHANNEL_ID;
    const publicKey = env?.DISCORD_PUBLIC_KEY || "";
    const reviewWebhook = env?.REVIEW_WEBHOOK_URL || "";
    const contactWebhook = env?.CONTACT_WEBHOOK_URL || "";

    // -------------------------------------------------------------------------
    // ROUTE A: POST /api/submit-review (From Website)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-review" || path === "/api/review") && request.method === "POST") {
      try {
        const body = await request.json();
        const clientName = body.clientName || body.name || "Anonymous Client";
        const reviewText = body.reviewText || body.text || body.review || body.feedback || "";
        const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

        if (!reviewText || !reviewText.trim()) {
          return jsonResponse({ success: false, error: "Review text is required." }, 400);
        }

        const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = new Date().toISOString();

        // 1. Save review to Cloudflare KV (REVIEWS_DB)
        const reviewData = {
          id,
          clientName,
          reviewText,
          rating,
          moderation_status: "pending",
          visibility: "hidden",
          timestamp
        };

        await kvPut(env, `review_${id}`, JSON.stringify(reviewData));

        // 2. Build Discord embed with 4 action buttons: [✅ Accept] [❌ Decline] [👁️ Show] [🙈 Hide]
        const starString = "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} / 5 Stars)`;

        const discordPayload = {
          content: "⭐ **NEW CLIENT TESTIMONIAL AWAITING MODERATION**",
          embeds: [
            {
              title: "⭐ Client Review Submission  -  Whiz Studio",
              description: "A new client review has been submitted and is awaiting team moderation.\n\n### 🛡️ Moderation Actions:\nUse the action buttons below to accept, decline, or toggle website display.",
              color: 0xF59E0B,
              fields: [
                { name: "👤 Client / Company", value: String(clientName), inline: true },
                { name: "⭐ Rating Given", value: starString, inline: true },
                { name: "💬 Review Feedback", value: String(reviewText), inline: false },
                { name: "🆔 Review Reference ID", value: id, inline: true },
                { name: "⚙️ Live Status", value: "Status: ⏳ Pending | Visibility: 🙈 Hidden", inline: true },
                { name: "⏰ Submission Timestamp", value: new Date(timestamp).toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Review Control Panel • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 3, // Success
                  label: "✅ Accept",
                  custom_id: `accept_${id}`
                },
                {
                  type: 2,
                  style: 4, // Danger
                  label: "❌ Decline",
                  custom_id: `decline_${id}`
                },
                {
                  type: 2,
                  style: 1, // Primary
                  label: "👁️ Show",
                  custom_id: `show_${id}`
                },
                {
                  type: 2,
                  style: 2, // Secondary
                  label: "🙈 Hide",
                  custom_id: `hide_${id}`
                }
              ]
            }
          ]
        };

        let discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          discordRes = await fetch(reviewWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload)
          });
        }

        return jsonResponse({
          success: true,
          id,
          message: "Review successfully saved to KV and dispatched to Discord moderation queue."
        }, 200);

      } catch (err) {
        console.error("Route A Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // ROUTE B: POST /discord/interactions (Button Clicks)
    // -------------------------------------------------------------------------
    if ((path === "/discord/interactions" || path === "/api/interactions" || path === "/interactions") && request.method === "POST") {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-signature-ed25519") || request.headers.get("X-Signature-Ed25519");
        const timestamp = request.headers.get("x-signature-timestamp") || request.headers.get("X-Signature-Timestamp");

        if (!signature || !timestamp) {
          return new Response("Missing signature headers", { status: 401 });
        }

        const isValid = await verifyDiscordSignature(rawBody, signature, timestamp, publicKey);
        if (!isValid) {
          return new Response("Invalid request signature", { status: 401 });
        }

        let interaction;
        try {
          interaction = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (interaction.type === 1) {
          return jsonResponse({ type: 1 });
        }

        if (interaction.type === 3) {
          const customId = interaction.data?.custom_id || "";
          const member = interaction.member || interaction.user;
          const moderatorName = member?.user?.username || member?.username || "Moderator";

          let action = "";
          let id = "";

          if (customId.startsWith("accept_")) {
            action = "accept";
            id = customId.replace("accept_", "");
          } else if (customId.startsWith("decline_")) {
            action = "decline";
            id = customId.replace("decline_", "");
          } else if (customId.startsWith("show_")) {
            action = "show";
            id = customId.replace("show_", "");
          } else if (customId.startsWith("hide_")) {
            action = "hide";
            id = customId.replace("hide_", "");
          }

          if (!id || !action) {
            return jsonResponse({ type: 6 });
          }

          let review = null;
          const existingRaw = await kvGet(env, `review_${id}`);
          if (existingRaw) {
            try {
              review = JSON.parse(existingRaw);
            } catch (e) {}
          }

          if (!review) {
            const originalEmbed = interaction.message?.embeds?.[0] || {};
            const fields = originalEmbed.fields || [];
            let name = "Verified Client";
            let text = "";
            let rating = 5;

            for (const f of fields) {
              const fn = (f.name || "").toLowerCase();
              if (fn.includes("client") || fn.includes("company") || fn.includes("name")) name = f.value;
              else if (fn.includes("feedback") || fn.includes("review") || fn.includes("text")) text = f.value;
              else if (fn.includes("rating") || fn.includes("star")) {
                const s = (f.value.match(/★/g) || []).length;
                if (s > 0) rating = s;
              }
            }

            review = {
              id,
              clientName: name,
              reviewText: text,
              rating,
              moderation_status: "pending",
              visibility: "hidden",
              timestamp: new Date().toISOString()
            };
          }

          if (action === "accept") {
            review.moderation_status = "accepted";
          } else if (action === "decline") {
            review.moderation_status = "declined";
          } else if (action === "show") {
            review.visibility = "show";
          } else if (action === "hide") {
            review.visibility = "hidden";
          }

          review.updated_at = new Date().toISOString();

          await kvPut(env, `review_${id}`, JSON.stringify(review));

          const modStatus = review.moderation_status;
          const visStatus = review.visibility;

          const statusBadge = modStatus === "accepted" ? "✅ Accepted" : (modStatus === "declined" ? "❌ Declined" : "⏳ Pending");
          const visBadge = visStatus === "show" ? "👁️ Showing" : "🙈 Hidden";
          const liveStatusStr = `Status: ${statusBadge} | Visibility: ${visBadge}`;

          let embedColor = 0xF59E0B;
          if (modStatus === "accepted" && visStatus === "show") {
            embedColor = 0x00A86B;
          } else if (modStatus === "accepted") {
            embedColor = 0x3B82F6;
          } else if (modStatus === "declined") {
            embedColor = 0xEF4444;
          }

          let statusDetail = "";
          if (modStatus === "accepted" && visStatus === "show") {
            statusDetail = "🟢 **Live on Website:** This review is currently visible on https://whizstudio.art/#reviews";
          } else if (modStatus === "accepted" && visStatus === "hidden") {
            statusDetail = "🟡 **Accepted (Hidden):** Review is approved, but currently hidden from website display.";
          } else if (modStatus === "declined") {
            statusDetail = "🔴 **Declined:** Review was declined and is suppressed from the website.";
          } else {
            statusDetail = "⏳ **Pending:** Awaiting administrator authorization.";
          }

          const starString = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5)) + ` (${review.rating || 5} / 5 Stars)`;

          const updatedEmbed = {
            title: "⭐ Client Review Control Panel  -  Whiz Studio",
            description: `Permanent moderation control panel for Whiz Studio.\n\n${statusDetail}\n👤 **Last Updated By:** **@${moderatorName}**`,
            color: embedColor,
            fields: [
              { name: "👤 Client / Company", value: String(review.clientName || "Client"), inline: true },
              { name: "⭐ Rating Given", value: starString, inline: true },
              { name: "💬 Review Feedback", value: String(review.reviewText || "No review feedback"), inline: false },
              { name: "🆔 Review Reference ID", value: String(id), inline: true },
              { name: "⚙️ Live Status", value: liveStatusStr, inline: true },
              { name: "⏰ Last Updated", value: new Date().toUTCString(), inline: false }
            ],
            footer: { text: "Whiz Studio Review Control Panel • whizstudio.art" }
          };

          const components = [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 3,
                  label: "✅ Accept",
                  custom_id: `accept_${id}`
                },
                {
                  type: 2,
                  style: 4,
                  label: "❌ Decline",
                  custom_id: `decline_${id}`
                },
                {
                  type: 2,
                  style: 1,
                  label: "👁️ Show",
                  custom_id: `show_${id}`
                },
                {
                  type: 2,
                  style: 2,
                  label: "🙈 Hide",
                  custom_id: `hide_${id}`
                }
              ]
            }
          ];

          return jsonResponse({
            type: 7,
            data: {
              content: `🛡️ Review Control Panel • ${liveStatusStr}`,
              embeds: [updatedEmbed],
              components: components
            }
          });
        }

        return jsonResponse({ type: 1 });
      } catch (err) {
        console.error("Route B Error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // -------------------------------------------------------------------------
    // ROUTE C: GET /api/reviews (For Website Display)
    // -------------------------------------------------------------------------
    if (path === "/api/reviews" && request.method === "GET") {
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

        return jsonResponse({
          success: true,
          count: filteredReviews.length,
          reviews: filteredReviews
        }, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        });

      } catch (err) {
        console.error("Route C Error:", err);
        return jsonResponse({ success: false, reviews: [], error: err.message }, 500);
      }
    }


    // -------------------------------------------------------------------------
    // Contact Gateway (/api/submit-contact & /api/contact)
    // -------------------------------------------------------------------------
    if ((path === "/api/submit-contact" || path === "/api/contact") && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, email, phone, service, details } = body;

        if (!name || !email || !details) {
          return jsonResponse({ success: false, error: "Validation error: Name, email, and project scope are required." }, 400);
        }

        const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/8801815127022";

        const discordPayload = {
          content: "🚨 **NEW INBOUND CLIENT INQUIRY FROM WHIZSTUDIO.ART**",
          embeds: [
            {
              title: "📬 Strategic Growth Inquiry  -  Whiz Studio",
              description: "A new prospective business client has submitted their requirements via the official contact form.",
              color: 0x00A86B,
              fields: [
                { name: "👤 Client / Company", value: String(name), inline: true },
                { name: "📱 WhatsApp / Phone", value: String(phone || "Not provided"), inline: true },
                { name: "📧 Email Address", value: String(email), inline: true },
                { name: "🎯 Selected Service", value: String(service || "General Inquiry"), inline: true },
                { name: "📝 Project Scope & Details", value: String(details), inline: false },
                { name: "⏰ Submission Timestamp", value: new Date().toUTCString(), inline: false }
              ],
              footer: { text: "Whiz Studio Contact Gateway • whizstudio.art" }
            }
          ],
          components: [
            {
              type: 1,
              components: [
                { type: 2, style: 5, label: "💬 WhatsApp Direct Chat", url: waUrl },
                { type: 2, style: 5, label: "🌐 Open Whiz Studio", url: "https://whizstudio.art" }
              ]
            }
          ]
        };

        const discordRes = await fetch(contactWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          return jsonResponse({ success: false, error: `Discord webhook transmission failed with status ${discordRes.status}` }, 502);
        }

        return jsonResponse({ success: true, message: "Contact inquiry transmitted successfully." }, 200);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // -------------------------------------------------------------------------
    // SEO sitemap and robots routes moved to top of fetch handler
    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetRes = await env.ASSETS.fetch(request);
      if (path === "/" || path === "/index.html" || path === "") {
        return transformHomepageHtml(assetRes);
      }
      return enforceUniversalShareCard(assetRes);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  }
};
