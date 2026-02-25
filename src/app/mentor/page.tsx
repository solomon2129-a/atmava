"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { MentorOverview } from "@/components/mentor/MentorOverview";
import { MentorStudents } from "@/components/mentor/MentorStudents";
import { MentorSessions } from "@/components/mentor/MentorSessions";
import { MentorMessages } from "@/components/mentor/MentorMessages";

const PANELS: Record<string, React.ReactNode> = {
  overview: <MentorOverview />,
  students: <MentorStudents />,
  sessions:   <MentorSessions />,
  messages: <MentorMessages />,
};

export default function MentorPage() {
  const [active, setActive] = useState("overview");

  return (
    <AuthGuard requireMentor>
      <div className="min-h-screen" style={{ background: "#1A1917" }}>
        <MentorSidebar active={active} setActive={setActive} />

        {/* Main content — responsive left margin + top padding for mobile bar */}
        <main className="min-h-screen md:ml-[220px] pt-14 md:pt-0 px-5 py-6 md:px-10 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="max-w-4xl"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {PANELS[active] ?? <MentorOverview />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AuthGuard>
  );
}
