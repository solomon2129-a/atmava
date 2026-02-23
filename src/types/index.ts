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
