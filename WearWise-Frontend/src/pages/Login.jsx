import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Shirt, Mail, Lock, ArrowRight, Eye, EyeOff,
    Sparkles, CalendarDays, CloudSun
} from "lucide-react";

const BRAND_EMOJIS = ["👕", "👖", "👗", "👟", "🧥", "👒", "👔", "🧣"];

const FEATURES = [
    {
        icon: <Sparkles size={18} />,
        title: "AI Outfit Generation",
        desc: "Smart outfit suggestions powered by AI"
    },
    {
        icon: <CalendarDays size={18} />,
        title: "Calendar-aware Styling",
        desc: "Dress right for your daily schedule"
    },
    {
        icon: <CloudSun size={18} />,
        title: "Weather-based Picks",
        desc: "Outfits tailored to live weather"
    }
];

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* LEFT — Brand Panel */}
            <div className="hidden lg:flex w-[52%] relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-900 flex-col items-center justify-center p-14">

                {/* Glow blobs */}
                <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

                {/* Floating emojis */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    {BRAND_EMOJIS.map((emoji, i) => (
                        <span
                            key={i}
                            className="absolute text-4xl auth-float"
                            style={{
                                top: `${8 + i * 11}%`,
                                left: `${4 + ((i * 19) % 80)}%`,
                                animationDelay: `${i * 0.45}s`,
                                animationDuration: `${3 + (i % 3) * 0.8}s`,
                                opacity: 0.08
                            }}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>

                <div className="relative text-center max-w-sm">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-[5.5rem] h-[5.5rem] bg-white/15 rounded-3xl mb-7 backdrop-blur-sm border border-white/20 shadow-2xl">
                        <Shirt size={38} className="text-white" />
                    </div>

                    <h1 className="text-5xl font-black text-white tracking-tight mb-3">
                        WearWise
                    </h1>

                    <p className="text-white/60 text-base leading-relaxed">
                        Your AI-powered wardrobe assistant.
                        <br />
                        Dress smarter every single day.
                    </p>

                    {/* IMPROVED FEATURE CARDS */}
                    <div className="flex flex-col gap-4 mt-10">
                        {FEATURES.map((f, i) => (
                            <div
                                key={i}
                                className="group flex items-start gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4 transition-all duration-300 hover:bg-white/15 hover:scale-[1.03] hover:shadow-xl"
                            >
                                {/* Icon */}
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 text-white group-hover:scale-110 transition">
                                    {f.icon}
                                </div>

                                {/* Text */}
                                <div className="text-left">
                                    <p className="text-white font-semibold text-sm">
                                        {f.title}
                                    </p>
                                    <p className="text-white/50 text-xs mt-0.5">
                                        {f.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="absolute bottom-7 text-white/25 text-xs italic text-center px-10">
                    "Fashion is the armor to survive the reality of everyday life."
                </p>
            </div>

            {/* RIGHT — Form Panel */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/80 p-8 border border-gray-100">

                        <div className="mb-7">
                            <h2 className="text-3xl font-black text-gray-900">
                                Welcome back
                            </h2>
                            <p className="text-gray-400 mt-1.5 text-sm">
                                Sign in to your WearWise account
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm">
                                ⚠ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-violet-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-12 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-2xl flex justify-center items-center gap-2"
                            >
                                {loading ? "Loading..." : <>Sign In <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        <div className="text-center mt-6 text-sm">
                            New here?{" "}
                            <Link to="/register" className="text-violet-600 font-semibold">
                                Create account
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}