"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateConversation, sendMessage, subscribeMessages } from "@/lib/firestore";
import type { Message } from "@/types";


export function Messages() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const mentorId = userProfile?.mentorId;
  const mentorName = userProfile?.mentorName ?? "Mentor";

  useEffect(() => {
    if (!user || !mentorId) { setLoading(false); return; }
    const names: Record<string, string> = {
      [user.uid]: userProfile?.name ?? "You",
      [mentorId]: mentorName,
    };
    getOrCreateConversation(user.uid, mentorId, names)
      .then(id => {
        setConvId(id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, mentorId, userProfile, mentorName]);

  useEffect(() => {
    if (!convId) return;
    const unsub = subscribeMessages(convId, setMessages);
    return () => unsub();
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !convId || !userProfile) return;
    const text = input.trim();
    setInput("");
    await sendMessage(convId, user.uid, userProfile.name, text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: "#5C6B57" }} />
      </div>
    );
  }

  if (!mentorId) {
    return (
      <div className="space-y-6">
        <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>Messages</motion.h2>
        <div className="p-6 md:p-12 rounded-2xl text-center" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#2C2B29" }}>No mentor assigned yet</p>
          <p className="mt-2 text-sm" style={{ color: "#7A7771" }}>You'll be connected with a mentor when you enroll in a program.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>Messages</motion.h2>
      <motion.div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF", height: "min(520px, calc(100vh - 220px))", minHeight: "360px" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #D4CCBF", background: "#E8E1D6" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "#5C6B57", color: "#F6F4EF" }}>
            {mentorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm" style={{ color: "#2C2B29" }}>{mentorName}</p>
            <motion.p className="text-xs" style={{ color: "#5C6B57" }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>Your Mentor</motion.p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center pt-10">
              <p className="text-sm" style={{ color: "#7A7771" }}>Begin the conversation with your mentor.</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id} className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="max-w-[75%] px-4 py-3 text-sm leading-relaxed" style={{
                  background: msg.senderId === user?.uid ? "#5C6B57" : "#E8E1D6",
                  color: msg.senderId === user?.uid ? "#F6F4EF" : "#2C2B29",
                  borderRadius: msg.senderId === user?.uid ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontWeight: 300,
                }}>
                  {msg.text}
                  <div className="text-xs mt-1 opacity-60" style={{ textAlign: msg.senderId === user?.uid ? "right" : "left" }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid #D4CCBF" }}>
          <div className="flex items-center gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} className="flex-1 px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF", color: "#2C2B29" }} placeholder="Write to your mentor…" />
            <motion.button onClick={send} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#5C6B57" }} whileHover={{ background: "#4A5645", scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Send size={15} style={{ color: "#F6F4EF" }} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
