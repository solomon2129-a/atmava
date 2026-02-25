/**
 * Firebase Admin SDK — server-side only.
 * Never import this in client components or pages.
 *
 * Supports two naming conventions for environment variables:
 *   Short:  FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 *   Legacy: FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
 *
 * Both are equivalent — the short form takes priority.
 */
import admin from "firebase-admin";

const projectId   = process.env.FIREBASE_PROJECT_ID   || process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawKey      = process.env.FIREBASE_PRIVATE_KEY  || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const privateKey  = rawKey?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebase-admin] Missing env vars — API routes requiring Admin SDK will fail.\n" +
      "  Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local"
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      console.error("[firebase-admin] initializeApp failed:", err);
    }
  }
}

export const adminDb   = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth()      : null;
