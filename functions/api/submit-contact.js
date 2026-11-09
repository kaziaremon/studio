/**
 * Cloudflare Pages Function: /api/submit-contact
 * Re-exports contact handler for legacy compatibility.
 */

export { onRequestOptions, onRequestPost } from "./contact.js";
