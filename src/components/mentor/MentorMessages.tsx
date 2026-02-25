"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMentorStudents,
  getOrCreateConversation,
  subscribeMessages,
  sendMessage,
} from "@/lib/firestore";
import type { UserProfile, Message } from "@/types";

export function MentorMessages() {
  const { user, userProfile } = useAuth();
  const [students, setStudents]               = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [convId, setConvId]                   = useState<string | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingConv, setLoadingConv]         = useState(false);
  const [sending, setSending]                 = useState(false);
  const [isMobile, setIsMobile]               = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load students
  useEffect(() => {
    if (!user) return;
    getMentorStudents(user.uid)
      .then(s => { setStudents(s); setLoadingStudents(false); })
      .catch(() => setLoadingStudents(false));
  }, [user]);

  // Load/create conversation when student is selected
  useEffect(() => {
    if (!user || !selectedStudent) { setConvId(null); setMessages([]); return; }
    setLoadingConv(true);
    const names: Record<string, string> = {
      [user.uid]: userProfile?.name ?? "Mentor",
      [selectedStudent.uid]: selectedStudent.name,
    };
    getOrCreateConversation(selectedStudent.uid, user.uid, names)
      .then(id => { setConvId(id); setLoadingConv(false); })
      .catch(() => setLoadingConv(false));
  }, [user, selectedStudent, userProfile]);

  // Subscribe to messages
  useEffect(() => {
    if (!convId) return;
    const unsub = subscribeMessages(convId, setMessages);
    return () => unsub();
  }, [convId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !convId || !userProfile) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await sendMessage(convId, user.uid, userProfile.name, text).catch(() => {});
    setSending(false);
  };

  if (loadingStudents) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#7A8C74" }}
        />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-5">
        <motion.h2
          className="text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Messages
        </motion.h2>
        <div
          className="p-8 md:p-12 rounded-2xl text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "rgba(246,244,239,0.6)", fontWeight: 300 }}>
            No students assigned yet
          </p>
          <p className="text-sm mt-2" style={{ color: "rgba(246,244,239,0.3)" }}>
            You'll be able to message students once they're assigned to you.
          </p>
        </div>
      </div>
    );
  }

  // On mobile: show either list OR chat (not both side by side)
  const showList = !isMobile || !selectedStudent;
  const showChat = !isMobile || !!selectedStudent;

  return (
    <div className="space-y-5">
      <motion.h2
        className="text-2xl"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F6F4EF", fontWeight: 300 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Messages
      </motion.h2>

      {/* ── Two-pane layout ──────────────────────────────────────────────────── */}
      <div
        className="flex gap-4"
        style={{
          height: isMobile ? "calc(100vh - 210px)" : "560px",
          minHeight: "360px",
        }}
      >
        {/* Student list */}
        {showList && (
          <motion.div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: isMobile ? "100%" : "200px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs tracking-widest uppercase" style={{ color: "#7A8C74" }}>Students</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {students.map((s, i) => {
                const isSelected = selectedStudent?.uid === s.uid;
                return (
                  <motion.button
                    key={s.uid}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: isSelected ? "rgba(122,140,116,0.15)" : "transparent" }}
                    onClick={() => setSelectedStudent(s)}
                    whileHover={{ background: "rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: isSelected ? "#7A8C74" : "rgba(122,140,116,0.2)",
                        color: isSelected ? "#F6F4EF" : "#7A8C74",
                      }}
                    >
                      {s.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: isSelected ? "#F6F4EF" : "rgba(246,244,239,0.6)" }}>
                        {s.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "rgba(246,244,239,0.3)" }}>
                        {s.programId ? `${s.programId}d` : "No program"}
                      </p>
                    </div>
                    {/* Arrow hint on mobile */}
                    {isMobile && (
                      <ChevronLeft
                        size={14}
                        style={{ color: "rgba(246,244,239,0.3)", marginLeft: "auto", transform: "rotate(180deg)" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Chat pane */}
        {showChat && (
          <motion.div
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {!selectedStudent ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "rgba(246,244,239,0.35)", fontWeight: 300 }}>
                    Select a student to begin
                  </p>
                </div>
              </div>
            ) : loadingConv ? (
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: "#7A8C74" }}
                />
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
                >
                  {/* Back button — mobile only */}
                  {isMobile && (
                    <motion.button
                      onClick={() => setSelectedStudent(null)}
                      className="p-1 rounded-lg mr-1 flex-shrink-0"
                      style={{ color: "#7A8C74" }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft size={20} />
                    </motion.button>
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: "#7A8C74", color: "#F6F4EF" }}
                  >
                    {selectedStudent.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#F6F4EF" }}>{selectedStudent.name}</p>
                    <p className="text-xs" style={{ color: "rgba(246,244,239,0.4)" }}>
                      Day {selectedStudent.currentDay ?? 1}/{selectedStudent.programId ?? "—"} · {selectedStudent.level ?? "Beginner"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center pt-8">
                      <p className="text-sm" style={{ color: "rgba(246,244,239,0.3)" }}>
                        No messages yet. Send the first one.
                      </p>
                    </div>
                  )}
                  <AnimatePresence>
                    {messages.map(msg => {
                      const isMe = msg.senderId === user?.uid;
                      return (
                        <motion.div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.35 }}
                        >
                          <div
                            className="max-w-[80%] md:max-w-[75%] px-4 py-3 text-sm leading-relaxed"
                            style={{
                              background: isMe ? "#7A8C74" : "rgba(255,255,255,0.08)",
                              color: isMe ? "#F6F4EF" : "rgba(246,244,239,0.85)",
                              borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              fontWeight: 300,
                            }}
                          >
                            {msg.text}
                            <div className="text-xs mt-1 opacity-50" style={{ textAlign: isMe ? "right" : "left" }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#F6F4EF",
                      }}
                      placeholder={`Message ${selectedStudent.name}…`}
                      disabled={sending}
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: input.trim() ? "#7A8C74" : "rgba(122,140,116,0.2)" }}
                      whileHover={input.trim() ? { background: "#6a7c64", scale: 1.05 } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send size={14} style={{ color: "#F6F4EF" }} />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
