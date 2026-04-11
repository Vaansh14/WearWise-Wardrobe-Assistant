import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Shirt, Mail, Lock, User, ArrowRight, Eye, EyeOff,
    CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import API from "../services/api";

// ── Password rules ───────────────────────────────────────────────────────────
const RULES = [
    { id: "len", label: "At least 8 characters", test: p => p.length >= 8 },
    { id: "upper", label: "One uppercase letter (A-Z)", test: p => /[A-Z]/.test(p) },
    { id: "lower", label: "One lowercase letter (a-z)", test: p => /[a-z]/.test(p) },
    { id: "num", label: "One number (0–9)", test: p => /[0-9]/.test(p) },
    { id: "special", label: "One special character (!@#$…)", test: p => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
    { label: "Weak", bar: "bg-red-500", text: "text-red-500", bars: 1 },
    { label: "Fair", bar: "bg-orange-500", text: "text-orange-500", bars: 2 },
    { label: "Good", bar: "bg-yellow-500", text: "text-yellow-600", bars: 3 },
    { label: "Strong", bar: "bg-blue-500", text: "text-blue-500", bars: 4 },
    { label: "Very Strong", bar: "bg-emerald-500", text: "text-emerald-600", bars: 5 },
];

const BRAND_STEPS = [
    { n: "1", title: "Create Account", desc: "Fill in your details & set a strong password" },
    { n: "2", title: "Verify Email", desc: "Enter the 6-digit code we send you" },
    { n: "3", title: "Start Styling", desc: "Upload clothes & get AI outfit suggestions" },
];

const BRAND_EMOJIS = ["👕", "👖", "👗", "👟", "🧥", "👒", "👔", "🧣"];

export default function Register() {
    const [step, setStep] = useState(1);

    // Step 1 fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);

    // Step 2 OTP
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);
    const [resendTimer, setResendTimer] = useState(0);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const passedCount = RULES.filter(r => r.test(password)).length;
    const strength = password.length > 0 ? STRENGTH[Math.max(0, passedCount - 1)] : null;
    const allPassed = passedCount === RULES.length;
    const pwMatch = password === confirm;

    // ── Send OTP ────────────────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!allPassed) { setError("Please meet all password requirements."); return; }
        if (!pwMatch) { setError("Passwords do not match."); return; }

        setLoading(true);
        try {
            await API.post("/api/auth/send-otp", { email });
            setStep(2);
            startResendTimer();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send verification code.");
        } finally {
            setLoading(false);
        }
    };

    // ── Verify OTP + Register ────────────────────────────────────────────────
    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        const code = otp.join("");
        if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }

        setLoading(true);
        try {
            await API.post("/api/auth/verify-otp", { email, otp: code });
            await register(name, email, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Resend timer ─────────────────────────────────────────────────────────
    const startResendTimer = () => {
        setResendTimer(60);
        const id = setInterval(() => {
            setResendTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; });
        }, 1000);
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setError("");
        try {
            await API.post("/api/auth/send-otp", { email });
            setOtp(["", "", "", "", "", ""]);
            startResendTimer();
        } catch { setError("Failed to resend code."); }
    };

    // ── OTP digit handlers ───────────────────────────────────────────────────
    const handleOtpChange = (i, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[i] = val.slice(-1);
        setOtp(next);
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
    };
    const handleOtpKey = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...otp];
        pasted.split("").forEach((d, i) => { next[i] = d; });
        setOtp(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    // ── Shared input class ───────────────────────────────────────────────────
    const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition text-sm";

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT — Brand Panel ─────────────────────────────────────── */}
            <div className="hidden lg:flex w-[52%] relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-900 flex-col items-center justify-center p-14">
                <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    {BRAND_EMOJIS.map((emoji, i) => (
                        <span key={i} className="absolute text-4xl auth-float"
                            style={{ top: `${8 + i * 11}%`, left: `${4 + ((i * 19) % 80)}%`, animationDelay: `${i * 0.45}s`, animationDuration: `${3 + (i % 3) * 0.8}s`, opacity: 0.08 }}>
                            {emoji}
                        </span>
                    ))}
                </div>

                <div className="relative text-center max-w-sm">
                    <div className="inline-flex items-center justify-center w-[5.5rem] h-[5.5rem] bg-white/15 rounded-3xl mb-7 backdrop-blur-sm border border-white/20 shadow-2xl">
                        <Shirt size={38} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight mb-3">WearWise</h1>
                    <p className="text-white/60 text-base leading-relaxed">Join thousands who dress smarter with AI-powered style suggestions.</p>

                    {/* Step checklist */}
                    <div className="mt-12 flex flex-col gap-5 text-left">
                        {BRAND_STEPS.map((s, i) => {
                            const done = step - 1 > i;
                            const current = step - 1 === i;
                            return (
                                <div key={i} className={`flex items-start gap-4 transition-all duration-500 ${done ? "opacity-50" : current ? "opacity-100" : "opacity-35"}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${done || current ? "bg-white text-purple-700 shadow-lg" : "bg-white/10 text-white/50"}`}>
                                        {done ? "✓" : s.n}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{s.title}</p>
                                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="absolute bottom-7 text-white/25 text-xs italic text-center px-10">"Style is a way to say who you are without having to speak."</p>
            </div>

            {/* ── RIGHT — Form Panel ─────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
                <div className="w-full max-w-md py-8">

                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xl shadow-lg shadow-violet-200">
                            <Shirt size={20} /> WearWise
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/80 p-8 border border-gray-100">

                        {/* Error banner */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                                <span className="text-red-400 text-base">⚠</span> {error}
                            </div>
                        )}

                        {/* ══ STEP 1 — Details ════════════════════════════ */}
                        {step === 1 && (
                            <>
                                <div className="mb-6">
                                    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">Step 1 of 2</span>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-3">Create account</h2>
                                    <p className="text-gray-400 mt-1 text-sm">Join WearWise — it only takes a minute</p>
                                </div>

                                <form onSubmit={handleSendOtp} className="space-y-4">

                                    {/* Name */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input id="register-name" type="text" value={name} onChange={e => setName(e.target.value)}
                                                placeholder="John Doe" required className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Email address</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                placeholder="you@example.com" required className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input id="register-password" type={showPass ? "text" : "password"} value={password}
                                                onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required
                                                className={`${inputCls} pr-12`} />
                                            <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        {/* Strength meter */}
                                        {password && (
                                            <div className="mt-3 space-y-2.5">
                                                <div className="flex gap-1 h-1.5">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= passedCount ? strength.bar : "bg-gray-100"}`} />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className={`text-xs font-bold ${strength.text}`}>{strength.label}</span>
                                                    <span className="text-xs text-gray-400">{passedCount}/5 met</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                    {RULES.map(rule => {
                                                        const ok = rule.test(password);
                                                        return (
                                                            <div key={rule.id} className="flex items-center gap-2">
                                                                {ok
                                                                    ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                                                                    : <XCircle size={13} className="text-gray-300 flex-shrink-0" />}
                                                                <span className={`text-xs ${ok ? "text-emerald-600 font-medium" : "text-gray-400"}`}>{rule.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input id="register-confirm" type={showConf ? "text" : "password"} value={confirm}
                                                onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required
                                                className={`w-full bg-gray-50 border rounded-2xl py-3.5 pl-11 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition text-sm ${confirm && !pwMatch ? "border-red-300 focus:ring-red-200" : confirm && pwMatch ? "border-emerald-300 focus:ring-emerald-200" : "border-gray-200 focus:ring-violet-400/30 focus:border-violet-400"}`} />
                                            <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                                {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirm && !pwMatch && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>}
                                        {confirm && pwMatch && <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1"><CheckCircle size={12} /> Passwords match</p>}
                                    </div>

                                    <button id="register-send-otp" type="submit" disabled={loading || !allPassed || !pwMatch}
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 text-sm mt-1">
                                        {loading
                                            ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                            : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
                                    </button>
                                </form>

                                <p className="text-center text-sm text-gray-400 mt-6">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-violet-600 font-semibold hover:underline">Sign in</Link>
                                </p>
                            </>
                        )}

                        {/* ══ STEP 2 — OTP ════════════════════════════════ */}
                        {step === 2 && (
                            <>
                                <div className="mb-6">
                                    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">Step 2 of 2</span>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-3">Verify email</h2>
                                    <p className="text-gray-400 mt-1 text-sm">
                                        We sent a 6-digit code to{" "}
                                        <span className="text-violet-600 font-semibold break-all">{email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-5 block text-center">Enter verification code</label>
                                        <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => (
                                                <input key={i} ref={el => otpRefs.current[i] = el}
                                                    id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    onChange={e => handleOtpChange(i, e.target.value)}
                                                    onKeyDown={e => handleOtpKey(i, e)}
                                                    className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-violet-400/40 ${digit ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm" : "border-gray-200 bg-gray-50 text-gray-800"}`} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        {resendTimer > 0 ? (
                                            <p className="text-sm text-gray-400">
                                                Resend in <span className="font-semibold text-gray-700 tabular-nums">{resendTimer}s</span>
                                            </p>
                                        ) : (
                                            <button type="button" onClick={handleResend}
                                                className="text-sm text-violet-600 font-semibold hover:underline flex items-center gap-1.5 mx-auto">
                                                <RefreshCw size={14} /> Resend code
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <button id="register-verify-otp" type="submit" disabled={loading || otp.join("").length < 6}
                                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 text-sm">
                                            {loading
                                                ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                                : <><span>Verify &amp; Create Account</span><ArrowRight size={16} /></>}
                                        </button>

                                        <button type="button" onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
                                            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition text-center">
                                            ← Change email or details
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}    