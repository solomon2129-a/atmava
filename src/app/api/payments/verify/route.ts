/**
 * POST /api/payments/verify
 *
 * Verifies a Razorpay payment signature, marks the payment as "paid",
 * and directly creates an enrollment — redirecting to /dashboard.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     razorpay_order_id:   string,
 *     razorpay_payment_id: string,
 *     razorpay_signature:  string,
 *     programId:           string,
 *   }
 *
 * Response:
 *   { success: true, paymentId, programId, redirectTo: "/dashboard" }
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { verifyFirebaseToken, adminDb } from "@/lib/firebaseAdmin";
import { getRazorpayKeySecret, getRazorpayMode } from "@/lib/razorpay";

const PROGRAM_TITLE_MAP: Record<string, string> = {
  "30": "30 Days — Foundation",
  "60": "60 Days — Deepening",
  "90": "90 Days — Inner Mastery",
};

const PROGRAM_DURATION_MAP: Record<string, number> = {
  "30": 30,
  "60": 60,
  "90": 90,
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

  const db = adminDb;

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: {
    razorpay_order_id?:   string;
    razorpay_payment_id?: string;
    razorpay_signature?:  string;
    programId?:           string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    programId,
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !programId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // ── 3. Verify Razorpay signature (HMAC-SHA256) ────────────────────────────
  let keySecret: string;
  try { keySecret = getRazorpayKeySecret(); }
  catch (err) {
    console.error("[verify] Cannot get Razorpay secret:", err);
    return NextResponse.json({ error: "Payment configuration error." }, { status: 500 });
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn(`[verify] Signature mismatch for order ${razorpay_order_id} uid=${uid}`);
    return NextResponse.json({ error: "Payment verification failed — invalid signature." }, { status: 400 });
  }

  // ── 4. Find payment document by orderId and userId (replay protection) ────
  const paymentQuery = await db
    .collection("payments")
    .where("razorpayOrderId", "==", razorpay_order_id)
    .where("userId", "==", uid)
    .limit(1)
    .get();

  if (paymentQuery.empty) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  const paymentDoc  = paymentQuery.docs[0];
  const paymentData = paymentDoc.data();

  // ── 5. Handle already-processed payment (prevent replay) ─────────────────
  if (paymentData.status === "paid") {
    // Check if enrollment was already created for this payment
    const existingEnroll = await db
      .collection("enrollments")
      .where("paymentId", "==", paymentDoc.id)
      .limit(1)
      .get();

    if (existingEnroll.empty) {
      // Re-create enrollment in case it failed previously
      await createEnrollment(db, uid, programId, paymentDoc.id);
    }

    return NextResponse.json({
      success:    true,
      paymentId:  paymentDoc.id,
      programId,
      redirectTo: "/dashboard",
      mode:       getRazorpayMode(),
    });
  }

  // ── 6. Mark payment as paid ───────────────────────────────────────────────
  await paymentDoc.ref.update({
    razorpayPaymentId: razorpay_payment_id,
    status: "paid",
  });

  // ── 7. Create enrollment ──────────────────────────────────────────────────
  await createEnrollment(db, uid, programId, paymentDoc.id);

  // ── 8. Return redirect to dashboard ──────────────────────────────────────
  return NextResponse.json({
    success:    true,
    paymentId:  paymentDoc.id,
    programId,
    redirectTo: "/dashboard",
    mode:       getRazorpayMode(),
  });
}

async function createEnrollment(
  db: FirebaseFirestore.Firestore,
  uid: string,
  programId: string,
  paymentDocId: string
): Promise<void> {
  const durationDays = PROGRAM_DURATION_MAP[programId] ?? Number(programId) ?? 30;
  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDateObj = new Date(now);
  endDateObj.setDate(endDateObj.getDate() + durationDays);
  const endDate = endDateObj.toISOString().split("T")[0];

  await db.collection("enrollments").add({
    userId:         uid,
    programId,
    paymentId:      paymentDocId,
    status:         "active",
    startDate,
    endDate,
    createdAt:      now.toISOString(),
    grantedByAdmin: false,
  });

  // Update user's programId for quick access
  await db.collection("users").doc(uid).update({
    programId,
    programTitle:     PROGRAM_TITLE_MAP[programId] ?? programId,
    programStartDate: startDate,
  });
}
