/**
 * Razorpay service utility — server-side only.
 * Never import this in client components.
 *
 * Environment variables required in .env.local:
 *   RAZORPAY_MODE=test            # or "live" — the ONLY change needed to switch environments
 *   RAZORPAY_TEST_KEY_ID=...
 *   RAZORPAY_TEST_KEY_SECRET=...
 *   RAZORPAY_LIVE_KEY_ID=...
 *   RAZORPAY_LIVE_KEY_SECRET=...
 *
 * To switch from TEST → LIVE:  change RAZORPAY_MODE=live  (no code changes needed)
 */
import Razorpay from "razorpay";

export type RazorpayMode = "test" | "live";

/** Returns the active Razorpay mode based on RAZORPAY_MODE env var. */
export function getRazorpayMode(): RazorpayMode {
  return process.env.RAZORPAY_MODE === "live" ? "live" : "test";
}

/** Returns the active key pair (id + secret) based on mode. */
function getActiveKeys(): { key_id: string; key_secret: string } {
  if (getRazorpayMode() === "live") {
    const key_id     = process.env.RAZORPAY_LIVE_KEY_ID     ?? "";
    const key_secret = process.env.RAZORPAY_LIVE_KEY_SECRET ?? "";
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET are required when RAZORPAY_MODE=live");
    }
    return { key_id, key_secret };
  }

  const key_id     = process.env.RAZORPAY_TEST_KEY_ID     ?? "";
  const key_secret = process.env.RAZORPAY_TEST_KEY_SECRET ?? "";
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET are required when RAZORPAY_MODE=test");
  }
  return { key_id, key_secret };
}

/** Returns the public key ID (safe to send to the frontend for Razorpay checkout). */
export function getRazorpayKeyId(): string {
  return getActiveKeys().key_id;
}

/** Returns the secret key (never expose to client). */
export function getRazorpayKeySecret(): string {
  return getActiveKeys().key_secret;
}

/** Returns a fully configured Razorpay instance. */
export function getRazorpayInstance(): Razorpay {
  const { key_id, key_secret } = getActiveKeys();
  return new Razorpay({ key_id, key_secret });
}

/**
 * Generates a unique receipt ID for a Razorpay order.
 * Format: rcpt_<8 chars of userId>_<programId>_<timestamp>
 * Max length: 40 chars (Razorpay limit).
 */
export function generateReceiptId(userId: string, programId: string): string {
  const uid  = userId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  const ts   = Date.now().toString(36); // base-36 timestamp — compact
  return `rcpt_${uid}_${programId}_${ts}`;
}
