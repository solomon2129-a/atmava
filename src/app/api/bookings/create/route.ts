/**
 * POST /api/bookings/create
 *
 * Creates a 1:1 booking with a generated Meet link and sends confirmation emails.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *   Content-Type: application/json
 *
 * Body:
 *   { mentorId: string, date: string, time: string, notes?: string }
 *
 * Returns the created booking document (with meetLink).
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendBookingConfirmationEmails } from "@/lib/email";

function generateMeetLink(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) =>
    Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization header." }, { status: 401 });
  }
  const idToken = authHeader.slice(7);

  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Server not configured — check Firebase Admin env vars." },
      { status: 500 }
    );
  }

  let uid: string;
  let userEmail: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
    userEmail = decoded.email ?? "";
  } catch (err) {
    console.error("[bookings/create] Token verification failed:", err);
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: { mentorId?: string; date?: string; time?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { mentorId, date, time, notes } = body;
  if (!mentorId || !date || !time) {
    return NextResponse.json(
      { error: "Missing required fields: mentorId, date, time." },
      { status: 400 }
    );
  }

  const db = adminDb;

  // ── 3. Load student profile ──────────────────────────────────────────────
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }
  const studentProfile = userSnap.data()!;
  const studentName: string = studentProfile.name ?? "Student";

  // ── 4. Load mentor profile ───────────────────────────────────────────────
  const mentorSnap = await db.collection("users").doc(mentorId).get();
  if (!mentorSnap.exists) {
    return NextResponse.json({ error: "Mentor not found." }, { status: 404 });
  }
  const mentorProfile = mentorSnap.data()!;
  const mentorName: string = mentorProfile.name ?? "Mentor";
  const mentorEmail: string = mentorProfile.email ?? "";

  // ── 5. Generate Meet link ────────────────────────────────────────────────
  const meetLink = generateMeetLink();

  // ── 6. Persist booking to Firestore ─────────────────────────────────────
  const now = new Date().toISOString();
  const bookingData = {
    userId:          uid,
    userName:        studentName,
    userEmail,
    mentorId,
    mentorName,
    programId:       studentProfile.programId ?? "30",
    date,
    time,
    meetLink,
    status:          "confirmed",
    notes:           notes ?? "",
    createdAt:       now,
    reminderSent24h: false,
    reminderSent1h:  false,
  };

  const docRef = await db.collection("bookings").add(bookingData);

  // ── 7. Send confirmation emails ──────────────────────────────────────────
  if (meetLink && process.env.SMTP_HOST) {
    sendBookingConfirmationEmails({
      studentEmail: userEmail,
      studentName,
      mentorEmail,
      mentorName,
      date,
      time,
      meetLink,
      notes,
    }).catch(err =>
      console.error("[bookings/create] Email delivery failed (non-fatal):", err)
    );
  }

  // ── 8. Return the created booking ────────────────────────────────────────
  return NextResponse.json({
    id: docRef.id,
    ...bookingData,
  });
}
