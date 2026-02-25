import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mentor Portal — Atmava" };
export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
