"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveEnrollment } from "@/lib/firestore";
import { ProgressRing } from "./ProgressRing";
import type { Enrollment } from "@/types";

export function MyProgram() {
  const { userProfile, user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    getActiveEnrollment(user.uid)
      .then(e => setEnrollment(e))
      .catch(() => setEnrollment(null));
  }, [user]);

  // ── Resolve values ─────────────────────────────────────────────────────────
  const totalDays = enrollment
    ? Number(enrollment.programId)
    : (userProfile?.programId ? Number(userProfile.programId) : 30);

  const currentDay = enrollment
    ? Math.min(
        Math.max(1, Math.ceil((Date.now() - new Date(enrollment.startDate).getTime()) / 86400000)),
        totalDays
      )
    : (userProfile?.currentDay ?? 1);

  const daysRemaining = enrollment
    ? Math.max(0, Math.ceil((new Date(enrollment.endDate).getTime() - Date.now()) / 86400000))
    : totalDays - currentDay;

  const programLabel = enrollment
    ? (userProfile?.programTitle ?? `${totalDays}-Day Program`)
    : (userProfile?.programTitle ?? "");

  const pct = Math.round(((currentDay - 1) / totalDays) * 100);
  const days = Array.from({ length: Math.min(totalDays, 30) }, (_, i) => i + 1);
  const isEnrolled = !!enrollment || !!userProfile?.programId;
  const isLoading = enrollment === undefined && !userProfile?.programId;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-7 h-7 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#5C6B57" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <motion.h2
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.4rem, 4vw, 1.9rem)", color: "#2C2B29", fontWeight: 400 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      >
        My Program
      </motion.h2>

      {isEnrolled ? (
        <>
          {/* Progress card */}
          <motion.div
            className="p-5 md:p-8 rounded-2xl"
            style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ borderColor: "#5C6B57" }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <ProgressRing percent={pct} size={110} strokeWidth={6} />
                <p className="text-xs tracking-widest uppercase" style={{ color: "#7A7771" }}>Complete</p>
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>
                  {programLabel}
                </span>
                <h3 className="mt-1 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: 400, color: "#2C2B29" }}>
                  Day {currentDay} of {totalDays}
                </h3>
                <div className="flex items-center gap-4 justify-center md:justify-start text-sm mb-1" style={{ color: "#7A7771" }}>
                  <span>Streak: <strong style={{ color: "#2C2B29" }}>{userProfile?.streakCount ?? 0}d</strong></span>
                  <span>Level: <strong style={{ color: "#2C2B29" }}>{userProfile?.level ?? "Beginner"}</strong></span>
                </div>
                <p className="text-xs mb-5" style={{ color: "#7A7771" }}>{daysRemaining} days remaining</p>
                <motion.button
                  className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm tracking-widest uppercase"
                  style={{ background: "#5C6B57", color: "#F6F4EF", minHeight: "44px" }}
                  whileHover={{ background: "#4A5645", boxShadow: "0 6px 20px rgba(92,107,87,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ boxShadow: ["0 0 0 0 rgba(92,107,87,0.2)", "0 0 16px 6px rgba(92,107,87,0.0)", "0 0 0 0 rgba(92,107,87,0.2)"] }}
                  transition={{ boxShadow: { duration: 3.5, repeat: Infinity }, default: { duration: 0.25 } }}
                >
                  Continue Practice
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Day grid */}
          {totalDays <= 30 && (
            <motion.div
              className="p-4 md:p-6 rounded-2xl"
              style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ borderColor: "#5C6B57" }}
            >
              <p className="text-xs tracking-widest uppercase mb-4 md:mb-5" style={{ color: "#5C6B57" }}>
                {totalDays}-Day Map
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-10 gap-1 md:gap-2">
                {days.map(d => {
                  const done = d < currentDay;
                  const curr = d === currentDay;
                  return (
                    <motion.div
                      key={d}
                      className="aspect-square rounded-lg flex items-center justify-center text-xs"
                      style={{
                        background: done ? "#5C6B57" : curr ? "rgba(92,107,87,0.15)" : "#E8E1D6",
                        color:      done ? "#F6F4EF" : curr ? "#5C6B57" : "#7A7771",
                        border:     curr ? "1.5px solid #5C6B57" : "none",
                        fontWeight: curr ? 600 : 400,
                        fontSize:   "0.65rem",
                      }}
                      animate={curr ? { boxShadow: ["0 0 0 0 rgba(92,107,87,0.3)", "0 0 10px 4px rgba(92,107,87,0)", "0 0 0 0 rgba(92,107,87,0.3)"] } : {}}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      whileHover={{ scale: 1.15 }}
                    >
                      {d}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Sessions link card */}
          <motion.div
            className="p-4 md:p-6 rounded-2xl"
            style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ borderColor: "#5C6B57" }}
          >
            <p className="text-xs tracking-widest uppercase mb-3 md:mb-4" style={{ color: "#5C6B57" }}>
              Live Sessions
            </p>
            <p className="text-xs md:text-sm mb-4" style={{ color: "#7A7771", lineHeight: 1.7 }}>
              Your mentor creates live sessions for your program. Join them directly from your sessions tab.
            </p>
            <motion.button
              onClick={() => window.dispatchEvent(new CustomEvent("dashboard-nav", { detail: "sessions" }))}
              className="inline-block text-xs tracking-widest uppercase"
              style={{ color: "#5C6B57", minHeight: "44px", display: "flex", alignItems: "center" }}
              whileHover={{ opacity: 0.7 }}
              whileTap={{ scale: 0.95 }}
            >
              View Sessions →
            </motion.button>
          </motion.div>
        </>
      ) : (
        <motion.div
          className="p-8 md:p-10 rounded-2xl text-center"
          style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29" }}>
            No active program
          </p>
          <p className="text-xs md:text-sm mb-6" style={{ color: "#7A7771" }}>
            Enroll in a program to begin your journey.
          </p>
          <a href="/programs">
            <motion.button
              className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm tracking-widest uppercase"
              style={{ background: "#5C6B57", color: "#F6F4EF", minHeight: "44px" }}
              whileHover={{ background: "#4A5645" }}
              whileTap={{ scale: 0.97 }}
            >
              View Programs
            </motion.button>
          </a>
        </motion.div>
      )}
    </div>
  );
}
