"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings } from "@/lib/firestore";
import { ProgressRing } from "./ProgressRing";
import type { Booking } from "@/types";

export function DashboardOverview() {
  const { userProfile, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid).then(setBookings).catch(() => {});
  }, [user]);

  const pct = userProfile?.programId
    ? Math.round(((userProfile.currentDay - 1) / Number(userProfile.programId)) * 100)
    : 0;

  const upcoming = bookings.filter(b => b.status === "confirmed" && b.date >= new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = userProfile?.lastCheckIn === today;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-sm mb-1" style={{ color: "#7A7771" }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 300, color: "#2C2B29" }}>
          Welcome back, {userProfile?.name?.split(" ")[0] ?? "Seeker"}.
        </h2>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Day Streak", value: String(userProfile?.streakCount ?? 0), sub: "days" },
          { label: "XP Earned", value: (userProfile?.xp ?? 0).toLocaleString(), sub: "points" },
          { label: "Current Day", value: String(userProfile?.currentDay ?? 1), sub: `of ${userProfile?.programId ?? "—"}` },
          { label: "Level", value: userProfile?.level ?? "Beginner", sub: "current rank" },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="p-5 rounded-2xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }} whileHover={{ y: -2, borderColor: "#5C6B57" }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#5C6B57" }}>{stat.label}</p>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: stat.value.length > 6 ? "1.3rem" : "2rem", color: "#2C2B29", fontWeight: 300 }}>{stat.value}</span>
            <p className="text-xs mt-0.5" style={{ color: "#7A7771" }}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress ring */}
        <motion.div className="p-7 rounded-2xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Program Progress</p>
          {userProfile?.programId ? (
            <div className="flex items-center gap-6">
              <ProgressRing percent={pct} size={110} />
              <div>
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "#7A7771" }}>{userProfile.programTitle}</span>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#2C2B29" }}>Day {userProfile.currentDay} of {userProfile.programId}</p>
                <p className="text-xs mt-1" style={{ color: "#7A7771" }}>{Number(userProfile.programId) - userProfile.currentDay + 1} days remaining</p>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#7A7771" }}>No active program. Enroll to begin.</p>
          )}
        </motion.div>

        {/* Today's tasks */}
        <motion.div className="p-7 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.38 }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Today's Practice</p>
          <div className="space-y-3">
            {[
              { title: "Morning Stillness", duration: "20 min", done: alreadyCheckedIn },
              { title: "Breath Observation", duration: "15 min", done: false },
              { title: "Evening Journal", duration: "10 min", done: false },
            ].map((task) => (
              <div key={task.title} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0" style={{ border: `1.5px solid ${task.done ? "#5C6B57" : "#D4CCBF"}`, background: task.done ? "#5C6B57" : "transparent" }}>
                  {task.done && <span style={{ color: "#F6F4EF", fontSize: "8px" }}>✓</span>}
                </div>
                <span className="text-sm flex-1" style={{ color: task.done ? "#7A7771" : "#2C2B29", textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                <span className="text-xs" style={{ color: "#7A7771" }}>{task.duration}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Upcoming Sessions</p>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-xl group" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}>
                <div>
                  <p className="text-sm" style={{ color: "#2C2B29" }}>Session with {b.mentorName}</p>
                  <p className="text-xs" style={{ color: "#7A7771" }}>{b.date} · {b.time}</p>
                </div>
                <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                  <motion.button className="text-xs tracking-widest uppercase px-4 py-2 rounded-lg" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645" }} whileTap={{ scale: 0.97 }}>
                    Join
                  </motion.button>
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Badges preview */}
      {userProfile?.badges && userProfile.badges.length > 0 && (
        <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "#5C6B57" }}>Recent Badges</p>
          <div className="flex gap-3 flex-wrap">
            {userProfile.badges.map((b) => (
              <div key={b} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "rgba(92,107,87,0.1)", color: "#5C6B57", border: "1px solid rgba(92,107,87,0.2)" }}>✦ {b}</div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
