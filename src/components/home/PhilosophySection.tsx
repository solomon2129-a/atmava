"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const lines = [
  "You are not the noise.",
  "You are the stillness beneath it.",
  "Atmava is a space for those who seek to remember",
  "what they've always known — that clarity is not found.",
  "It is returned to.",
];

export function PhilosophySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-32 px-6 relative overflow-hidden"
      style={{ background: "#E8E1D6" }}
    >
      {/* Floating divider */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ transformOrigin: "center", width: "1px", height: "80px", background: "#D4CCBF" }}
      />

      <div className="max-w-2xl mx-auto text-center pt-16">
        {/* Label */}
        <motion.p
          className="text-xs tracking-[0.28em] uppercase mb-16"
          style={{ color: "#5C6B57" }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Philosophy
        </motion.p>

        {/* Lines */}
        <div className="space-y-5">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              style={{
                fontFamily: i < 2 ? "'Cormorant Garamond', serif" : "Inter, sans-serif",
                fontSize: i < 2 ? "clamp(1.8rem, 4vw, 2.8rem)" : "clamp(1rem, 2vw, 1.15rem)",
                fontWeight: i < 2 ? 300 : 300,
                color: i < 2 ? "#2C2B29" : "#7A7771",
                lineHeight: i < 2 ? 1.25 : 1.75,
                fontStyle: i === 1 ? "italic" : "normal",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Divider dot */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: i === 1 ? "5px" : "3px", height: i === 1 ? "5px" : "3px", background: i === 1 ? "#5C6B57" : "#D4CCBF" }}
              animate={{ opacity: i === 1 ? [0.5, 1, 0.5] : 1 }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom divider */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
        style={{ transformOrigin: "center", width: "1px", height: "80px", background: "#D4CCBF" }}
      />
    </section>
  );
}
