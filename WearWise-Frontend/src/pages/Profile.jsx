import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Calendar, Shirt, Sparkles, LogOut,
    CheckCircle, XCircle, Link2, Link2Off, ChevronRight, Clock
} from "lucide-react";
import PageLayout from "../layouts/PageLayout";
import { useAuth } from "../context/AuthContext";
import { useCalendar } from "../context/CalendarContext";
import API from "../services/api";

export default function Profile() {
    const { user, logout } = useAuth();
    const { isConnected, events, connectCalendar, disconnectCalendar } = useCalendar();
    const navigate = useNavigate();

    const [wardrobeCount, setWardrobeCount] = useState(0);
    const [categoryBreakdown, setCategoryBreakdown] = useState({});
    const [outfitCount, setOutfitCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);

    // ── Fetch wardrobe & outfit stats ────────────────────────────────────────
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [clothingRes, outfitsRes] = await Promise.all([
                    API.get("/api/clothing"),
                    API.get("/api/outfits"),
                ]);

                const clothes = clothingRes.data;
                setWardrobeCount(clothes.length);

                const breakdown = clothes.reduce((acc, item) => {
                    acc[item.category] = (acc[item.category] || 0) + 1;
                    return acc;
                }, {});
                setCategoryBreakdown(breakdown);
                setOutfitCount(outfitsRes.data.length);
            } catch (err) {
                console.error("Stats fetch error:", err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Generate initials from name
    const initials = user?.name
        ?.split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

    const nextEvent = events[0];

    // Category bar colours
    const categoryColors = {
        Top: "bg-violet-500",
        Bottom: "bg-indigo-500",
        Footwear: "bg-blue-500",
        Outerwear: "bg-purple-500",
        Accessory: "bg-pink-400",
    };

    return (
        <PageLayout title="Profile">

            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 mb-8 shadow-xl">
                {/* decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-300/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

                <div className="relative flex items-center gap-6 flex-wrap">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg flex-shrink-0">
                        <span className="text-3xl font-bold text-white">{initials}</span>
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-white truncate">{user?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail size={13} className="text-white/60 flex-shrink-0" />
                            <p className="text-white/70 text-sm truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Sign-out button */}
                    <button
                        id="profile-logout-btn"
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm flex-shrink-0"
                    >
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ── STATS ROW ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    {
                        icon: <Shirt size={20} className="text-violet-600" />,
                        label: "Wardrobe Items",
                        value: statsLoading ? "—" : wardrobeCount,
                        bg: "bg-violet-50 border-violet-100",
                        iconBg: "bg-white",
                    },
                    {
                        icon: <Sparkles size={20} className="text-indigo-600" />,
                        label: "Saved Outfits",
                        value: statsLoading ? "—" : outfitCount,
                        bg: "bg-indigo-50 border-indigo-100",
                        iconBg: "bg-white",
                    },
                    {
                        icon: (
                            <Calendar
                                size={20}
                                className={isConnected ? "text-green-600" : "text-gray-400"}
                            />
                        ),
                        label: "Calendar",
                        value: isConnected ? "Connected" : "Not Connected",
                        bg: isConnected
                            ? "bg-green-50 border-green-100"
                            : "bg-gray-50 border-gray-100",
                        iconBg: "bg-white",
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={`rounded-2xl p-5 border ${stat.bg} flex items-center gap-4`}
                    >
                        <div
                            className={`w-10 h-10 rounded-xl ${stat.iconBg} shadow-sm flex items-center justify-center flex-shrink-0`}
                        >
                            {stat.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold text-gray-800 truncate">{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── MAIN GRID ───────────────────────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* ── GOOGLE CALENDAR CARD ────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                <Calendar size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Google Calendar</h3>
                                <p className="text-xs text-gray-400">
                                    Powers your AI outfit suggestions
                                </p>
                            </div>
                        </div>

                        {isConnected ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                                <CheckCircle size={12} /> Active
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                                <XCircle size={12} /> Inactive
                            </span>
                        )}
                    </div>

                    {isConnected ? (
                        <>
                            {/* Next event preview */}
                            {nextEvent ? (
                                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 mb-4">
                                    <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">
                                        Next Event
                                    </p>
                                    <p className="font-semibold text-gray-800">{nextEvent.summary}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Clock size={12} className="text-gray-400 flex-shrink-0" />
                                        <p className="text-xs text-gray-500">
                                            {nextEvent.start?.dateTime
                                                ? new Date(nextEvent.start.dateTime).toLocaleString([], {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "All Day"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                                    <p className="text-sm text-gray-400">No upcoming events</p>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 mb-4 text-center">
                                {events.length} upcoming event{events.length !== 1 ? "s" : ""} synced
                            </p>

                            <button
                                id="calendar-disconnect-btn"
                                onClick={disconnectCalendar}
                                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-all"
                            >
                                <Link2Off size={15} />
                                Disconnect Calendar
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 leading-relaxed mb-5">
                                Connect your Google Calendar so StyleMate can suggest outfits
                                based on your daily schedule — meetings, parties, gym sessions &amp; more.
                            </p>
                            <button
                                id="calendar-connect-btn"
                                onClick={connectCalendar}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-200"
                            >
                                <Link2 size={15} />
                                Connect Google Calendar
                            </button>
                        </>
                    )}
                </div>

                {/* ── WARDROBE BREAKDOWN ──────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <Shirt size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Wardrobe Breakdown</h3>
                            <p className="text-xs text-gray-400">
                                {wardrobeCount} item{wardrobeCount !== 1 ? "s" : ""} across all categories
                            </p>
                        </div>
                    </div>

                    {wardrobeCount === 0 && !statsLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-sm">Your wardrobe is empty</p>
                            <button
                                onClick={() => navigate("/wardrobe")}
                                className="mt-3 text-violet-600 text-sm font-medium hover:underline"
                            >
                                Add your first item →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(categoryBreakdown).map(([category, count]) => {
                                const pct = Math.round((count / wardrobeCount) * 100);
                                const barColor = categoryColors[category] || "bg-gray-400";
                                return (
                                    <div key={category}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-gray-700 font-medium">{category}</span>
                                            <span className="text-gray-400">
                                                {count} item{count !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── ACCOUNT DETAILS ─────────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Account Details</h3>
                            <p className="text-xs text-gray-400">Your profile information</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <User size={15} className="text-gray-400" />
                                <span className="text-sm text-gray-500">Full Name</span>
                            </div>
                            <span className="text-sm text-gray-800 font-medium">{user?.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-3.5">
                            <div className="flex items-center gap-3">
                                <Mail size={15} className="text-gray-400" />
                                <span className="text-sm text-gray-500">Email</span>
                            </div>
                            <span className="text-sm text-gray-800 font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <ChevronRight size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                            <p className="text-xs text-gray-400">Navigate to key sections</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {[
                            {
                                id: "quick-wardrobe",
                                label: "Go to Wardrobe",
                                icon: <Shirt size={16} />,
                                path: "/wardrobe",
                                color: "text-violet-600",
                                hover: "hover:bg-violet-50",
                            },
                            {
                                id: "quick-outfits",
                                label: "Generate Outfit",
                                icon: <Sparkles size={16} />,
                                path: "/outfits",
                                color: "text-indigo-600",
                                hover: "hover:bg-indigo-50",
                            },
                        ].map(action => (
                            <button
                                key={action.path}
                                id={action.id}
                                onClick={() => navigate(action.path)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${action.hover} transition-all group`}
                            >
                                <span className={`flex items-center gap-3 text-sm font-medium ${action.color}`}>
                                    {action.icon}
                                    {action.label}
                                </span>
                                <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-400 transition" />
                            </button>
                        ))}

                        <button
                            id="quick-logout"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-50 transition-all group"
                        >
                            <span className="flex items-center gap-3 text-sm font-medium text-red-500">
                                <LogOut size={16} />
                                Sign Out
                            </span>
                            <ChevronRight size={15} className="text-red-200 group-hover:text-red-300 transition" />
                        </button>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}