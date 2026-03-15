import { Link } from "react-router-dom";
import { Shirt, LayoutDashboard, Sparkles, User } from "lucide-react";

export default function Navbar() {
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

            </div>

        </nav>
    );
}