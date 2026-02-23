"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireMentor?: boolean;
}

export function AuthGuard({ children, requireAdmin = false, requireMentor = false }: Props) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (requireAdmin && userProfile?.role !== "admin") { router.replace("/dashboard"); return; }
    if (requireMentor && userProfile?.role !== "mentor" && userProfile?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, userProfile, loading, requireAdmin, requireMentor, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F4EF" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#5C6B57" }}
        />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && userProfile?.role !== "admin") return null;

  return <>{children}</>;
}
