"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const ALL_BADGES = [
  { id: "7-Day Flame", icon: "🔥", name: "7-Day Flame", desc: "7-day streak", condition: (xp: number, streak: number) => streak >= 7 },
  { id: "Fortnight Seeker", icon: "◈", name: "Fortnight Seeker", desc: "14-day streak", condition: (xp: number, streak: number) => streak >= 14 },
  { id: "30-Day Master", icon: "◉", name: "30-Day Master", desc: "30-day streak", condition: (xp: number, streak: number) => streak >= 30 },
  { id: "First Breath", icon: "◎", name: "First Breath", desc: "First check-in", condition: (xp: number, streak: number) => streak >= 1 },
  { id: "Practitioner", icon: "⬡", name: "Practitioner", desc: "1,000 XP earned", condition: (xp: number) => xp >= 1000 },
  { id: "Inner Master", icon: "✵", name: "Inner Master", desc: "2,500 XP earned", condition: (xp: number) => xp >= 2500 },
];

const LEVELS = [
  { name: "Beginner", min: 0, max: 300 },
  { name: "Seeker", min: 300, max: 1000 },
  { name: "Practitioner", min: 1000, max: 2500 },
  { name: "Embodied", min: 2500, max: 5000 },
  { name: "Integrated", min: 5000, max: 10000 },
];

export function Rewards() {
  const { userProfile } = useAuth();
  const xp = userProfile?.xp ?? 0;
  const streak = userProfile?.streakCount ?? 0;
  const earnedBadgeIds = userProfile?.badges ?? [];

  const currentLevel = LEVELS.find(l => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const levelPct = nextLevel
    ? ((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return (
    <div className="space-y-6">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        Rewards
      </motion.h2>

      {/* Level bar */}
      <motion.div className="p-8 rounded-2xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#5C6B57" }}>Level</p>
            <div className="flex items-baseline gap-2">
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", color: "#2C2B29", fontWeight: 300 }}>{LEVELS.indexOf(currentLevel) + 1}</span>
              <span className="text-sm" style={{ color: "#7A7771" }}>{currentLevel.name}</span>
            </div>
          </div>
          <div className="text-right">
            {nextLevel && <p className="text-xs" style={{ color: "#7A7771" }}>Next: {nextLevel.name}</p>}
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#2C2B29" }}>
              {xp.toLocaleString()} XP
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(44,43,41,0.1)" }}>
            <motion.div className="h-full rounded-full relative" style={{ background: "linear-gradient(90deg, #5C6B57, #7A8C74)" }} initial={{ width: "0%" }} animate={{ width: `${levelPct}%` }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}>
              <motion.div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: "#5C6B57", border: "2px solid #E8E1D6" }} animate={{ boxShadow: ["0 0 0 0 rgba(92,107,87,0.4)", "0 0 8px 4px rgba(92,107,87,0)", "0 0 0 0 rgba(92,107,87,0.4)"] }} transition={{ duration: 2.5, repeat: Infinity }} />
            </motion.div>
          </div>
        </div>
        {nextLevel && (
          <p className="text-xs mt-2" style={{ color: "#7A7771" }}>{(nextLevel.min - xp).toLocaleString()} XP to {nextLevel.name}</p>
        )}
      </motion.div>

      {/* Level path */}
      <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Level Path</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {LEVELS.map((l, i) => {
            const done = xp >= l.min;
            const active = l.name === currentLevel.name;
            return (
              <div key={l.name} className="flex items-center gap-2 flex-shrink-0">
                <motion.div className="flex flex-col items-center gap-1.5" whileHover={{ scale: 1.05 }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs" style={{ background: done ? "#5C6B57" : "#E8E1D6", color: done ? "#F6F4EF" : "#7A7771", border: active ? "2px solid #5C6B57" : "none", boxShadow: active ? "0 0 12px rgba(92,107,87,0.3)" : "none" }}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-center" style={{ color: done ? "#2C2B29" : "#7A7771", width: "60px" }}>{l.name}</span>
                </motion.div>
                {i < LEVELS.length - 1 && <div className="h-px w-6 flex-shrink-0" style={{ background: xp >= LEVELS[i + 1].min ? "#5C6B57" : "#D4CCBF" }} />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#5C6B57" }}>Badges</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {ALL_BADGES.map((badge, i) => {
            const unlocked = earnedBadgeIds.includes(badge.id) || badge.condition(xp, streak);
            return (
              <motion.div key={badge.id} className="flex flex-col items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.07, type: "spring", stiffness: 200 }}>
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl relative overflow-hidden"
                  style={{ background: unlocked ? "rgba(92,107,87,0.1)" : "rgba(212,204,191,0.4)", border: `1px solid ${unlocked ? "rgba(92,107,87,0.3)" : "#D4CCBF"}`, filter: unlocked ? "none" : "grayscale(1) opacity(0.5)" }}
                  whileHover={unlocked ? { scale: 1.08, boxShadow: "0 4px 16px rgba(92,107,87,0.2)" } : {}}
                >
                  {badge.icon}
                  {unlocked && (
                    <motion.div className="absolute inset-0 pointer-events-none" animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }} style={{ background: "radial-gradient(circle, rgba(92,107,87,0.3) 0%, transparent 70%)" }} />
                  )}
                </motion.div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: unlocked ? "#2C2B29" : "#7A7771" }}>{badge.name}</p>
                  <p style={{ color: "#7A7771", fontSize: "0.65rem" }}>{badge.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
