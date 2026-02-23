"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllMentors, getAllUsers, setUserRole, assignMentorToUser } from "@/lib/firestore";
import type { UserProfile } from "@/types";

export function MentorsPanel() {
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"mentors" | "assign">("mentors");

  useEffect(() => {
    Promise.all([getAllMentors(), getAllUsers(100)])
      .then(([m, u]) => { setMentors(m); setUsers(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleRemoveMentor = async (uid: string) => {
    setSaving(true);
    await setUserRole(uid, "user").catch(() => {});
    setMentors(m => m.filter(x => x.uid !== uid));
    setSaving(false);
  };

  const handlePromoteToMentor = async (uid: string) => {
    setSaving(true);
    await setUserRole(uid, "mentor").catch(() => {});
    const promoted = users.find(u => u.uid === uid);
    if (promoted) {
      setMentors(m => [...m, { ...promoted, role: "mentor" }]);
      setUsers(u => u.map(x => x.uid === uid ? { ...x, role: "mentor" } : x));
    }
    setSaving(false);
  };

  const handleAssignMentor = async (userId: string, mentorId: string) => {
    const mentor = mentors.find(m => m.uid === mentorId);
    if (!mentor) return;
    setSaving(true);
    await assignMentorToUser(userId, mentorId, mentor.name).catch(() => {});
    setUsers(u => u.map(x => x.uid === userId ? { ...x, mentorId, mentorName: mentor.name } : x));
    setSaving(false);
  };

  const regularUsers = users.filter(u => u.role === "user");
  const filteredUsers = regularUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getMentorStudents = (mentorId: string) =>
    users.filter(u => u.mentorId === mentorId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          Mentors
        </motion.h2>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["mentors", "assign"] as const).map(v => (
            <motion.button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-xs tracking-widest uppercase"
              animate={{ background: view === v ? "rgba(122,140,116,0.3)" : "transparent", color: view === v ? "#7A8C74" : "rgba(246,244,239,0.4)" }}
            >
              {v === "mentors" ? "Mentors" : "Assign"}
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : view === "mentors" ? (
        <div className="space-y-3">
          {mentors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "rgba(246,244,239,0.4)" }}>No mentors yet. Promote users from the Assign tab.</p>
            </div>
          )}
          {mentors.map((mentor, i) => {
            const students = getMentorStudents(mentor.uid);
            const isSelected = selectedMentor?.uid === mentor.uid;
            return (
              <motion.div
                key={mentor.uid}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${isSelected ? "rgba(122,140,116,0.4)" : "rgba(255,255,255,0.07)"}` }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <motion.div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  style={{ background: isSelected ? "rgba(122,140,116,0.1)" : "rgba(255,255,255,0.04)" }}
                  onClick={() => setSelectedMentor(isSelected ? null : mentor)}
                  whileHover={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(122,140,116,0.2)", color: "#7A8C74" }}>
                    {mentor.name?.charAt(0)?.toUpperCase() ?? "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#F6F4EF" }}>{mentor.name}</p>
                    <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{mentor.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "#7A8C74" }}>{students.length} student{students.length !== 1 ? "s" : ""}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.3)" }}>mentor</span>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); handleRemoveMentor(mentor.uid); }}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(192,64,64,0.1)", color: "#c04040", border: "1px solid rgba(192,64,64,0.2)" }}
                      whileHover={{ background: "rgba(192,64,64,0.2)" }}
                      disabled={saving}
                    >
                      Remove
                    </motion.button>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      className="px-5 pb-5"
                      style={{ background: "rgba(122,140,116,0.05)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <p className="text-xs tracking-widest uppercase mt-4 mb-3" style={{ color: "#7A8C74" }}>Assigned Students</p>
                      {students.length === 0 ? (
                        <p className="text-sm" style={{ color: "rgba(246,244,239,0.3)" }}>No students assigned yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {students.map(s => (
                            <div key={s.uid} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                              <div>
                                <p className="text-sm" style={{ color: "#F6F4EF" }}>{s.name}</p>
                                <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{s.email}</p>
                              </div>
                              <div className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>
                                Day {s.currentDay ?? 1} · {s.xp ?? 0} XP
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { label: "XP Total", value: (mentor.xp ?? 0).toLocaleString() },
                          { label: "Level", value: mentor.level ?? "Beginner" },
                          { label: "Streak", value: `${mentor.streakCount ?? 0}d` },
                        ].map(s => (
                          <div key={s.label} className="px-3 py-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <p className="text-xs mb-0.5" style={{ color: "rgba(246,244,239,0.4)" }}>{s.label}</p>
                            <p className="text-sm" style={{ color: "#F6F4EF" }}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Assign tab – promote users & assign mentors */
        <div className="space-y-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
          />
          <div className="space-y-2">
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.uid}
                className="p-4 rounded-xl flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74" }}>
                  {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "#F6F4EF" }}>{u.name}</p>
                  <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={u.mentorId ?? ""}
                    onChange={e => handleAssignMentor(u.uid, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
                    disabled={saving}
                  >
                    <option value="">No mentor</option>
                    {mentors.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                  </select>
                  <motion.button
                    onClick={() => handlePromoteToMentor(u.uid)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.3)" }}
                    whileHover={{ background: "rgba(122,140,116,0.25)" }}
                    disabled={saving}
                  >
                    Make Mentor
                  </motion.button>
                </div>
              </motion.div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center py-10 text-sm" style={{ color: "rgba(246,244,239,0.4)" }}>No users found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
