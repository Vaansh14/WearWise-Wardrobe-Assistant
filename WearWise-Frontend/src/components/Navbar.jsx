import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md p-4 flex justify-between">

            <h1 className="text-xl font-bold text-blue-600">
                WearWise
            </h1>

            <div className="space-x-6">

                <Link to="/">Dashboard</Link>

                <Link to="/wardrobe">Wardrobe</Link>

                <Link to="/outfits">Outfits</Link>

                <Link to="/builder">Builder</Link>

                <Link to="/profile">Profile</Link>

            </div>

        </nav>
    );
}