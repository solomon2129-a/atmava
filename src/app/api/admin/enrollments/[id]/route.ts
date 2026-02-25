/**
 * PUT /api/admin/enrollments/[id]
 *
 * Admin-only: extend or revoke an enrollment.
 *
 * Body:
 *   { action: "extend" | "revoke", newEndDate?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken, adminDb } from "@/lib/firebaseAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerUid = await verifyFirebaseToken(req);
  if (!callerUid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!adminDb) return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  const db = adminDb;

  // Verify admin
  const callerSnap = await db.collection("users").doc(callerUid).get();
  if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin role required." }, { status: 403 });
  }

  const { id } = await params;

  let body: { action?: string; newEndDate?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { action, newEndDate } = body;

  if (!action || !["extend", "revoke"].includes(action)) {
    return NextResponse.json({ error: "action must be 'extend' or 'revoke'." }, { status: 400 });
  }

  const enrollmentRef = db.collection("enrollments").doc(id);
  const enrollmentSnap = await enrollmentRef.get();

  if (!enrollmentSnap.exists) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  if (action === "revoke") {
    await enrollmentRef.update({ status: "expired" });
  } else if (action === "extend") {
    if (!newEndDate) {
      return NextResponse.json({ error: "newEndDate is required for extend action." }, { status: 400 });
    }
    await enrollmentRef.update({ endDate: newEndDate, status: "active" });
  }

  return NextResponse.json({ success: true });
}
