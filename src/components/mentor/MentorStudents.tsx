"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getMentorStudents, getUserBookings } from "@/lib/firestore";
import type { UserProfile, Booking } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "rgba(246,244,239,0.3)",
  Seeker: "#c8a050",
  Practitioner: "#7A8C74",
  Embodied: "#6a9cba",
  Integrated: "#a07cc8",
};

export function MentorStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [studentBookings, setStudentBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    getMentorStudents(user.uid)
      .then(s => { setStudents(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSelectStudent = async (s: UserProfile) => {
    if (selected?.uid === s.uid) {
      setSelected(null);
      setStudentBookings([]);
      return;
    }
    setSelected(s);
    setLoadingBookings(true);
    getUserBookings(s.uid)
      .then(setStudentBookings)
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  };

  const today = new Date().toISOString().split("T")[0];
  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <motion.h2
        className="text-2xl"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Students
      </motion.h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : students.length === 0 ? (
        <motion.div className="p-12 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "rgba(246,244,239,0.6)", fontWeight: 300 }}>No students yet</p>
          <p className="text-sm mt-2" style={{ color: "rgba(246,244,239,0.3)" }}>Students will appear here once an admin assigns them to you.</p>
        </motion.div>
      ) : (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
          />

          <div className="space-y-2">
            {filtered.map((s, i) => {
              const pct = s.programId
                ? Math.min(100, Math.round(((s.currentDay - 1) / Number(s.programId)) * 100))
                : 0;
              const isActive = selected?.uid === s.uid;
              const checkedToday = s.lastCheckIn === today;

              return (
                <motion.div
                  key={s.uid}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${isActive ? "rgba(122,140,116,0.4)" : "rgba(255,255,255,0.07)"}` }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {/* Row */}
                  <motion.div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    style={{ background: isActive ? "rgba(122,140,116,0.1)" : "rgba(255,255,255,0.04)" }}
                    onClick={() => handleSelectStudent(s)}
                    whileHover={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(122,140,116,0.2)", color: "#7A8C74" }}>
                        {s.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      {checkedToday && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#7A8C74", fontSize: "8px", color: "#F6F4EF" }}>✓</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm truncate" style={{ color: "#F6F4EF" }}>{s.name}</p>
                        <span className="text-xs flex-shrink-0" style={{ color: LEVEL_COLORS[s.level ?? "Beginner"] ?? "rgba(246,244,239,0.3)" }}>
                          {s.level ?? "Beginner"}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ background: "#7A8C74", width: `${pct}%` }} />
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: "rgba(246,244,239,0.35)" }}>
                          Day {s.currentDay ?? 1}/{s.programId ?? "—"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="text-xs" style={{ color: "#7A8C74" }}>🔥 {s.streakCount ?? 0}d</p>
                      <p className="text-xs" style={{ color: "rgba(246,244,239,0.35)" }}>{(s.xp ?? 0).toLocaleString()} XP</p>
                    </div>
                  </motion.div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        style={{ background: "rgba(122,140,116,0.05)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-4">
                          {/* Stats row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: "Program", value: s.programTitle ?? "None" },
                              { label: "Streak",  value: `${s.streakCount ?? 0} days` },
                              { label: "XP",      value: (s.xp ?? 0).toLocaleString() },
                              { label: "Joined",  value: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—" },
                            ].map(st => (
                              <div key={st.label} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                                <p className="text-xs mb-0.5" style={{ color: "rgba(246,244,239,0.35)" }}>{st.label}</p>
                                <p className="text-xs" style={{ color: "#F6F4EF" }}>{st.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Sessions with you */}
                          <div>
                            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#7A8C74" }}>Sessions with you</p>
                            {loadingBookings ? (
                              <div className="py-4 flex justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-5 h-5 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
                              </div>
                            ) : studentBookings.length === 0 ? (
                              <p className="text-xs" style={{ color: "rgba(246,244,239,0.3)" }}>No 1:1 sessions booked yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {studentBookings.slice(0, 4).map(b => (
                                  <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                                    <p className="text-xs" style={{ color: "rgba(246,244,239,0.6)" }}>{b.date} · {b.time}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                      background: b.status === "confirmed" ? "rgba(122,140,116,0.15)" : "rgba(255,255,255,0.05)",
                                      color: b.status === "confirmed" ? "#7A8C74" : "rgba(246,244,239,0.3)",
                                    }}>
                                      {b.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
