"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Check, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings, updateBookingStatus, getAllMentors } from "@/lib/firestore";
import type { Booking, UserProfile } from "@/types";

const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

function getNext14Days(): string[] {
  const days: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
      days.push(d.toISOString().split("T")[0]);
    }
  }
  return days;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function BookingPanel() {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMentors, setFetchingMentors] = useState(true);
  const [success, setSuccess] = useState(false);
  const [newBooking, setNewBooking] = useState<Booking | null>(null);

  const availableDays = getNext14Days();

  useEffect(() => {
    getAllMentors().then(m => { setMentors(m); setFetchingMentors(false); }).catch(() => setFetchingMentors(false));
    if (user) getUserBookings(user.uid).then(setBookings).catch(() => {});
  }, [user]);

  // Pre-select assigned mentor
  useEffect(() => {
    if (userProfile?.mentorId && mentors.length > 0) {
      const m = mentors.find(m => m.uid === userProfile.mentorId);
      if (m) setSelectedMentor(m);
    }
  }, [userProfile, mentors]);

  const handleBook = async () => {
    if (!user || !userProfile || !selectedMentor || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      // Get a fresh ID token to authenticate the server-side API route
      const idToken = await user.getIdToken(/* forceRefresh */ false);

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          mentorId: selectedMentor.uid,
          date: selectedDate,
          time: selectedTime,
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const booking = (await res.json()) as Booking;
      setBookings(prev => [booking, ...prev]);
      setNewBooking(booking);
      setSuccess(true);
      setStep(1);
    } catch (e) { console.error("[BookingPanel] handleBook error:", e); }
    finally { setLoading(false); }
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" && b.date >= new Date().toISOString().split("T")[0]);
  const pastBookings = bookings.filter(b => b.status === "completed" || (b.status === "confirmed" && b.date < new Date().toISOString().split("T")[0]));

  return (
    <div className="space-y-6">
      <motion.h2 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2C2B29", fontWeight: 400 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        Book a Session
      </motion.h2>

      {/* Success banner */}
      <AnimatePresence>
        {success && newBooking && (
          <motion.div className="p-5 rounded-2xl flex items-start gap-4" style={{ background: "rgba(92,107,87,0.08)", border: "1px solid rgba(92,107,87,0.25)" }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#5C6B57" }}>
              <Check size={14} style={{ color: "#F6F4EF" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#2C2B29" }}>Session booked successfully!</p>
              <p className="text-xs mt-0.5" style={{ color: "#7A7771" }}>
                {newBooking.date} · {newBooking.time} with {newBooking.mentorName}
              </p>
              <a href={newBooking.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 block" style={{ color: "#5C6B57", textDecoration: "underline" }}>
                Google Meet Link →
              </a>
            </div>
            <button className="ml-auto text-xs" style={{ color: "#7A7771" }} onClick={() => setSuccess(false)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking form */}
      <motion.div className="p-7 rounded-2xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#5C6B57" }}>New Booking</p>

        {/* Step indicators */}
        <div className="flex gap-2 mb-8">
          {["Mentor", "Date & Time", "Confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: step > i + 1 ? "#5C6B57" : step === i + 1 ? "rgba(92,107,87,0.2)" : "#E8E1D6", color: step > i + 1 ? "#F6F4EF" : "#5C6B57", border: step === i + 1 ? "1.5px solid #5C6B57" : "none" }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs" style={{ color: step === i + 1 ? "#2C2B29" : "#7A7771" }}>{s}</span>
              </div>
              {i < 2 && <div className="w-6 h-px" style={{ background: "#D4CCBF" }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
              <p className="text-sm mb-4" style={{ color: "#7A7771" }}>Choose your mentor</p>
              {fetchingMentors ? (
                <div className="flex justify-center py-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor: "#5C6B57" }} />
                </div>
              ) : mentors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "#7A7771" }}>No mentors available yet. Check back soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentors.map(m => (
                    <motion.button key={m.uid} className="w-full p-4 rounded-xl text-left flex items-center gap-4" style={{ border: `1px solid ${selectedMentor?.uid === m.uid ? "#5C6B57" : "#D4CCBF"}`, background: selectedMentor?.uid === m.uid ? "rgba(92,107,87,0.06)" : "#F6F4EF" }} onClick={() => setSelectedMentor(m)} whileHover={{ borderColor: "#5C6B57" }}>
                      {m.photoURL ? (
                        <img src={m.photoURL} className="w-10 h-10 rounded-full object-cover" alt="mentor" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm" style={{ background: "#5C6B57", color: "#F6F4EF" }}>{m.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="text-sm" style={{ color: "#2C2B29" }}>{m.name}</p>
                        <p className="text-xs" style={{ color: "#7A7771" }}>{m.specialization ?? "Meditation & Breath"}</p>
                      </div>
                      {selectedMentor?.uid === m.uid && <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#5C6B57" }}><Check size={11} style={{ color: "#F6F4EF" }} /></div>}
                    </motion.button>
                  ))}
                </div>
              )}
              <motion.button disabled={!selectedMentor} onClick={() => setStep(2)} className="w-full mt-6 py-3.5 rounded-xl text-sm tracking-widest uppercase" style={{ background: selectedMentor ? "#5C6B57" : "#D4CCBF", color: selectedMentor ? "#F6F4EF" : "#7A7771" }} whileHover={selectedMentor ? { background: "#4A5645" } : {}} whileTap={{ scale: 0.98 }}>
                Continue
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} style={{ color: "#5C6B57" }} />
                  <p className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>Select Date</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableDays.map(d => (
                    <motion.button key={d} className="py-2.5 px-2 rounded-xl text-xs text-center" style={{ border: `1px solid ${selectedDate === d ? "#5C6B57" : "#D4CCBF"}`, background: selectedDate === d ? "rgba(92,107,87,0.1)" : "#F6F4EF", color: selectedDate === d ? "#5C6B57" : "#7A7771" }} onClick={() => setSelectedDate(d)} whileHover={{ borderColor: "#5C6B57" }}>
                      {formatDate(d)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} style={{ color: "#5C6B57" }} />
                    <p className="text-xs tracking-widest uppercase" style={{ color: "#5C6B57" }}>Select Time</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(t => (
                      <motion.button key={t} className="py-2.5 rounded-xl text-xs text-center" style={{ border: `1px solid ${selectedTime === t ? "#5C6B57" : "#D4CCBF"}`, background: selectedTime === t ? "rgba(92,107,87,0.1)" : "#F6F4EF", color: selectedTime === t ? "#5C6B57" : "#7A7771" }} onClick={() => setSelectedTime(t)} whileHover={{ borderColor: "#5C6B57" }}>
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="text-xs tracking-widest uppercase block mb-2" style={{ color: "#7A7771" }}>Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF", color: "#2C2B29", height: "80px" }} placeholder="What would you like to focus on?" />
              </div>

              <div className="flex gap-3">
                <motion.button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl text-sm" style={{ border: "1px solid #D4CCBF", color: "#7A7771", background: "#F6F4EF" }} whileHover={{ borderColor: "#5C6B57" }}>Back</motion.button>
                <motion.button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-xl text-sm tracking-widest uppercase" style={{ background: selectedDate && selectedTime ? "#5C6B57" : "#D4CCBF", color: selectedDate && selectedTime ? "#F6F4EF" : "#7A7771" }} whileHover={selectedDate && selectedTime ? { background: "#4A5645" } : {}} whileTap={{ scale: 0.98 }}>
                  Review
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
              <p className="text-sm mb-5" style={{ color: "#7A7771" }}>Review your booking</p>
              <div className="space-y-3 p-5 rounded-xl mb-6" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }}>
                {[
                  { label: "Mentor", val: selectedMentor?.name ?? "" },
                  { label: "Date", val: formatDate(selectedDate) },
                  { label: "Time", val: selectedTime },
                  { label: "Session via", val: "Google Meet (link auto-generated)" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-xs tracking-widest uppercase" style={{ color: "#7A7771" }}>{r.label}</span>
                    <span className="text-sm" style={{ color: "#2C2B29" }}>{r.val}</span>
                  </div>
                ))}
                {notes && <div className="pt-2 border-t" style={{ borderColor: "#D4CCBF" }}><p className="text-xs" style={{ color: "#7A7771" }}>Notes: {notes}</p></div>}
              </div>

              <p className="text-xs mb-5" style={{ color: "#7A7771" }}>A Google Meet link will be generated and emailed to you 24 hours and 1 hour before your session.</p>

              <div className="flex gap-3">
                <motion.button onClick={() => setStep(2)} className="px-5 py-3.5 rounded-xl text-sm" style={{ border: "1px solid #D4CCBF", color: "#7A7771", background: "#F6F4EF" }} whileHover={{ borderColor: "#5C6B57" }}>Back</motion.button>
                <motion.button onClick={handleBook} disabled={loading} className="flex-1 py-3.5 rounded-xl text-sm tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645", boxShadow: "0 8px 24px rgba(92,107,87,0.25)" }} whileTap={{ scale: 0.98 }}>
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={15} /></motion.div> : "Confirm Booking"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <motion.div className="p-6 rounded-2xl" style={{ background: "#F6F4EF", border: "1px solid #D4CCBF" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "#5C6B57" }}>Upcoming Sessions</p>
          <div className="space-y-3">
            {upcomingBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#E8E1D6", border: "1px solid #D4CCBF" }}>
                <div>
                  <p className="text-sm" style={{ color: "#2C2B29" }}>{b.date} · {b.time}</p>
                  <p className="text-xs" style={{ color: "#7A7771" }}>with {b.mentorName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button onClick={async () => { await updateBookingStatus(b.id, "cancelled"); setBookings(bs => bs.map(x => x.id === b.id ? { ...x, status: "cancelled" } : x)); }} className="text-xs" style={{ color: "#7A7771" }} whileHover={{ color: "#c04040" }}>Cancel</motion.button>
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                    <motion.button className="text-xs tracking-widest uppercase px-4 py-2 rounded-lg" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645" }}>Join</motion.button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
