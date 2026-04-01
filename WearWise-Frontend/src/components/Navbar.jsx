import { Link, useNavigate } from "react-router-dom";
import { Shirt, LayoutDashboard, Sparkles, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="bg-white/70 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">

            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Shirt size={22} />
                    WearWise
                </h1>

                <div className="flex items-center gap-8 text-gray-600 font-medium">

                    <Link className="flex items-center gap-1 hover:text-black transition" to="/">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>

                    <Link className="flex items-center gap-1 hover:text-black transition" to="/wardrobe">
                        <Shirt size={18} /> Wardrobe
                    </Link>

                    <Link className="flex items-center gap-1 hover:text-black transition" to="/outfits">
                        <Sparkles size={18} /> Outfits
                    </Link>

                    <Link className="flex items-center gap-1 hover:text-black transition" to="/profile">
                        <User size={18} /> Profile
                    </Link>

                </div>

                {/* User info + logout */}
                <div className="flex items-center gap-3">
                    {user && (
                        <span className="text-sm text-gray-500 font-medium">
                            {user.name}
                        </span>
                    )}
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

            </div>

        </nav>
    );
}