"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, Calendar, Star, MessageSquare, FolderOpen, LogOut, Video, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: Home, label: "Overview", id: "overview" },
  { icon: BookOpen, label: "My Program", id: "program" },
  { icon: Video, label: "Book Session", id: "booking" },
  { icon: Calendar, label: "Practice", id: "practice" },
  { icon: Star, label: "Rewards", id: "rewards" },
  { icon: MessageSquare, label: "Messages", id: "messages" },
  { icon: FolderOpen, label: "Resources", id: "resources" },
];

interface Props { active: string; setActive: (id: string) => void; }

export function DashboardSidebar({ active, setActive }: Props) {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  const initials = userProfile?.name
    ? userProfile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{ width: "220px", background: "#E8E1D6", borderRight: "1px solid #D4CCBF" }}
      initial={{ x: -220, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="px-6 py-6" style={{ borderBottom: "1px solid #D4CCBF" }}>
        <Link href="/"><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#2C2B29", letterSpacing: "0.14em" }}>Atmava</span></Link>
        {userProfile?.programTitle && <p className="text-xs mt-1 truncate" style={{ color: "#7A7771" }}>{userProfile.programTitle}</p>}
      </div>

      <nav className="flex-1 py-5 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <motion.button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left relative" onClick={() => setActive(item.id)} whileHover={{ background: "rgba(92,107,87,0.08)" }} animate={{ background: isActive ? "rgba(92,107,87,0.12)" : "transparent" }}>
                {isActive && <motion.div layoutId="sidebar-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full" style={{ background: "#5C6B57" }} />}
                <Icon size={15} style={{ color: isActive ? "#5C6B57" : "#7A7771", flexShrink: 0 }} />
                <span className="text-sm" style={{ color: isActive ? "#2C2B29" : "#7A7771", fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
              </motion.button>
            );
          })}
          {(userProfile?.role === "admin" || userProfile?.role === "mentor") && (
            <>
              <div className="my-3 mx-1" style={{ borderTop: "1px solid #D4CCBF" }} />
              <Link href="/admin">
                <motion.div className="flex items-center gap-3 px-4 py-3 rounded-xl" whileHover={{ background: "rgba(92,107,87,0.08)" }}>
                  <Shield size={15} style={{ color: "#5C6B57" }} />
                  <span className="text-sm" style={{ color: "#5C6B57" }}>{userProfile.role === "admin" ? "Admin Panel" : "Mentor Panel"}</span>
                </motion.div>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="px-3 pb-5" style={{ borderTop: "1px solid #D4CCBF" }}>
        <div className="pt-4 px-3">
          <div className="flex items-center gap-3 mb-4">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} className="w-8 h-8 rounded-full object-cover" alt="av" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "#5C6B57", color: "#F6F4EF" }}>{initials}</div>
            )}
            <div className="min-w-0">
              <p className="text-xs truncate" style={{ color: "#2C2B29" }}>{userProfile?.name ?? "Seeker"}</p>
              <p className="text-xs" style={{ color: "#7A7771" }}>{userProfile?.level} · {userProfile?.xp ?? 0} XP</p>
            </div>
          </div>
          <motion.button className="flex items-center gap-2" whileHover={{ opacity: 0.7 }} onClick={handleSignOut}>
            <LogOut size={13} style={{ color: "#7A7771" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "#7A7771" }}>Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
