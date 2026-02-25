"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPaymentsAdmin, getEnrollmentsAdmin, deactivateEnrollment } from "@/lib/firestore";
import type { Payment, Enrollment } from "@/types";

type Tab = "payments" | "enrollments";

function statusColor(status: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    paid:    { bg: "rgba(122,140,116,0.12)", text: "#7A8C74",   border: "rgba(122,140,116,0.3)"  },
    created: { bg: "rgba(212,170,80,0.1)",   text: "#d4aa50",   border: "rgba(212,170,80,0.3)"   },
    failed:  { bg: "rgba(192,64,64,0.1)",    text: "#c04040",   border: "rgba(192,64,64,0.25)"   },
    active:  { bg: "rgba(122,140,116,0.12)", text: "#7A8C74",   border: "rgba(122,140,116,0.3)"  },
    expired: { bg: "rgba(255,255,255,0.05)", text: "rgba(246,244,239,0.35)", border: "rgba(255,255,255,0.08)" },
  };
  return map[status] ?? map.created;
}

function fmtAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export function PaymentsPanel() {
  const [tab, setTab]                   = useState<Tab>("payments");
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPaymentsAdmin(), getEnrollmentsAdmin()])
      .then(([p, e]) => { setPayments(p); setEnrollments(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Revenue stats ──────────────────────────────────────────────────────────
  const paidPayments   = payments.filter(p => p.status === "paid");
  const testRevenue    = paidPayments.filter(p => p.mode === "test").reduce((s, p) => s + p.amount, 0);
  const liveRevenue    = paidPayments.filter(p => p.mode === "live").reduce((s, p) => s + p.amount, 0);
  const totalRevenue   = testRevenue + liveRevenue;
  const activeEnrolls  = enrollments.filter(e => e.status === "active" && e.endDate > new Date().toISOString()).length;

  const handleDeactivate = async (enrollmentId: string) => {
    setDeactivating(enrollmentId);
    try {
      await deactivateEnrollment(enrollmentId);
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: "expired" } : e));
    } catch (e) { console.error(e); }
    setDeactivating(null);
  };

  return (
    <div className="space-y-6">
      <motion.h2
        className="text-2xl"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Payments & Enrollments
      </motion.h2>

      {/* Stats row */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {[
          { label: "Total Revenue",   val: fmtAmount(totalRevenue),    note: "all time" },
          { label: "Live Revenue",    val: fmtAmount(liveRevenue),     note: "production" },
          { label: "Test Revenue",    val: fmtAmount(testRevenue),     note: "dev mode" },
          { label: "Active Enrolls",  val: activeEnrolls.toString(),   note: "right now" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(246,244,239,0.4)" }}>{s.label}</p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}>{s.val}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.3)" }}>{s.note}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", width: "fit-content" }}>
        {(["payments", "enrollments"] as Tab[]).map(t => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-xs tracking-widest uppercase"
            animate={{
              background: tab === t ? "rgba(122,140,116,0.2)" : "transparent",
              color:      tab === t ? "#7A8C74"               : "rgba(246,244,239,0.4)",
            }}
          >
            {t === "payments" ? `Payments (${payments.length})` : `Enrollments (${enrollments.length})`}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* ── Payments tab ───────────────────────────────────────────── */}
          {tab === "payments" && (
            <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "rgba(246,244,239,0.35)" }}>No payments yet.</p>
              ) : (
                payments.map((p, i) => {
                  const sc = statusColor(p.status);
                  return (
                    <motion.div
                      key={p.id}
                      className="p-4 rounded-xl flex items-center gap-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      {/* Status pill */}
                      <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 capitalize" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {p.status}
                      </span>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "#F6F4EF" }}>
                          {p.userId.slice(0, 14)}…
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(246,244,239,0.4)" }}>
                          {p.razorpayOrderId}
                        </p>
                      </div>

                      {/* Program badge */}
                      <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.6)" }}>
                        {p.programId} days
                      </span>

                      {/* Mode badge */}
                      <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: p.mode === "live" ? "rgba(122,140,116,0.12)" : "rgba(212,170,80,0.08)", color: p.mode === "live" ? "#7A8C74" : "#d4aa50" }}>
                        {p.mode}
                      </span>

                      {/* Amount */}
                      <p className="text-sm flex-shrink-0" style={{ color: "#F6F4EF", fontFamily: "'Cormorant Garamond', serif" }}>
                        {fmtAmount(p.amount)}
                      </p>

                      {/* Date */}
                      <p className="text-xs flex-shrink-0" style={{ color: "rgba(246,244,239,0.35)" }}>
                        {fmtDate(p.createdAt)}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ── Enrollments tab ────────────────────────────────────────── */}
          {tab === "enrollments" && (
            <motion.div key="enrollments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {enrollments.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "rgba(246,244,239,0.35)" }}>No enrollments yet.</p>
              ) : (
                enrollments.map((e, i) => {
                  const sc     = statusColor(e.status);
                  const isActive = e.status === "active" && e.endDate > new Date().toISOString();
                  return (
                    <motion.div
                      key={e.id}
                      className="p-4 rounded-xl flex items-center gap-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 capitalize" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {isActive ? "active" : e.status}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "#F6F4EF" }}>
                          {e.userId.slice(0, 14)}…
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.4)" }}>
                          {fmtDate(e.startDate)} → {fmtDate(e.endDate)}
                        </p>
                      </div>

                      <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.6)" }}>
                        {e.programId} days
                      </span>

                      {isActive && (
                        <motion.button
                          onClick={() => handleDeactivate(e.id)}
                          disabled={deactivating === e.id}
                          className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{ background: "rgba(192,64,64,0.1)", color: "#c04040", border: "1px solid rgba(192,64,64,0.2)" }}
                          whileHover={{ background: "rgba(192,64,64,0.2)" }}
                        >
                          {deactivating === e.id ? "…" : "Deactivate"}
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
}
