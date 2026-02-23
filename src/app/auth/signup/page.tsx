"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { enrollUserInProgram } from "@/lib/firestore";

const programs = [
  { id: "30", label: "30 Days — Foundation", price: "$149" },
  { id: "60", label: "60 Days — Deepening", price: "$279" },
  { id: "90", label: "90 Days — Inner Mastery", price: "$449" },
];

export default function SignupPage() {
  const router = useRouter();
  const { user, signUpWithEmail, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && step < 2) router.replace("/dashboard");
  }, [user, authLoading, step, router]);

  const formatError = (code: string) => {
    const map: Record<string, string> = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
    };
    return map[code] ?? "Sign up failed. Please try again.";
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      setStep(2);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(formatError(code));
    } finally { setLoading(false); }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !user) return;
    setLoading(true);
    try {
      await enrollUserInProgram(user.uid, selectedProgram);
      setStep(3);
      await new Promise(r => setTimeout(r, 2200));
      router.push("/dashboard");
    } catch { setError("Enrollment failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    setError(""); setLoading(true);
    try { await signInWithGoogle(); setStep(2); }
    catch { setError("Google sign-in failed."); }
    finally { setLoading(false); }
  };

  const handleAppleSignup = async () => {
    setError(""); setLoading(true);
    try { await signInWithApple(); setStep(2); }
    catch { setError("Apple sign-in failed."); }
    finally { setLoading(false); }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    background: "#F6F4EF",
    border: `1px solid ${focusedField === field ? "#5C6B57" : "#D4CCBF"}`,
    color: "#2C2B29",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(92,107,87,0.1)" : "none",
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: "#F6F4EF" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(92,107,87,0.08) 0%, transparent 60%)" }} />

      <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#2C2B29", letterSpacing: "0.15em" }} whileHover={{ opacity: 0.6 }}>
          Atmava
        </motion.span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <motion.div key={s} className="rounded-full" animate={{ width: s === step ? "24px" : "6px", height: "6px", background: s <= step ? "#5C6B57" : "#D4CCBF" }} transition={{ duration: 0.4 }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45 }}>
              <div className="p-10 rounded-2xl" style={{ background: "rgba(246,244,239,0.85)", border: "1px solid #D4CCBF", backdropFilter: "blur(20px)", boxShadow: "0 24px 60px rgba(44,43,41,0.07)" }}>
                <div className="text-center mb-10">
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 300, color: "#2C2B29" }}>Begin your journey</h1>
                  <p className="text-sm mt-2" style={{ color: "#7A7771" }}>Create your sacred space</p>
                </div>

                <div className="space-y-3 mb-7">
                  <motion.button onClick={handleGoogleSignup} disabled={loading} className="w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-3" style={{ border: "1px solid #D4CCBF", background: "#F6F4EF", color: "#2C2B29" }} whileHover={{ borderColor: "#5C6B57", background: "#E8E1D6" }} whileTap={{ scale: 0.98 }}>
                    <svg width="17" height="17" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.1-.84 2.03-1.8 2.66v2.21h2.92c1.71-1.57 2.68-3.89 2.68-6.51z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.35C2.44 15.98 5.48 18 9 18z" fill="#34A853"/><path d="M3.97 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.95H.96A9.01 9.01 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.35z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.51.45 3.44 1.34l2.58-2.58C13.47.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.35C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Sign up with Google
                  </motion.button>
                  <motion.button onClick={handleAppleSignup} disabled={loading} className="w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-3" style={{ border: "1px solid #D4CCBF", background: "#F6F4EF", color: "#2C2B29" }} whileHover={{ borderColor: "#5C6B57", background: "#E8E1D6" }} whileTap={{ scale: 0.98 }}>
                    <svg width="17" height="17" viewBox="0 0 814 1000" fill="#2C2B29"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 481.8 6.6 327.8 6.6 180.5c0-198.8 130.3-304.1 256.9-304.1 68 0 124.4 44.8 167.4 44.8 41.8 0 107.2-47.1 183.7-47.1 28 0 130.3 2.6 198.5 99.6z"/></svg>
                    Sign up with Apple
                  </motion.button>
                </div>

                <div className="flex items-center gap-3 mb-7">
                  <div className="flex-1 h-px" style={{ background: "#D4CCBF" }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: "#7A7771" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "#D4CCBF" }} />
                </div>

                <form onSubmit={handleStep1} className="space-y-5">
                  {[
                    { id: "name", label: "Full Name", type: "text", val: name, set: setName, ph: "Your name" },
                    { id: "email", label: "Email", type: "email", val: email, set: setEmail, ph: "you@example.com" },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "#7A7771" }}>{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} onFocus={() => setFocusedField(f.id)} onBlur={() => setFocusedField(null)} className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-300" style={inputStyle(f.id)} placeholder={f.ph} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "#7A7771" }}>Password</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm outline-none transition-all duration-300" style={inputStyle("password")} placeholder="Min. 6 characters" />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={15} style={{ color: "#7A7771" }} /> : <Eye size={15} style={{ color: "#7A7771" }} />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(200,80,80,0.06)", color: "#c04040", border: "1px solid rgba(200,80,80,0.15)" }}>{error}</motion.div>}
                  </AnimatePresence>
                  <motion.button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-sm tracking-[0.14em] uppercase flex items-center justify-center gap-3 mt-2" style={{ background: "#5C6B57", color: "#F6F4EF" }} whileHover={{ background: "#4A5645", boxShadow: "0 8px 24px rgba(92,107,87,0.25)" }} whileTap={{ scale: 0.98 }}>
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={16} /></motion.div> : "Continue"}
                  </motion.button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm" style={{ color: "#7A7771" }}>Already a practitioner?{" "}
                    <Link href="/auth/login"><motion.span className="underline" style={{ color: "#5C6B57" }} whileHover={{ opacity: 0.7 }}>Sign in</motion.span></Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45 }}>
              <div className="p-10 rounded-2xl" style={{ background: "rgba(246,244,239,0.85)", border: "1px solid #D4CCBF", backdropFilter: "blur(20px)", boxShadow: "0 24px 60px rgba(44,43,41,0.07)" }}>
                <div className="text-center mb-10">
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, color: "#2C2B29" }}>Choose your path</h1>
                  <p className="text-sm mt-2" style={{ color: "#7A7771" }}>Select a program to begin</p>
                </div>
                <form onSubmit={handleStep2} className="space-y-4">
                  {programs.map(p => (
                    <motion.button key={p.id} type="button" className="w-full p-5 rounded-xl text-left flex items-center justify-between" style={{ border: `1px solid ${selectedProgram === p.id ? "#5C6B57" : "#D4CCBF"}`, background: selectedProgram === p.id ? "rgba(92,107,87,0.06)" : "#F6F4EF" }} onClick={() => setSelectedProgram(p.id)} whileHover={{ borderColor: "#5C6B57" }}>
                      <div>
                        <p className="text-sm" style={{ color: "#2C2B29" }}>{p.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#7A7771" }}>{p.price}</p>
                      </div>
                      <AnimatePresence>
                        {selectedProgram === p.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#5C6B57" }}>
                            <Check size={11} style={{ color: "#F6F4EF" }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                  <AnimatePresence>
                    {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(200,80,80,0.06)", color: "#c04040", border: "1px solid rgba(200,80,80,0.15)" }}>{error}</motion.div>}
                  </AnimatePresence>
                  <motion.button type="submit" disabled={!selectedProgram || loading} className="w-full py-4 rounded-xl text-sm tracking-[0.14em] uppercase flex items-center justify-center gap-3 mt-4" style={{ background: selectedProgram ? "#5C6B57" : "#D4CCBF", color: selectedProgram ? "#F6F4EF" : "#7A7771" }} whileHover={selectedProgram ? { background: "#4A5645", boxShadow: "0 8px 24px rgba(92,107,87,0.25)" } : {}} whileTap={{ scale: 0.98 }}>
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={16} /></motion.div> : "Enter the Practice"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <motion.div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: "rgba(92,107,87,0.1)", border: "1px solid rgba(92,107,87,0.3)" }} animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 rgba(92,107,87,0.2)", "0 0 24px 8px rgba(92,107,87,0.08)", "0 0 0 0 rgba(92,107,87,0.2)"] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Check size={28} style={{ color: "#5C6B57" }} />
              </motion.div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, color: "#2C2B29" }}>Welcome, {name.split(" ")[0] || "Seeker"}.</h2>
              <p className="mt-4 text-sm" style={{ color: "#7A7771" }}>Entering your sacred space…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
