/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for a program purchase.
 * Price is resolved server-side from PROGRAM_PRICES — never trusted from the client.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *   Content-Type: application/json
 *
 * Body:
 *   { programId: "30" | "60" | "90" }
 *
 * Response:
 *   { orderId, keyId, amount, currency, mode }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, adminDb } from "@/lib/firebaseAdmin";
import { getRazorpayInstance, getRazorpayKeyId, getRazorpayMode, generateReceiptId } from "@/lib/razorpay";

/**
 * Server-side price table in INR. Price is NEVER trusted from the client.
 * Update here when pricing changes.
 */
const PROGRAM_PRICES: Record<string, number> = {
  "30": 149,
  "60": 279,
  "90": 449,
};

export async function POST(req: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const uid = await verifyFirebaseToken(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }
  const db = adminDb; // narrowed — safe inside async callbacks

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { programId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { programId } = body;
  if (!programId) {
    return NextResponse.json({ error: "Missing programId." }, { status: 400 });
  }

  // ── 3. Validate program and resolve price server-side ─────────────────────
  const priceINR = PROGRAM_PRICES[programId];
  if (!priceINR) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }
  const amountPaise = priceINR * 100; // Razorpay uses smallest currency unit

  // ── 4. Prevent duplicate active enrollments ──────────────────────────────
  const legacyEnrollSnap = await db.collection("enrollments")
    .where("userId", "==", uid)
    .where("programId", "==", programId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!legacyEnrollSnap.empty) {
    return NextResponse.json(
      { error: "You already have an active enrollment for this program." },
      { status: 409 }
    );
  }

  // ── 5. Create Razorpay order ──────────────────────────────────────────────
  let razorpayOrder: { id: string };
  try {
    const razorpay = getRazorpayInstance();
    razorpayOrder = await razorpay.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  generateReceiptId(uid, programId),
    }) as { id: string };
  } catch (err) {
    console.error("[create-order] Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 }
    );
  }

  // ── 6. Store payment document (status: "created") ─────────────────────────
  const mode = getRazorpayMode();
  await db.collection("payments").add({
    userId:            uid,
    programId,
    razorpayOrderId:   razorpayOrder.id,
    razorpayPaymentId: null,
    amount:            amountPaise,
    status:            "created",
    mode,
    createdAt:         new Date().toISOString(),
  });

  // ── 7. Return order details to frontend ───────────────────────────────────
  return NextResponse.json({
    orderId:  razorpayOrder.id,
    keyId:    getRazorpayKeyId(),         // public — safe for frontend
    amount:   amountPaise,
    currency: "INR",
    mode,
  });
}
