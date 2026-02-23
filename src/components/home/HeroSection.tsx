"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height: "100svh", background: "#F6F4EF" }}
    >
      {/* Ambient background blobs */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ y }}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(92,107,87,0.12) 0%, transparent 70%)",
            top: "-200px", left: "-200px",
          }}
        />
        <div
          className="absolute rounded-full blur-[100px]"
          style={{
            width: "400px", height: "400px",
            background: "radial-gradient(circle, rgba(92,107,87,0.08) 0%, transparent 70%)",
            top: "100px", right: "-150px",
          }}
        />
      </motion.div>

      {/* Floating abstract lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: "1px",
              height: `${80 + i * 30}px`,
              background: "linear-gradient(to bottom, transparent, rgba(92,107,87,0.18), transparent)",
              left: `${15 + i * 18}%`,
              top: `${20 + i * 8}%`,
            }}
            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
          />
        ))}
      </motion.div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-3xl"
        style={{ y, opacity }}
      >
        {/* Eyebrow */}
        <motion.p
          className="text-xs tracking-[0.3em] uppercase mb-8"
          style={{ color: "#5C6B57" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Awareness · Stillness · Mastery
        </motion.p>

        {/* Main headline */}
        <motion.h1
          className="leading-[1.0] tracking-[0.06em] mb-6 uppercase"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(4.5rem, 14vw, 11rem)",
            fontWeight: 300,
            color: "#2C2B29",
            letterSpacing: "0.12em",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Atmava
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-base leading-relaxed max-w-md mx-auto mb-12"
          style={{ color: "#7A7771", fontWeight: 300, fontStyle: "italic" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Still the mind. Master the self. A guided journey inward — 30, 60, or 90 days of sacred practice and live mentorship.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85 }}
        >
          <Link href="/programs">
            <motion.button
              className="relative px-9 py-4 text-sm tracking-[0.18em] uppercase rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #5C6B57",
                color: "#5C6B57",
                background: "transparent",
                letterSpacing: "0.15em",
              }}
              whileHover={{
                borderColor: "#5C6B57",
                color: "#F6F4EF",
                backgroundColor: "#5C6B57",
                boxShadow: "0 0 28px rgba(92, 107, 87, 0.22)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3 }}
            >
              Begin Your Journey
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{ opacity }}
      >
        <motion.span
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: "#7A7771" }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          Scroll
        </motion.span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={14} style={{ color: "#7A7771" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
