"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings } from "@/lib/firestore";
import { ProgressRing } from "./ProgressRing";
import type { Booking } from "@/types";

export function MyProgram() {
  const { userProfile, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid).then(setBookings).catch(() => {});
  }, [user]);

  const totalDays = Number(userProfile?.programId ?? 30);
  const currentDay = userProfile?.currentDay ?? 1;
  const pct = Math.round(((currentDay - 1) / totalDays) * 100);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const upcomingBookings = bookings.filter(
    b => b.status === "confirmed" && b.date >= new Date().toISOString().split("T")[0]
  );
  const pastBookings = bookings.filter(b => b.status === "completed");

  return (
    <div className="space-y-6">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        My Program
      </motion.h2>

      {userProfile?.programId ? (
        <>
          {/* Progress card */}
          <motion.div className="p-8 rounded-2xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <ProgressRing percent={pct} size={140} strokeWidth={7} />
                <p className="text-xs tracking-widest uppercase" style={{ color: "#7A7771" }}>Complete</p>
              </div>
              <div className="flex-1">
                <span className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>{userProfile.programTitle}</span>
                <h3 className="mt-1 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 400, color: "#2C2B29" }}>
                  Day {currentDay} of {totalDays}
                </h3>
                <p className="text-sm mb-1" style={{ color: "#7A7771" }}>Streak: <strong style={{ color: "#2C2B29" }}>{userProfile.streakCount} days</strong></p>
                <p className="text-sm mb-6" style={{ color: "#7A7771" }}>Level: <strong style={{ color: "#2C2B29" }}>{userProfile.level}</strong></p>
                <motion.button
                  className="px-6 py-3 rounded-xl text-sm tracking-widest uppercase"
                  style={{ background: "#5C6B57", color: "#F6F4EF" }}
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
            <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>{totalDays}-Day Map</p>
              <div className="grid grid-cols-10 gap-2">
                {days.map(d => {
                  const done = d < currentDay;
                  const curr = d === currentDay;
                  return (
                    <motion.div key={d} className="aspect-square rounded-lg flex items-center justify-center text-xs" style={{ background: done ? "#5C6B57" : curr ? "rgba(92,107,87,0.15)" : "#E8E1D6", color: done ? "#F6F4EF" : curr ? "#5C6B57" : "#7A7771", border: curr ? "1.5px solid #5C6B57" : "none", fontWeight: curr ? 600 : 400 }} animate={curr ? { boxShadow: ["0 0 0 0 rgba(92,107,87,0.3)", "0 0 10px 4px rgba(92,107,87,0)", "0 0 0 0 rgba(92,107,87,0.3)"] } : {}} transition={{ duration: 2.5, repeat: Infinity }} whileHover={{ scale: 1.12 }}>
                      {d}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Upcoming sessions */}
          <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Upcoming Sessions</p>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm" style={{ color: "#7A7771" }}>No upcoming sessions. Book one from the sidebar.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b, i) => (
                  <motion.div key={b.id} className="flex items-center justify-between p-4 rounded-xl group" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} whileHover={{ borderColor: "#5C6B57" }}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm" style={{ color: "#2C2B29" }}>Session with {b.mentorName}</span>
                        <motion.span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(92,107,87,0.12)", color: "#5C6B57", border: "1px solid rgba(92,107,87,0.2)" }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }}>
                          Confirmed
                        </motion.span>
                      </div>
                      <p className="text-xs" style={{ color: "#7A7771" }}>{b.date} · {b.time}</p>
                    </div>
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                      <motion.button className="text-xs tracking-widest uppercase px-4 py-2 rounded-lg" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645" }} whileTap={{ scale: 0.97 }}>
                        Join
                      </motion.button>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Past sessions */}
          {pastBookings.length > 0 && (
            <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#7A7771" }}>Past Sessions</p>
              <div className="space-y-3">
                {pastBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF", opacity: 0.7 }}>
                    <div>
                      <p className="text-sm" style={{ color: "#2C2B29" }}>Session with {b.mentorName}</p>
                      <p className="text-xs" style={{ color: "#7A7771" }}>{b.date} · {b.time}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#E8E1D6", color: "#7A7771", border: "1px solid #D4CCBF" }}>Completed</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div className="p-10 rounded-2xl text-center" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29" }}>No active program</p>
          <p className="text-sm mb-6" style={{ color: "#7A7771" }}>Enroll in a program to begin your journey.</p>
          <a href="/programs">
            <motion.button className="px-6 py-3 rounded-xl text-sm tracking-widest uppercase" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645" }} whileTap={{ scale: 0.97 }}>
              View Programs
            </motion.button>
          </a>
        </motion.div>
      )}
    </div>
  );
}
