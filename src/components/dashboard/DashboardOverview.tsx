"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveEnrollment, getUserBookings } from "@/lib/firestore";
import { ProgressRing } from "./ProgressRing";
import type { Booking, Enrollment } from "@/types";

export function DashboardOverview() {
  const { userProfile, user } = useAuth();
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid).then(setBookings).catch(() => {});
    getActiveEnrollment(user.uid).then(e => setEnrollment(e)).catch(() => {});
  }, [user]);

  // Compute days remaining and progress from enrollment
  const totalDays = enrollment ? Number(enrollment.programId) : (userProfile?.programId ? Number(userProfile.programId) : 30);
  const daysSinceStart = enrollment
    ? Math.max(1, Math.ceil((Date.now() - new Date(enrollment.startDate).getTime()) / 86400000))
    : (userProfile?.currentDay ?? 1);
  const currentDay = Math.min(daysSinceStart, totalDays);
  const daysRemaining = enrollment
    ? Math.max(0, Math.ceil((new Date(enrollment.endDate).getTime() - Date.now()) / 86400000))
    : null;
  const pct = Math.round(((currentDay - 1) / totalDays) * 100);

  const upcoming = bookings.filter(b => b.status === "confirmed" && b.date >= new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = userProfile?.lastCheckIn === today;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div className="space-y-4 md:space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs md:text-sm mb-1" style={{ color: "#7A7771" }}>Good {greeting}</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 300, color: "#2C2B29" }}>
          Welcome back, {userProfile?.name?.split(" ")[0] ?? "Seeker"}.
        </h2>
      </motion.div>

      {/* Stats — 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[
          { label: "Day Streak",   value: String(userProfile?.streakCount ?? 0),            sub: "days in a row" },
          { label: "XP Earned",    value: (userProfile?.xp ?? 0).toLocaleString(),           sub: "total points" },
          { label: "Days Left",    value: daysRemaining !== null ? String(daysRemaining) : String(totalDays - currentDay + 1), sub: "until expiry" },
          { label: "Level",        value: userProfile?.level ?? "Beginner",                  sub: "current rank" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="p-3 md:p-5 rounded-2xl"
            style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
            whileHover={{ y: -2, borderColor: "#5C6B57", boxShadow: "0 4px 16px rgba(92,107,87,0.1)" }}
          >
            <p className="text-xs tracking-widest uppercase mb-1.5 md:mb-2" style={{ color: "#5C6B57" }}>{stat.label}</p>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: stat.value.length > 6 ? "1.1rem" : "1.6rem", color: "#2C2B29", fontWeight: 300 }}>{stat.value}</span>
            <p className="text-xs mt-0.5" style={{ color: "#7A7771" }}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Progress ring */}
        <motion.div
          className="p-4 md:p-7 rounded-2xl"
          style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          whileHover={{ borderColor: "#5C6B57" }}
        >
          <p className="text-xs tracking-widest uppercase mb-4 md:mb-5" style={{ color: "#5C6B57" }}>Program Progress</p>
          {userProfile?.programId ? (
            <div className="flex items-center gap-4 md:gap-6">
              <ProgressRing percent={pct} size={90} strokeWidth={6} />
              <div>
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "#7A7771" }}>{userProfile.programTitle}</span>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#2C2B29" }}>Day {currentDay} of {totalDays}</p>
                <p className="text-xs mt-1" style={{ color: "#7A7771" }}>{daysRemaining !== null ? `${daysRemaining} days remaining` : `${totalDays - currentDay} days remaining`}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#7A7771" }}>No active program. Enroll to begin.</p>
          )}
        </motion.div>

        {/* Today's tasks */}
        <motion.div
          className="p-4 md:p-7 rounded-2xl"
          style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          whileHover={{ borderColor: "#5C6B57" }}
        >
          <p className="text-xs tracking-widest uppercase mb-4 md:mb-5" style={{ color: "#5C6B57" }}>Today's Practice</p>
          <div className="space-y-2.5 md:space-y-3">
            {[
              { title: "Morning Stillness",  duration: "20 min", done: alreadyCheckedIn },
              { title: "Breath Observation", duration: "15 min", done: false },
              { title: "Evening Journal",    duration: "10 min", done: false },
            ].map((task) => (
              <motion.div key={task.title} className="flex items-center gap-3" whileHover={{ x: 2 }}>
                <div
                  className="w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{ border: `1.5px solid ${task.done ? "#5C6B57" : "#D4CCBF"}`, background: task.done ? "#5C6B57" : "transparent" }}
                >
                  {task.done && <span style={{ color: "#F6F4EF", fontSize: "7px" }}>✓</span>}
                </div>
                <span className="text-xs md:text-sm flex-1" style={{ color: task.done ? "#7A7771" : "#2C2B29", textDecoration: task.done ? "line-through" : "none" }}>
                  {task.title}
                </span>
                <span className="text-xs" style={{ color: "#7A7771" }}>{task.duration}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming 1:1 bookings */}
      {upcoming.length > 0 && (
        <motion.div
          className="p-4 md:p-6 rounded-2xl"
          style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <p className="text-xs tracking-widest uppercase mb-4 md:mb-5" style={{ color: "#5C6B57" }}>Upcoming 1:1 Sessions</p>
          <div className="space-y-2.5 md:space-y-3">
            {upcoming.slice(0, 3).map((b) => (
              <motion.div
                key={b.id}
                className="flex items-center justify-between p-3 md:p-4 rounded-xl"
                style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}
                whileHover={{ borderColor: "#5C6B57", x: 2 }}
              >
                <div>
                  <p className="text-xs md:text-sm" style={{ color: "#2C2B29" }}>Session with {b.mentorName}</p>
                  <p className="text-xs" style={{ color: "#7A7771" }}>{b.date} · {b.time}</p>
                </div>
                <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                  <motion.button
                    className="text-xs tracking-widest uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-lg"
                    style={{ background: "#5C6B57", color: "#F6F4EF", minHeight: "36px" }}
                    whileHover={{ background: "#4A5645" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Join
                  </motion.button>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Badges preview */}
      {userProfile?.badges && userProfile.badges.length > 0 && (
        <motion.div
          className="p-4 md:p-6 rounded-2xl"
          style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <p className="text-xs tracking-widest uppercase mb-3 md:mb-4" style={{ color: "#5C6B57" }}>Recent Badges</p>
          <div className="flex gap-2 md:gap-3 flex-wrap">
            {userProfile.badges.map((b) => (
              <motion.div
                key={b}
                className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs"
                style={{ background: "rgba(92,107,87,0.1)", color: "#5C6B57", border: "1px solid rgba(92,107,87,0.2)" }}
                whileHover={{ scale: 1.05, background: "rgba(92,107,87,0.18)" }}
              >
                ✦ {b}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
