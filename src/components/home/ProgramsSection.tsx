"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getPrograms } from "@/lib/firestore";
import type { Program } from "@/types";

// Fallback static data in case Firestore is empty / not yet seeded
const FALLBACK_PROGRAMS: Program[] = [
  {
    id: "30",
    title: "Foundation",
    duration: 30,
    description:
      "Ground yourself in daily practice. Learn to observe the mind, establish stillness rituals, and build an unshakeable base for growth.",
    price: 149,
    isActive: true,
    isFree: false,
    features: ["30 guided audio practices", "Weekly live sessions", "Daily journaling prompts", "XP & streak tracking", "Community access"],
    enrolledCount: 0,
  },
  {
    id: "60",
    title: "Deepening",
    duration: 60,
    description:
      "Move beyond the surface. Dissolve conditioning, integrate shadow work, and cultivate a living relationship with awareness.",
    price: 279,
    isActive: true,
    isFree: false,
    features: ["60 practices + advanced sessions", "Bi-weekly 1:1 mentorship", "Shadow work framework", "Somatic practices", "XP double gains"],
    enrolledCount: 0,
  },
  {
    id: "90",
    title: "Inner Mastery",
    duration: 90,
    description:
      "The complete Atmava immersion. Three months of structured transformation across all layers.",
    price: 449,
    isActive: true,
    isFree: false,
    features: ["90 premium practices", "Weekly 1:1 mentor sessions", "Full resource library", "Lifetime community access", "Inner Mastery certification"],
    enrolledCount: 0,
  },
];

const SUBTITLES: Record<string, string> = {
  "30": "Begin the return",
  "60": "Go further within",
  "90": "Embody the stillness",
};

function ProgramCard({ prog, i, featured }: { prog: Program; i: number; featured: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        border: featured ? "1px solid rgba(92,107,87,0.4)" : "1px solid #D4CCBF",
        background: featured ? "rgba(92,107,87,0.04)" : "rgba(246,244,239,0.7)",
        backdropFilter: "blur(12px)",
      }}
      whileHover={{
        y: -6,
        boxShadow: featured
          ? "0 20px 48px rgba(92,107,87,0.18)"
          : "0 12px 32px rgba(44,43,41,0.08)",
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `radial-gradient(circle at 50% 0%, ${featured ? "rgba(92,107,87,0.12)" : "rgba(212,204,191,0.3)"} 0%, transparent 60%)`,
        }}
      />

      <div className="p-8 relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="text-xs tracking-[0.22em] uppercase block mb-2" style={{ color: featured ? "#5C6B57" : "#7A7771" }}>
              {prog.duration} Days
            </span>
            <h3 className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }}>
              {prog.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: "#7A7771", fontStyle: "italic" }}>
              {SUBTITLES[prog.id] ?? ""}
            </p>
          </div>
          {featured && (
            <motion.span
              className="text-xs tracking-widest px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(92,107,87,0.1)", color: "#5C6B57", border: "1px solid rgba(92,107,87,0.2)" }}
              animate={{ boxShadow: ["0 0 0 0 rgba(92,107,87,0.15)", "0 0 12px 4px rgba(92,107,87,0.08)", "0 0 0 0 rgba(92,107,87,0.15)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Popular
            </motion.span>
          )}
        </div>

        {/* Price */}
        <div className="mb-5">
          {prog.isFree ? (
            <span className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5C6B57", fontWeight: 300 }}>Free</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 300 }}>
                ${prog.price}
              </span>
              <span className="text-sm" style={{ color: "#7A7771" }}>/ program</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-5" style={{ background: featured ? "rgba(92,107,87,0.15)" : "#E8E1D6" }} />

        {/* Description */}
        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "#7A7771", fontWeight: 300 }}>
          {prog.description}
        </p>

        {/* Expandable features */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 mb-5 pt-1">
                {prog.features.map((f, fi) => (
                  <motion.div
                    key={fi}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fi * 0.07 }}
                  >
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#5C6B57" }} />
                    <span className="text-sm" style={{ color: "#7A7771" }}>{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enrollment count */}
        {(prog.enrolledCount ?? 0) > 0 && (
          <p className="text-xs mb-4" style={{ color: featured ? "rgba(92,107,87,0.7)" : "#7A7771" }}>
            {prog.enrolledCount} people enrolled
          </p>
        )}

        {/* CTA row */}
        <div className="flex items-center justify-between mt-auto">
          <motion.button
            className="text-xs tracking-widest uppercase"
            style={{ color: "#7A7771" }}
            onClick={() => setExpanded(!expanded)}
            whileHover={{ color: "#2C2B29" }}
          >
            {expanded ? "Less" : "What's included"}
          </motion.button>

          <Link href={`/auth/signup?program=${prog.id}`}>
            <motion.button
              className="px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase"
              style={{
                border: `1px solid ${featured ? "#5C6B57" : "#D4CCBF"}`,
                color: featured ? "#5C6B57" : "#7A7771",
                background: "transparent",
              }}
              whileHover={{
                background: featured ? "#5C6B57" : "#2C2B29",
                color: "#F6F4EF",
                borderColor: featured ? "#5C6B57" : "#2C2B29",
                boxShadow: "0 4px 16px rgba(92,107,87,0.15)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              Choose Path
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function ProgramsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms()
      .then((data) => {
        // Filter only active, sort by duration
        const active = data.filter(p => p.isActive).sort((a, b) => Number(a.id) - Number(b.id));
        setPrograms(active.length >= 3 ? active : FALLBACK_PROGRAMS);
      })
      .catch(() => {
        // Firestore unavailable → use fallback (public homepage shouldn't break)
        setPrograms(FALLBACK_PROGRAMS);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayPrograms = programs.length > 0 ? programs : FALLBACK_PROGRAMS;

  return (
    <section className="py-32 px-6" style={{ background: "#F6F4EF" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16" ref={ref}>
          <motion.p
            className="text-xs tracking-[0.28em] uppercase mb-4"
            style={{ color: "#5C6B57" }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
          >
            Programs
          </motion.p>
          <motion.h2
            className="leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 300,
              color: "#2C2B29",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Choose your path
          </motion.h2>
          <motion.p
            className="text-sm mt-4 max-w-sm mx-auto"
            style={{ color: "#7A7771", fontWeight: 300 }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 }}
          >
            Three depths of transformation. One destination — yourself.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-7 h-7 rounded-full border-2 border-t-transparent"
              style={{ borderColor: "#5C6B57" }}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayPrograms.map((p, i) => (
              <ProgramCard key={p.id} prog={p} i={i} featured={p.id === "60"} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
