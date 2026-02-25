"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { checkInToday, getCheckInsForMonth } from "@/lib/firestore";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function PracticeTracker() {
  const { userProfile, user, refreshProfile } = useAuth();
  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  const [xpAnims, setXpAnims] = useState<number[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    getCheckInsForMonth(user.uid, year, month)
      .then(dates => { setCheckedDates(dates); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, year, month]);

  const handleCheckIn = async () => {
    if (!user || !userProfile || checkingIn) return;
    if (userProfile.lastCheckIn === today) return;
    setCheckingIn(true);
    try {
      const { xpEarned } = await checkInToday(user.uid, userProfile);
      setCheckedDates(d => [...d, today]);
      await refreshProfile();
      const id = Date.now();
      setXpAnims(a => [...a, id]);
      setTimeout(() => setXpAnims(a => a.filter(x => x !== id)), 2000);
    } catch (e) { console.error(e); }
    finally { setCheckingIn(false); }
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const alreadyCheckedIn = userProfile?.lastCheckIn === today;

  return (
    <div className="space-y-6">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        Practice Tracker
      </motion.h2>

      {/* Streak */}
      <motion.div className="p-8 rounded-2xl flex items-center gap-8 relative overflow-hidden" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <motion.span className="text-5xl select-none" animate={{ scaleY: [1, 1.06, 0.97, 1.04, 1], scaleX: [1, 0.97, 1.03, 0.98, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>🔥</motion.span>
        <div>
          <div className="flex items-end gap-2">
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3.5rem", color: "#2C2B29", fontWeight: 300, lineHeight: 1 }}>{userProfile?.streakCount ?? 0}</span>
            <span className="text-sm pb-2" style={{ color: "#7A7771" }}>day streak</span>
          </div>
          <p className="text-sm" style={{ color: "#7A7771" }}>
            {(userProfile?.streakCount ?? 0) === 0 ? "Start your streak today!" : "Keep going. You're building something real."}
          </p>
        </div>
        <div className="ml-auto relative">
          <AnimatePresence>
            {xpAnims.map(id => (
              <motion.div key={id} className="absolute right-0 -top-2 text-sm font-medium pointer-events-none" style={{ color: "#5C6B57" }} initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 1, 0], y: -40 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
                +10 XP ✦
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            onClick={handleCheckIn}
            disabled={alreadyCheckedIn || checkingIn}
            className="px-5 py-3 rounded-xl text-sm tracking-widest uppercase"
            style={{
              background: alreadyCheckedIn ? "rgba(92,107,87,0.1)" : "#5C6B57",
              color: alreadyCheckedIn ? "#5C6B57" : "#F6F4EF",
              border: alreadyCheckedIn ? "1px solid rgba(92,107,87,0.3)" : "none",
            }}
            whileHover={!alreadyCheckedIn ? { background: "#4A5645", boxShadow: "0 6px 20px rgba(92,107,87,0.25)" } : {}}
            whileTap={!alreadyCheckedIn ? { scale: 0.97 } : {}}
          >
            {checkingIn ? "Checking in…" : alreadyCheckedIn ? "✓ Done Today" : "Check In"}
          </motion.button>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>
            {now.toLocaleString("default", { month: "long" })} {year}
          </p>
          <p className="text-xs" style={{ color: "#7A7771" }}>{checkedDates.length} days practiced</p>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => <div key={i} className="text-center text-xs pb-2" style={{ color: "#7A7771" }}>{d}</div>)}
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor: "#5C6B57" }} />
          </div>
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) => {
                if (day === null) return <div key={di} />;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const done = checkedDates.includes(dateStr);
                const isToday = dateStr === today;
                return (
                  <motion.div key={di} className="aspect-square rounded-lg flex items-center justify-center text-xs" style={{ background: done ? "#5C6B57" : isToday ? "rgba(92,107,87,0.15)" : "#E8E1D6", color: done ? "#F6F4EF" : isToday ? "#5C6B57" : "#7A7771", border: isToday ? "1.5px solid #5C6B57" : "none", fontWeight: isToday ? 600 : 400 }} whileHover={{ scale: 1.1 }}>
                    {day}
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </motion.div>

      {/* XP bar — correct per-level thresholds */}
      {(() => {
        const xp = userProfile?.xp ?? 0;
        const LEVELS = [
          { name: "Beginner",     min: 0,    max: 300  },
          { name: "Seeker",       min: 300,  max: 1000 },
          { name: "Practitioner", min: 1000, max: 2500 },
          { name: "Embodied",     min: 2500, max: 5000 },
          { name: "Integrated",   min: 5000, max: 5000 },
        ];
        const curr = LEVELS.find(l => xp < l.max) ?? LEVELS[LEVELS.length - 1];
        const isMax = curr.name === "Integrated";
        const pct = isMax ? 100 : Math.round(((xp - curr.min) / (curr.max - curr.min)) * 100);
        const nextName = LEVELS[LEVELS.indexOf(curr) + 1]?.name;
        return (
          <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>Total XP</p>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#2C2B29" }}>{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "#E8E1D6" }}>
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #5C6B57, #7A8C74)" }} initial={{ width: "0%" }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }} />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: "#7A7771" }}>
              <span>{curr.name}</span>
              {isMax ? <span>Maximum level ✦</span> : <span>{(curr.max - xp).toLocaleString()} XP to {nextName}</span>}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
