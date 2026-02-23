"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPrograms, upsertProgram } from "@/lib/firestore";
import type { Program } from "@/types";

const EMPTY_PROGRAM: Omit<Program, "id" | "enrolledCount"> = {
  title: "",
  duration: 30,
  description: "",
  price: 0,
  isActive: true,
  isFree: false,
  features: [],
};

export function ProgramsPanel() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    getPrograms()
      .then(p => { setPrograms(p.sort((a, b) => Number(a.id) - Number(b.id))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleEdit = (p: Program) => {
    setEditing({ ...p, features: [...p.features] });
    setFeatureInput("");
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertProgram(editing);
      setPrograms(ps => ps.map(p => p.id === editing.id ? editing : p));
      setEditing(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleToggleActive = async (p: Program) => {
    const updated = { ...p, isActive: !p.isActive };
    await upsertProgram(updated).catch(() => {});
    setPrograms(ps => ps.map(x => x.id === p.id ? updated : x));
  };

  const addFeature = () => {
    if (!editing || !featureInput.trim()) return;
    setEditing({ ...editing, features: [...editing.features, featureInput.trim()] });
    setFeatureInput("");
  };

  const removeFeature = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, features: editing.features.filter((_, idx) => idx !== i) });
  };

  const DURATION_LABELS: Record<string, string> = { "30": "Foundation", "60": "Deepening", "90": "Inner Mastery" };

  return (
    <div className="space-y-5">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        Programs
      </motion.h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#7A8C74" }} />
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((p, i) => (
            <motion.div
              key={p.id}
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#F6F4EF", fontWeight: 300 }}>{p.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.isActive ? "rgba(122,140,116,0.15)" : "rgba(255,255,255,0.05)", color: p.isActive ? "#7A8C74" : "rgba(246,244,239,0.3)", border: `1px solid ${p.isActive ? "rgba(122,140,116,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                    {p.isFree && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(192,64,64,0.15)", color: "#c04040", border: "1px solid rgba(192,64,64,0.3)" }}>Free</span>}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "rgba(246,244,239,0.5)" }}>{p.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.features.map((f, fi) => (
                      <span key={fi} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.6)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>
                    <span>{p.duration} days</span>
                    <span>${p.price}</span>
                    <span>{p.enrolledCount ?? 0} enrolled</span>
                    <span className="text-xs" style={{ color: "#7A8C74" }}>{DURATION_LABELS[p.id] ?? ""}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    onClick={() => handleToggleActive(p)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                    whileHover={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </motion.button>
                  <motion.button
                    onClick={() => handleEdit(p)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(122,140,116,0.15)", color: "#7A8C74", border: "1px solid rgba(122,140,116,0.3)" }}
                    whileHover={{ background: "rgba(122,140,116,0.25)" }}
                  >
                    Edit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
          >
            <motion.div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6 space-y-5"
              style={{ background: "#1E1D1B", border: "1px solid rgba(255,255,255,0.1)" }}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
            >
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#F6F4EF", fontWeight: 300 }}>Edit Program</h3>
                <button onClick={() => setEditing(null)} style={{ color: "rgba(246,244,239,0.4)" }}>✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#7A8C74" }}>Title</label>
                  <input
                    value={editing.title}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
                  />
                </div>

                <div>
                  <label className="text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#7A8C74" }}>Description</label>
                  <textarea
                    value={editing.description}
                    onChange={e => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#7A8C74" }}>Price ($)</label>
                    <input
                      type="number"
                      value={editing.price}
                      onChange={e => setEditing({ ...editing, price: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#7A8C74" }}>Duration (days)</label>
                    <input
                      type="number"
                      value={editing.duration}
                      onChange={e => setEditing({ ...editing, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4EF" }}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "rgba(246,244,239,0.7)" }}>Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.isFree} onChange={e => setEditing({ ...editing, isFree: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "rgba(246,244,239,0.7)" }}>Free</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#7A8C74" }}>Features</label>
                  <div className="space-y-1.5 mb-2">
                    {editing.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <span className="flex-1 text-sm" style={{ color: "rgba(246,244,239,0.7)" }}>{f}</span>
                        <button onClick={() => removeFeature(i)} className="text-xs" style={{ color: "rgba(246,244,239,0.3)" }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                      placeholder="Add feature…"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#F6F4EF" }}
                    />
                    <motion.button onClick={addFeature} className="px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(122,140,116,0.2)", color: "#7A8C74" }} whileHover={{ background: "rgba(122,140,116,0.3)" }}>
                      Add
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm tracking-widest uppercase"
                  style={{ background: "#7A8C74", color: "#F6F4EF" }}
                  whileHover={{ background: "#6a7c64" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </motion.button>
                <motion.button onClick={() => setEditing(null)} className="px-5 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(246,244,239,0.5)" }} whileHover={{ background: "rgba(255,255,255,0.1)" }}>
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
