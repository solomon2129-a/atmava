"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { ProgramsPanel } from "@/components/admin/ProgramsPanel";
import { SessionsPanel } from "@/components/admin/SessionsPanel";
import { MentorsPanel } from "@/components/admin/MentorsPanel";

const PANELS: Record<string, React.ReactNode> = {
  overview: <OverviewPanel />,
  users: <UsersPanel />,
  programs: <ProgramsPanel />,
  sessions: <SessionsPanel />,
  mentors: <MentorsPanel />,
};

export default function AdminPage() {
  const [active, setActive] = useState("overview");

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen" style={{ background: "#1A1917" }}>
        <AdminSidebar active={active} setActive={setActive} />

        {/* Main content */}
        <main className="min-h-screen" style={{ marginLeft: "220px", padding: "48px 40px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-4xl"
            >
              {PANELS[active] ?? <OverviewPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AuthGuard>
  );
}
