"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAdminStats } from "@/lib/firestore";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  activeEnrollments: number;
  totalCheckIns: number;
  completedSessions: number;
  totalXP: number;
  programCounts: Record<string, number>;
  recentUsers: Array<{ name: string; email: string; level: string; createdAt: string }>;
  recentBookings: Array<{ userName: string; mentorName: string; date: string; status: string }>;
}

export function OverviewPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(s => { setStats(s as Stats); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Users",       value: stats.totalUsers.toString(),                     sub: "registered accounts" },
    { label: "Active (7d)",       value: stats.activeUsers.toString(),                    sub: "checked in recently" },
    { label: "Enrolled",          value: stats.activeEnrollments.toString(),              sub: "active enrollments" },
    { label: "Check-Ins",         value: stats.totalCheckIns.toString(),                 sub: "total practices" },
    { label: "Sessions Done",     value: stats.completedSessions.toString(),              sub: "completed bookings" },
    { label: "Total XP",          value: (stats.totalXP / 1000).toFixed(1) + "k",       sub: "across all users" },
  ] : [];

  return (
    <div className="space-y-6">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        Overview
      </motion.h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map((card, i) => (
              <motion.div key={card.label} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ background: "rgba(255,255,255,0.08)" }}>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#7A8C74" }}>{card.label}</p>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#F6F4EF", fontWeight: 300 }}>{card.value}</span>
                <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.4)" }}>{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Program distribution */}
          {stats && (
            <motion.div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#7A8C74" }}>Program Enrollment</p>
              <div className="space-y-3">
                {[["30", "Foundation"], ["60", "Deepening"], ["90", "Inner Mastery"]].map(([id, name]) => {
                  const count = stats.programCounts[id] ?? 0;
                  const total = stats.totalUsers || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: "rgba(246,244,239,0.7)" }}>{name}</span>
                        <span style={{ color: "#7A8C74" }}>{count} users ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: "#7A8C74" }} initial={{ width: "0%" }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: 0.5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recent users */}
          {stats && stats.recentUsers.length > 0 && (
            <motion.div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#7A8C74" }}>Recent Registrations</p>
              <div className="space-y-3">
                {stats.recentUsers.slice(0, 5).map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-sm" style={{ color: "#F6F4EF" }}>{u.name}</p>
                      <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{u.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74" }}>{u.level}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
