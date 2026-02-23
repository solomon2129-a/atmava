"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyProgram } from "@/components/dashboard/MyProgram";
import { PracticeTracker } from "@/components/dashboard/PracticeTracker";
import { Rewards } from "@/components/dashboard/Rewards";
import { Messages } from "@/components/dashboard/Messages";
import { Resources } from "@/components/dashboard/Resources";
import { BookingPanel } from "@/components/dashboard/BookingPanel";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const sections: Record<string, React.ComponentType> = {
  overview: DashboardOverview,
  program: MyProgram,
  practice: PracticeTracker,
  rewards: Rewards,
  messages: Messages,
  resources: Resources,
  booking: BookingPanel,
};

export default function DashboardPage() {
  const [active, setActive] = useState("overview");
  const { userProfile } = useAuth();
  const ActiveSection = sections[active] || DashboardOverview;

  return (
    <AuthGuard>
      <div className="min-h-screen flex" style={{ background: "#F6F4EF" }}>
        <DashboardSidebar active={active} setActive={setActive} />
        <div className="flex-1" style={{ marginLeft: "220px" }}>
          <motion.div
            className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between"
            style={{ background: "rgba(246,244,239,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid #D4CCBF" }}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>
              {active.charAt(0).toUpperCase() + active.slice(1)}
            </p>
            <div className="flex items-center gap-4">
              <motion.button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,204,191,0.4)", border: "1px solid #D4CCBF" }} whileHover={{ borderColor: "#5C6B57" }}>
                <Search size={14} style={{ color: "#7A7771" }} />
              </motion.button>
              <motion.button className="w-8 h-8 rounded-lg flex items-center justify-center relative" style={{ background: "rgba(212,204,191,0.4)", border: "1px solid #D4CCBF" }} whileHover={{ borderColor: "#5C6B57" }}>
                <Bell size={14} style={{ color: "#7A7771" }} />
                <motion.div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#5C6B57" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.button>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "#5C6B57", color: "#F6F4EF" }}>
                  {userProfile?.name?.slice(0, 2).toUpperCase() ?? "A"}
                </div>
              )}
            </div>
          </motion.div>

          <div className="px-8 py-8 max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}>
                <ActiveSection />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
