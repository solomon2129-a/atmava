import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Atmava",
  description: "Atmava admin panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
