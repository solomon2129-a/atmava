export type UserRole = "user" | "mentor" | "admin";
export type ProgramId = "30" | "60" | "90";
export type Level = "Beginner" | "Seeker" | "Practitioner" | "Embodied" | "Integrated";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL: string | null;
  programId: ProgramId | null;
  programTitle: string | null;
  programStartDate: string | null;
  currentDay: number;
  xp: number;
  level: Level;
  streakCount: number;
  lastCheckIn: string | null; // YYYY-MM-DD
  badges: string[];
  createdAt: string;
  mentorId: string | null;
  mentorName: string | null;
  bio?: string;
  specialization?: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mentorId: string;
  mentorName: string;
  programId: string;
  date: string;       // YYYY-MM-DD
  time: string;
  meetLink: string;
  googleEventId?: string;  // optional, legacy only
  status: BookingStatus;
  notes: string;
  createdAt: string;
  reminderSent24h: boolean;
  reminderSent1h: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string;
  xpEarned: number;
  timestamp: number;
}

export interface Program {
  id: ProgramId;
  title: string;
  duration: number;
  description: string;
  price: number;
  isActive: boolean;
  isFree: boolean;
  features: string[];
  enrolledCount: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "PDF" | "Audio" | "Video";
  url: string;
  programId: string;
  size: string;
  addedAt: string;
}

export type PaymentStatus    = "created" | "paid" | "failed";
export type EnrollmentStatus = "active" | "expired";

export interface Payment {
  id: string;
  userId: string;
  programId: string;
  /** Razorpay order ID — used to correlate create-order → verify */
  razorpayOrderId: string;
  /** Populated after successful payment */
  razorpayPaymentId?: string;
  /** Amount in paise (INR × 100) */
  amount: number;
  status: PaymentStatus;
  /** Which environment the payment was captured in */
  mode: "test" | "live";
  createdAt: string;
}

/** Unified enrollment — covers both payment-created and admin-granted access */
export interface Enrollment {
  id: string;
  userId: string;
  programId: string;
  /** Razorpay payment doc ID. null = admin-granted access */
  paymentId: string | null;
  status: EnrollmentStatus;
  /** ISO date string — when access begins */
  startDate: string;
  /** ISO date string — when access expires (startDate + durationDays) */
  endDate: string;
  createdAt: string;
  grantedByAdmin: boolean;
}

/** A live session created by a mentor for a program */
export interface Session {
  id: string;
  programId: string;
  mentorId: string;
  mentorName: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  meetLink: string;
  createdAt: string;
}
