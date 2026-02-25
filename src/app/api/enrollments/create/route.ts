/**
 * POST /api/enrollments/create
 *
 * Creates an enrollment for a user (admin-granted access, no payment required).
 * This endpoint is used by the admin panel "Grant Access" feature.
 * For payment-based enrollment, see /api/payments/verify.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>  (must be admin role)
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     userId:       string,   // target user
 *     programId:    string,   // "30" | "60" | "90"
 *     durationDays?: number,  // override duration (defaults to programId value)
 *     startDate?:   string,   // YYYY-MM-DD (defaults to today)
 *   }
 *
 * Response:
 *   { success: true, enrollmentId: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, adminDb } from "@/lib/firebaseAdmin";

const PROGRAM_TITLE_MAP: Record<string, string> = {
  "30": "30 Days — Foundation",
  "60": "60 Days — Deepening",
  "90": "90 Days — Inner Mastery",
};

export async function POST(req: NextRequest) {
  // ── 1. Authenticate calling user ─────────────────────────────────────────
  const callerUid = await verifyFirebaseToken(req);
  if (!callerUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const db = adminDb;

  // ── 2. Verify caller is admin ─────────────────────────────────────────────
  const callerSnap = await db.collection("users").doc(callerUid).get();
  if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin role required." }, { status: 403 });
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  let body: {
    userId?:       string;
    programId?:    string;
    durationDays?: number;
    startDate?:    string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { userId, programId, durationDays, startDate } = body;

  if (!userId || !programId) {
    return NextResponse.json({ error: "Missing required fields: userId, programId." }, { status: 400 });
  }

  // ── 4. Verify target user exists ──────────────────────────────────────────
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  // ── 5. Check for existing active enrollment ───────────────────────────────
  const nowIso = new Date().toISOString();
  const existingQ = await db
    .collection("enrollments")
    .where("userId", "==", userId)
    .where("programId", "==", programId)
    .where("status", "==", "active")
    .where("endDate", ">", nowIso)
    .limit(1)
    .get();

  if (!existingQ.empty) {
    return NextResponse.json(
      { error: "User already has an active enrollment for this program." },
      { status: 409 }
    );
  }

  // ── 6. Compute dates ──────────────────────────────────────────────────────
  const duration = durationDays ?? Number(programId) ?? 30;
  const start = startDate ?? new Date().toISOString().split("T")[0];
  const startDateObj = new Date(start + "T00:00:00Z");
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + duration);
  const endDate = endDateObj.toISOString().split("T")[0];

  // ── 7. Create enrollment ──────────────────────────────────────────────────
  const enrollmentRef = await db.collection("enrollments").add({
    userId,
    programId,
    paymentId:      null,
    status:         "active",
    startDate:      start,
    endDate,
    createdAt:      new Date().toISOString(),
    grantedByAdmin: true,
  });

  // ── 8. Update user's programId ────────────────────────────────────────────
  await db.collection("users").doc(userId).update({
    programId,
    programTitle:     PROGRAM_TITLE_MAP[programId] ?? programId,
    programStartDate: start,
  });

  return NextResponse.json({ success: true, enrollmentId: enrollmentRef.id });
}
