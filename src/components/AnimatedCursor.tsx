"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function AnimatedCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const hx = useSpring(mx, { stiffness: 80, damping: 18 });
  const hy = useSpring(my, { stiffness: 80, damping: 18 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setVisible(true);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const enter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [data-hover]")) setHovering(true);
    };
    const leave = () => setHovering(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseover", enter);
    window.addEventListener("mouseout", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseover", enter);
      window.removeEventListener("mouseout", leave);
    };
  }, [mx, my]);

  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      {/* Dot */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{ x: mx, y: my, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: clicking ? 0.5 : hovering ? 1.8 : 1, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="rounded-full transition-all duration-200"
          style={{
            width: hovering ? "10px" : "6px",
            height: hovering ? "10px" : "6px",
            background: "#5C6B57",
          }}
        />
      </motion.div>

      {/* Halo */}
      <motion.div
        ref={haloRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998]"
        style={{ x: hx, y: hy, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: clicking ? 0.8 : hovering ? 1.4 : 1, opacity: visible ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="rounded-full border transition-all duration-300"
          style={{
            width: hovering ? "48px" : "36px",
            height: hovering ? "48px" : "36px",
            borderColor: "#5C6B57",
          }}
        />
      </motion.div>
    </>
  );
}
