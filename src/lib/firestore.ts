import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, onSnapshot, serverTimestamp, Timestamp,
  startAfter, QueryDocumentSnapshot, DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, Booking, Message, CheckIn, Program, Resource } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generateMeetLink(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) =>
    Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function levelFromXP(xp: number): string {
  if (xp >= 5000) return "Integrated";
  if (xp >= 2500) return "Embodied";
  if (xp >= 1000) return "Practitioner";
  if (xp >= 300) return "Seeker";
  return "Beginner";
}

function programTitle(id: string | null): string {
  const map: Record<string, string> = {
    "30": "30 Days — Foundation",
    "60": "60 Days — Deepening",
    "90": "90 Days — Inner Mastery",
  };
  return id ? (map[id] ?? id) : "";
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, {
    uid,
    email: data.email ?? "",
    name: data.name ?? "",
    role: data.role ?? "user",
    photoURL: data.photoURL ?? null,
    programId: null,
    programTitle: null,
    programStartDate: null,
    currentDay: 1,
    xp: 0,
    level: "Beginner",
    streakCount: 0,
    lastCheckIn: null,
    badges: [],
    createdAt: new Date().toISOString(),
    mentorId: null,
    mentorName: null,
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, "users", uid), data as DocumentData);
}

export function subscribeUserProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function getAllUsers(pageSize = 20, lastDoc?: QueryDocumentSnapshot): Promise<UserProfile[]> {
  let q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(pageSize));
  if (lastDoc) q = query(q, startAfter(lastDoc));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function getAllMentors(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", "mentor"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function setUserRole(uid: string, role: UserProfile["role"]): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function assignMentorToUser(userId: string, mentorId: string, mentorName: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), { mentorId, mentorName });
}

export async function enrollUserInProgram(
  uid: string,
  programId: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    programId,
    programTitle: programTitle(programId),
    programStartDate: todayStr(),
    currentDay: 1,
    xp: 0,
    level: "Beginner",
    streakCount: 0,
    lastCheckIn: null,
    badges: [],
  });
  // Increment enrolled count
  const pgRef = doc(db, "programs", programId);
  const pgSnap = await getDoc(pgRef);
  if (pgSnap.exists()) {
    const curr = pgSnap.data().enrolledCount ?? 0;
    await updateDoc(pgRef, { enrolledCount: curr + 1 });
  }
}

// ─── Check-Ins (Practice Tracker) ───────────────────────────────────────────

export async function checkInToday(uid: string, userProfile: UserProfile): Promise<{ xpEarned: number; newStreak: number }> {
  const today = todayStr();
  const checkInId = `${uid}_${today}`;
  const existing = await getDoc(doc(db, "checkIns", checkInId));
  if (existing.exists()) return { xpEarned: 0, newStreak: userProfile.streakCount };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const isConsecutive = userProfile.lastCheckIn === yesterdayStr;
  const newStreak = isConsecutive ? userProfile.streakCount + 1 : 1;
  const xpEarned = 10 + (newStreak % 7 === 0 ? 20 : 0); // Bonus on 7-day multiples

  // Determine new badges
  const newBadges = [...(userProfile.badges ?? [])];
  if (newStreak === 7 && !newBadges.includes("7-Day Flame")) newBadges.push("7-Day Flame");
  if (newStreak === 14 && !newBadges.includes("Fortnight Seeker")) newBadges.push("Fortnight Seeker");
  if (newStreak === 30 && !newBadges.includes("30-Day Master")) newBadges.push("30-Day Master");

  const newXP = (userProfile.xp ?? 0) + xpEarned;
  const newCurrentDay = Math.min((userProfile.currentDay ?? 1) + 1, Number(userProfile.programId ?? 30));

  await setDoc(doc(db, "checkIns", checkInId), {
    id: checkInId, uid, date: today, xpEarned, timestamp: Date.now(),
  });

  await updateDoc(doc(db, "users", uid), {
    lastCheckIn: today,
    streakCount: newStreak,
    xp: newXP,
    level: levelFromXP(newXP),
    currentDay: newCurrentDay,
    badges: newBadges,
  });

  return { xpEarned, newStreak };
}

export async function getCheckInsForMonth(uid: string, year: number, month: number): Promise<string[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const q = query(
    collection(db, "checkIns"),
    where("uid", "==", uid),
    where("date", ">=", start),
    where("date", "<", end)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().date as string);
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function createBooking(data: Omit<Booking, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "bookings"), {
    ...data,
    meetLink: generateMeetLink(),
    status: "confirmed",
    reminderSent24h: false,
    reminderSent1h: false,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getUserBookings(uid: string): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), where("userId", "==", uid), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function getMentorBookings(mentorId: string): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), where("mentorId", "==", mentorId), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function getAllBookings(): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), orderBy("date", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function updateBookingStatus(id: string, status: Booking["status"]): Promise<void> {
  await updateDoc(doc(db, "bookings", id), { status });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getOrCreateConversation(userId: string, mentorId: string, names: Record<string, string>): Promise<string> {
  const convId = [userId, mentorId].sort().join("_");
  const ref = doc(db, "conversations", convId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: convId,
      participants: [userId, mentorId],
      participantNames: names,
      lastMessage: "",
      lastMessageAt: Date.now(),
      unreadCount: 0,
    });
  }
  return convId;
}

export async function sendMessage(convId: string, senderId: string, senderName: string, text: string): Promise<void> {
  await addDoc(collection(db, "conversations", convId, "messages"), {
    senderId, senderName, text, timestamp: Date.now(), read: false,
  });
  await updateDoc(doc(db, "conversations", convId), {
    lastMessage: text, lastMessageAt: Date.now(),
  });
}

export function subscribeMessages(convId: string, cb: (msgs: Message[]) => void) {
  const q = query(
    collection(db, "conversations", convId, "messages"),
    orderBy("timestamp", "asc"),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
  });
}

// ─── Programs ────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  const snap = await getDocs(collection(db, "programs"));
  return snap.docs.map((d) => d.data() as Program);
}

export async function upsertProgram(program: Program): Promise<void> {
  await setDoc(doc(db, "programs", program.id), program);
}

export async function seedPrograms(): Promise<void> {
  const defaultPrograms: Program[] = [
    {
      id: "30",
      title: "30 Days — Foundation",
      duration: 30,
      description: "Ground yourself in daily practice. Learn to observe the mind, establish stillness rituals, and build an unshakeable base.",
      price: 149,
      isActive: true,
      isFree: false,
      features: ["30 guided audio practices", "Weekly live sessions", "Daily journaling prompts", "XP & streak tracking", "Community access"],
      enrolledCount: 0,
    },
    {
      id: "60",
      title: "60 Days — Deepening",
      duration: 60,
      description: "Move beyond the surface. Dissolve conditioning, integrate shadow work, and cultivate a living relationship with awareness.",
      price: 279,
      isActive: true,
      isFree: false,
      features: ["60 practices + advanced sessions", "Bi-weekly 1:1 mentorship", "Shadow work framework", "Somatic practices", "XP double gains"],
      enrolledCount: 0,
    },
    {
      id: "90",
      title: "90 Days — Inner Mastery",
      duration: 90,
      description: "The complete Atmava immersion. Three months of structured transformation across all layers.",
      price: 449,
      isActive: true,
      isFree: false,
      features: ["90 premium practices", "Weekly 1:1 mentor sessions", "Full resource library", "Lifetime community access", "Inner Mastery certification"],
      enrolledCount: 0,
    },
  ];
  for (const p of defaultPrograms) {
    const snap = await getDoc(doc(db, "programs", p.id));
    if (!snap.exists()) await upsertProgram(p);
  }
}

// ─── Resources ───────────────────────────────────────────────────────────────

export async function getResources(programId?: string): Promise<Resource[]> {
  let q = query(collection(db, "resources"), orderBy("addedAt", "desc"));
  if (programId) q = query(q, where("programId", "==", programId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resource));
}

export async function addResource(data: Omit<Resource, "id">): Promise<void> {
  await addDoc(collection(db, "resources"), { ...data, addedAt: new Date().toISOString() });
}

export async function deleteResource(id: string): Promise<void> {
  await deleteDoc(doc(db, "resources", id));
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [usersSnap, bookingsSnap, checkInsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "bookings")),
    getDocs(collection(db, "checkIns")),
  ]);

  const users = usersSnap.docs.map((d) => d.data() as UserProfile);
  const bookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));

  const last7days = new Date();
  last7days.setDate(last7days.getDate() - 7);
  const last7str = last7days.toISOString().split("T")[0];

  const activeUsers = users.filter((u) => u.lastCheckIn && u.lastCheckIn >= last7str).length;
  const totalXP = users.reduce((a, u) => a + (u.xp ?? 0), 0);
  const programCounts: Record<string, number> = { "30": 0, "60": 0, "90": 0 };
  users.forEach((u) => { if (u.programId) programCounts[u.programId] = (programCounts[u.programId] ?? 0) + 1; });
  const completedSessions = bookings.filter((b) => b.status === "completed").length;
  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((a, b) => {
      const prices: Record<string, number> = { "30": 149, "60": 279, "90": 449 };
      return a + (prices[b.programId] ?? 0);
    }, 0);

  return {
    totalUsers: users.length,
    activeUsers,
    totalCheckIns: checkInsSnap.size,
    completedSessions,
    totalXP,
    revenue,
    programCounts,
    recentUsers: users.slice(0, 5),
    recentBookings: bookings.slice(0, 5),
  };
}
