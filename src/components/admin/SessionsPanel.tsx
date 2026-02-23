"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllBookings, updateBookingStatus } from "@/lib/firestore";
import type { Booking } from "@/types";

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  confirmed:  { bg: "rgba(122,140,116,0.15)", color: "#7A8C74",  border: "rgba(122,140,116,0.3)" },
  completed:  { bg: "rgba(246,244,239,0.06)", color: "rgba(246,244,239,0.5)", border: "rgba(255,255,255,0.1)" },
  cancelled:  { bg: "rgba(192,64,64,0.12)",   color: "#c04040",  border: "rgba(192,64,64,0.25)" },
  pending:    { bg: "rgba(200,160,80,0.12)",   color: "#c8a050",  border: "rgba(200,160,80,0.25)" },
};

type FilterStatus = "all" | Booking["status"];

export function SessionsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllBookings()
      .then(b => { setBookings(b); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: Booking["status"]) => {
    setSaving(id);
    await updateBookingStatus(id, status).catch(() => {});
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    setSaving(null);
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch =
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.mentorName?.toLowerCase().includes(search.toLowerCase()) ||
      b.date?.includes(search);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    pending:   bookings.filter(b => b.status === "pending").length,
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(b => b.status === "confirmed" && b.date >= today).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          Sessions
        </motion.h2>
        <motion.span className="text-sm" style={{ color: "rgba(246,244,239,0.4)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {upcoming} upcoming
        </motion.span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all },
          { label: "Confirmed", value: counts.confirmed },
          { label: "Completed", value: counts.completed },
          { label: "Cancelled", value: counts.cancelled },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="p-4 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#F6F4EF", fontWeight: 300 }}>{s.value}</span>
            <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.4)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "confirmed", "completed", "cancelled", "pending"] as FilterStatus[]).map(f => (
          <motion.button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full"
            animate={{
              background: filter === f ? "rgba(122,140,116,0.25)" : "rgba(255,255,255,0.05)",
              color: filter === f ? "#7A8C74" : "rgba(246,244,239,0.4)",
              border: `1px solid ${filter === f ? "rgba(122,140,116,0.4)" : "rgba(255,255,255,0.07)"}`,
            }}
            whileHover={{ background: "rgba(122,140,116,0.15)" }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && counts[f] > 0 && <span className="ml-1.5 opacity-60">{counts[f]}</span>}
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by user, mentor, or date…"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "rgba(246,244,239,0.4)" }}>No sessions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b, i) => {
            const st = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
            const isSaving = saving === b.id;
            const isPast = b.date < today;
            return (
              <motion.div
                key={b.id}
                className="p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", opacity: isPast && b.status === "confirmed" ? 0.7 : 1 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74" }}>
                    {b.userName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm" style={{ color: "#F6F4EF" }}>{b.userName}</span>
                      <span className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>with</span>
                      <span className="text-sm" style={{ color: "rgba(246,244,239,0.8)" }}>{b.mentorName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>{b.date} · {b.time}</p>
                      {b.programId && <span className="text-xs" style={{ color: "rgba(246,244,239,0.3)" }}>{b.programId}d program</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {b.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {b.status === "confirmed" && (
                      <>
                        <motion.button
                          onClick={() => handleStatusChange(b.id, "completed")}
                          disabled={isSaving}
                          className="text-xs px-2.5 py-1.5 rounded-lg"
                          style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.3)" }}
                          whileHover={{ background: "rgba(122,140,116,0.25)" }}
                        >
                          {isSaving ? "…" : "Complete"}
                        </motion.button>
                        <motion.button
                          onClick={() => handleStatusChange(b.id, "cancelled")}
                          disabled={isSaving}
                          className="text-xs px-2.5 py-1.5 rounded-lg"
                          style={{ background: "rgba(192,64,64,0.1)", color: "#c04040", border: "1px solid rgba(192,64,64,0.2)" }}
                          whileHover={{ background: "rgba(192,64,64,0.2)" }}
                        >
                          Cancel
                        </motion.button>
                      </>
                    )}
                    {b.status === "cancelled" && (
                      <motion.button
                        onClick={() => handleStatusChange(b.id, "confirmed")}
                        disabled={isSaving}
                        className="text-xs px-2.5 py-1.5 rounded-lg"
                        style={{ background: "rgba(122,140,116,0.1)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.2)" }}
                        whileHover={{ background: "rgba(122,140,116,0.2)" }}
                      >
                        Restore
                      </motion.button>
                    )}
                    {b.meetLink && b.status === "confirmed" && (
                      <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                        <motion.button
                          className="text-xs px-2.5 py-1.5 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                          whileHover={{ background: "rgba(255,255,255,0.1)" }}
                        >
                          Join
                        </motion.button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
