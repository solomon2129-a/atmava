"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart2, Users, BookOpen, Calendar, UserCheck, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: BarChart2, label: "Overview", id: "overview" },
  { icon: Users, label: "Users", id: "users" },
  { icon: BookOpen, label: "Programs", id: "programs" },
  { icon: Calendar, label: "Sessions", id: "sessions" },
  { icon: UserCheck, label: "Mentors", id: "mentors" },
];

interface Props { active: string; setActive: (id: string) => void; }

export function AdminSidebar({ active, setActive }: Props) {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const handleSignOut = async () => { await signOut(); router.push("/"); };

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{ width: "220px", background: "#2C2B29", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      initial={{ x: -220, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#F6F4EF", letterSpacing: "0.14em" }}>Atmava</span>
        <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: "rgba(246,244,239,0.35)" }}>
          {userProfile?.role === "admin" ? "Admin Panel" : "Mentor Panel"}
        </p>
      </div>

      <nav className="flex-1 py-5 px-3">
        <div className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <motion.button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left relative" onClick={() => setActive(item.id)} whileHover={{ background: "rgba(246,244,239,0.06)" }} animate={{ background: isActive ? "rgba(246,244,239,0.1)" : "transparent" }}>
                {isActive && <motion.div layoutId="admin-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full" style={{ background: "#7A8C74" }} />}
                <Icon size={15} style={{ color: isActive ? "#7A8C74" : "rgba(246,244,239,0.5)", flexShrink: 0 }} />
                <span className="text-sm" style={{ color: isActive ? "#F6F4EF" : "rgba(246,244,239,0.5)", fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="pt-4 px-3 space-y-2">
          <Link href="/dashboard">
            <motion.div className="flex items-center gap-2 py-2" whileHover={{ opacity: 0.7 }}>
              <LayoutDashboard size={13} style={{ color: "rgba(246,244,239,0.5)" }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(246,244,239,0.5)" }}>Dashboard</span>
            </motion.div>
          </Link>
          <motion.button className="flex items-center gap-2" whileHover={{ opacity: 0.7 }} onClick={handleSignOut}>
            <LogOut size={13} style={{ color: "rgba(246,244,239,0.5)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(246,244,239,0.5)" }}>Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
