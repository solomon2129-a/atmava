"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getMentorStudents, getMentorBookings, getSessionsByMentor } from "@/lib/firestore";
import type { UserProfile, Booking } from "@/types";

export function MentorOverview() {
  const { user, userProfile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [s, b, sessions] = await Promise.all([
        getMentorStudents(user.uid),
        getMentorBookings(user.uid),
        getSessionsByMentor(user.uid),
      ]);
      setStudents(s);
      setBookings(b);
      setSessionCount(sessions.length);
      setLoading(false);
    };
    fetchData().catch(() => setLoading(false));
  }, [user?.uid]);

  const today = new Date().toISOString().split("T")[0];
  const todaySessions  = bookings.filter(b => b.date === today  && b.status === "confirmed");
  const avgStreak = students.length
    ? Math.round(students.reduce((a, s) => a + (s.streakCount ?? 0), 0) / students.length)
    : 0;

  const statCards = [
    { label: "My Students",      value: students.length.toString(),      sub: "assigned to you" },
    { label: "Today's Bookings", value: todaySessions.length.toString(), sub: "happening today" },
    { label: "My Sessions",      value: sessionCount.toString(),         sub: "group sessions created" },
    { label: "Avg Streak",       value: `${avgStreak}d`,                 sub: "across students" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm mb-1" style={{ color: "rgba(246,244,239,0.4)" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", color: "#F6F4EF", fontWeight: 300 }}>
          {userProfile?.name?.split(" ")[0] ?? "Mentor"}.
        </h2>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                className="p-3 md:p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ background: "rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#7A8C74" }}>{s.label}</p>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#F6F4EF", fontWeight: 300 }}>{s.value}</span>
                <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.4)" }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Today's 1:1 bookings */}
          {todaySessions.length > 0 && (
            <motion.div
              className="p-5 md:p-6 rounded-2xl"
              style={{ background: "rgba(122,140,116,0.08)", border: "1px solid rgba(122,140,116,0.25)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "#7A8C74" }}>Today's 1:1 Sessions</p>
              <div className="space-y-3">
                {todaySessions.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-sm" style={{ color: "#F6F4EF" }}>{b.userName}</p>
                      <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{b.time} · {b.notes || "No notes"}</p>
                    </div>
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                      <motion.button
                        className="text-xs tracking-widest uppercase px-3 md:px-4 py-2 rounded-lg"
                        style={{ background: "#7A8C74", color: "#F6F4EF", minHeight: "36px" }}
                        whileHover={{ background: "#6a7c64" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Join
                      </motion.button>
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Student progress snapshot */}
          {students.length > 0 && (
            <motion.div
              className="p-5 md:p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs tracking-widest uppercase" style={{ color: "#7A8C74" }}>Student Overview</p>
                <span className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>avg {avgStreak}d streak</span>
              </div>
              <div className="space-y-3">
                {students.slice(0, 5).map((s, i) => {
                  const pct = s.programId
                    ? Math.min(100, Math.round(((s.currentDay - 1) / Number(s.programId)) * 100))
                    : 0;
                  const checkedToday = s.lastCheckIn === today;
                  return (
                    <motion.div
                      key={s.uid}
                      className="flex items-center gap-4 py-3"
                      style={{ borderBottom: i < students.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: checkedToday ? "rgba(122,140,116,0.3)" : "rgba(255,255,255,0.08)", color: checkedToday ? "#7A8C74" : "rgba(246,244,239,0.5)" }}>
                        {s.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm truncate" style={{ color: "#F6F4EF" }}>{s.name}</p>
                          <span className="text-xs ml-2 flex-shrink-0" style={{ color: "#7A8C74" }}>
                            {checkedToday ? "✓ today" : "–"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: "#7A8C74" }}
                              initial={{ width: "0%" }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: 0.2 + i * 0.06 }}
                            />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: "rgba(246,244,239,0.4)" }}>
                            Day {s.currentDay ?? 1}/{s.programId ?? "—"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs" style={{ color: "rgba(246,244,239,0.5)" }}>🔥 {s.streakCount ?? 0}</p>
                        <p className="text-xs" style={{ color: "rgba(246,244,239,0.3)" }}>{s.level ?? "Beginner"}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {students.length === 0 && (
            <motion.div
              className="p-12 rounded-2xl text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "rgba(246,244,239,0.6)", fontWeight: 300 }}>
                No students assigned yet
              </p>
              <p className="text-sm mt-2" style={{ color: "rgba(246,244,239,0.3)" }}>
                An admin will assign students to you. Check back soon.
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
