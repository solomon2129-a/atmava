import type { Metadata } from "next";
import "./globals.css";
import { AnimatedCursor } from "@/components/AnimatedCursor";
import { PageTransition } from "@/components/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Atmava — Awareness. Stillness. Inner Mastery.",
  description: "A sacred digital space for transformation, inner mastery, and conscious living.",
  keywords: ["meditation", "spiritual growth", "inner mastery", "mindfulness", "atmava"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnimatedCursor />
          <PageTransition>
            {children}
          </PageTransition>
        </AuthProvider>
      </body>
    </html>
  );
}
