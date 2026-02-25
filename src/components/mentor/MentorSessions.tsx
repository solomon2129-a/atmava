"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Copy, ExternalLink, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSessionsByMentor } from "@/lib/firestore";
import type { Session } from "@/types";

type Tab = "upcoming" | "past";

const PROGRAMS = [
  { id: "30", label: "30 Days — Foundation" },
  { id: "60", label: "60 Days — Deepening" },
  { id: "90", label: "90 Days — Inner Mastery" },
];

const EMPTY_FORM = {
  title: "",
  programId: "30",
  date: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "11:00",
  meetLink: "",
};

export function MentorSessions() {
  const { user, userProfile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>("upcoming");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getSessionsByMentor(user.uid)
      .then(s => {
        setSessions(s.sort((a, z) => a.date.localeCompare(z.date)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  const today    = new Date().toISOString().split("T")[0];
  const upcoming = sessions.filter(s => s.date >= today);
  const past     = sessions.filter(s => s.date <  today);
  const displayed = tab === "upcoming" ? upcoming : past;

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!user || !form.title || !form.date || !form.meetLink) {
      setFormError("Please fill in title, date, and meet link.");
      return;
    }
    setSaving(true); setFormError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/sessions/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ programId: form.programId, title: form.title, date: form.date, startTime: form.startTime, endTime: form.endTime, meetLink: form.meetLink }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create session");
      const { sessionId } = await res.json();
      const newSess: Session = {
        id: sessionId,
        programId: form.programId,
        mentorId: user.uid,
        mentorName: userProfile?.name ?? "Mentor",
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        meetLink: form.meetLink,
        createdAt: new Date().toISOString(),
      };
      setSessions(prev => [...prev, newSess].sort((a, z) => a.date.localeCompare(z.date)));
      setForm({ ...EMPTY_FORM });
      setCreating(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error creating session");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = async (id: string) => {
    if (!user || !form.title || !form.meetLink) {
      setFormError("Please fill in title and meet link.");
      return;
    }
    setSaving(true); setFormError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/sessions/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title, date: form.date, startTime: form.startTime, endTime: form.endTime, meetLink: form.meetLink }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update session");
      setSessions(prev =>
        prev.map(s => s.id === id
          ? { ...s, title: form.title, date: form.date, startTime: form.startTime, endTime: form.endTime, meetLink: form.meetLink }
          : s
        ).sort((a, z) => a.date.localeCompare(z.date))
      );
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error updating session");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/sessions/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {}
    setDeletingId(null);
  };

  const startEdit = (s: Session) => {
    setEditingId(s.id);
    setCreating(false);
    setForm({ title: s.title, programId: s.programId, date: s.date, startTime: s.startTime, endTime: s.endTime, meetLink: s.meetLink });
    setFormError("");
  };

  const copyLink = async (link: string, id: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  // ── Shared form fields JSX ────────────────────────────────────────────────
  const renderForm = (onSave: () => void, onCancel: () => void, submitLabel: string) => (
    <div className="p-4 md:p-5 rounded-2xl space-y-4" style={{ background: "rgba(122,140,116,0.07)", border: "1px solid rgba(122,140,116,0.2)" }}>
      {/* Title */}
      <div>
        <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>Session Title</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Week 1 — Breath Awareness"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
        />
      </div>

      {/* Program */}
      <div>
        <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>Program</label>
        <select
          value={form.programId}
          onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(40,38,36,0.95)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
        >
          {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>Start</label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>End</label>
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
          />
        </div>
      </div>

      {/* Meet link */}
      <div>
        <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: "rgba(246,244,239,0.45)" }}>Meet / Zoom Link</label>
        <input
          value={form.meetLink}
          onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
          placeholder="https://meet.google.com/…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#F6F4EF" }}
        />
      </div>

      {formError && <p className="text-xs" style={{ color: "#c04040" }}>{formError}</p>}

      <div className="flex gap-3 pt-1">
        <motion.button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-xs tracking-widest uppercase"
          style={{ background: "#7A8C74", color: "#F6F4EF", minHeight: "42px" }}
          whileHover={{ background: "#6a7c64" }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? "Saving…" : submitLabel}
        </motion.button>
        <motion.button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)", minHeight: "42px" }}
          whileHover={{ background: "rgba(255,255,255,0.1)" }}
        >
          Cancel
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          className="text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          My Sessions
        </motion.h2>
        <motion.button
          onClick={() => { setCreating(c => !c); setEditingId(null); setForm({ ...EMPTY_FORM }); setFormError(""); }}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase"
          style={{
            background: creating ? "rgba(255,255,255,0.06)" : "#7A8C74",
            color: creating ? "rgba(246,244,239,0.5)" : "#F6F4EF",
            minHeight: "42px",
          }}
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Plus size={13} />
          <span className="hidden sm:inline">{creating ? "Cancel" : "New Session"}</span>
          <span className="sm:hidden">{creating ? "✕" : "New"}</span>
        </motion.button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {renderForm(
              handleCreate,
              () => { setCreating(false); setFormError(""); setForm({ ...EMPTY_FORM }); },
              "Create Session"
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
        {(["upcoming", "past"] as Tab[]).map(t => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs tracking-widest uppercase"
            animate={{
              background: tab === t ? "rgba(122,140,116,0.2)" : "transparent",
              color: tab === t ? "#7A8C74" : "rgba(246,244,239,0.4)",
            }}
            whileHover={{ background: "rgba(122,140,116,0.1)" }}
          >
            {t} ({t === "upcoming" ? upcoming.length : past.length})
          </motion.button>
        ))}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : displayed.length === 0 ? (
        <motion.div
          className="p-12 rounded-2xl text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Calendar size={28} style={{ color: "rgba(246,244,239,0.2)", margin: "0 auto 12px" }} />
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "rgba(246,244,239,0.5)", fontWeight: 300 }}>
            {tab === "upcoming" ? "No upcoming sessions" : "No past sessions"}
          </p>
          {tab === "upcoming" && (
            <p className="text-xs mt-2" style={{ color: "rgba(246,244,239,0.3)" }}>
              Click "New Session" above to schedule one.
            </p>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {displayed.map((s, i) => {
            const isEditing = editingId === s.id;
            const isToday   = s.date === today;

            return (
              <motion.div
                key={s.id}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${isToday ? "rgba(122,140,116,0.4)" : "rgba(255,255,255,0.08)"}` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Card header */}
                <div
                  className="p-3 md:p-4"
                  style={{ background: isToday ? "rgba(122,140,116,0.08)" : "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium" style={{ color: "#F6F4EF" }}>{s.title}</p>
                        {isToday && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "rgba(122,140,116,0.2)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.3)" }}>
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>
                        {formatDate(s.date)} · {s.startTime}–{s.endTime}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(246,244,239,0.3)" }}>
                        {PROGRAMS.find(p => p.id === s.programId)?.label ?? s.programId}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button
                        onClick={() => copyLink(s.meetLink, s.id)}
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)" }}
                        title="Copy meet link"
                        whileHover={{ background: "rgba(255,255,255,0.12)" }}
                        whileTap={{ scale: 0.92 }}
                      >
                        {copied === s.id
                          ? <span style={{ fontSize: "10px", color: "#7A8C74" }}>✓</span>
                          : <Copy size={12} />}
                      </motion.button>

                      <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                        <motion.button
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)" }}
                          title="Open link"
                          whileHover={{ background: "rgba(255,255,255,0.12)" }}
                          whileTap={{ scale: 0.92 }}
                        >
                          <ExternalLink size={12} />
                        </motion.button>
                      </a>

                      <motion.button
                        onClick={() => {
                          if (isEditing) { setEditingId(null); setForm({ ...EMPTY_FORM }); }
                          else startEdit(s);
                        }}
                        className="p-2 rounded-lg"
                        style={{
                          background: isEditing ? "rgba(122,140,116,0.2)" : "rgba(255,255,255,0.06)",
                          color: isEditing ? "#7A8C74" : "rgba(246,244,239,0.5)",
                        }}
                        title="Edit"
                        whileHover={{ background: "rgba(255,255,255,0.12)" }}
                        whileTap={{ scale: 0.92 }}
                      >
                        <Edit2 size={12} />
                      </motion.button>

                      <motion.button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(192,64,64,0.1)", color: "#c04040" }}
                        title="Delete"
                        whileHover={{ background: "rgba(192,64,64,0.2)" }}
                        whileTap={{ scale: 0.92 }}
                      >
                        {deletingId === s.id
                          ? <span style={{ fontSize: "10px" }}>…</span>
                          : <Trash2 size={12} />}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      key="edit-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="p-3 md:p-4">
                        {renderForm(
                          () => handleEdit(s.id),
                          () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setFormError(""); },
                          "Save Changes"
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
