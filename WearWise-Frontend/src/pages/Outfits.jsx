import { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import API from "../services/api";

export default function Outfits() {

    const [clothes, setClothes] = useState([]);
    const [outfit, setOutfit] = useState(null);
    const [loading, setLoading] = useState(false);

    const [view, setView] = useState("generate");
    const [savedOutfits, setSavedOutfits] = useState([]);

    const shirts = clothes.filter(c => c.category === "Shirt");
    const pants = clothes.filter(c => c.category === "Pants");
    const shoes = clothes.filter(c => c.category === "Shoes");

    useEffect(() => {
        fetchClothes();
        fetchSavedOutfits();
    }, []);

    const fetchClothes = async () => {
        try {
            const res = await API.get("/api/clothing");
            setClothes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSavedOutfits = async () => {
        try {
            const res = await API.get("/api/outfits");
            setSavedOutfits(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 🎯 AI GENERATOR
    const generateOutfit = async () => {

        if (!clothes.length) return;

        setLoading(true);

        try {
            const res = await API.post("/api/clothing/outfit");
            const ai = res.data;

            const shirt = clothes[ai.shirt];
            const pant = clothes[ai.pants];
            const shoe = clothes[ai.shoes];

            if (!shirt || !pant || !shoe) {
                throw new Error("Invalid AI response");
            }

            setOutfit({
                shirt,
                pant,
                shoe,
                reason: ai.reason
            });

        } catch (err) {
            console.error("AI error:", err);
            alert("Failed to generate outfit");
        }

        setLoading(false);
    };

    const saveOutfit = async () => {

        if (!outfit) return;

        try {
            await API.post("/api/outfits", {
                shirtId: outfit.shirt.id,
                pantsId: outfit.pant.id,
                shoesId: outfit.shoe.id
            });

            alert("Outfit saved! ");

            fetchSavedOutfits(); // 🔥 refresh list

        } catch (err) {
            console.error(err);
        }
    };

    const deleteOutfit = async (id) => {
        try {
            await API.delete(`/api/outfits/${id}`);
            fetchSavedOutfits(); // refresh
        } catch (err) {
            console.error(err);
        }
    };

    const swapItem = (type, newItem) => {
        setOutfit(prev => ({
            ...prev,
            [type]: newItem
        }));
    };

    return (
        <PageLayout title="Outfit Generator">

            {/*  TOGGLE */}
            <div className="flex gap-4 mb-6 justify-center">

                <button
                    onClick={() => setView("generate")}
                    className={`px-4 py-2 rounded-lg ${view === "generate" ? "bg-black text-white" : "bg-gray-100"
                        }`}
                >
                    Generate
                </button>

                <button
                    onClick={() => setView("saved")}
                    className={`px-4 py-2 rounded-lg ${view === "saved" ? "bg-black text-white" : "bg-gray-100"
                        }`}
                >
                    Saved Outfits
                </button>

            </div>

            {/* ================= GENERATE VIEW ================= */}
            {view === "generate" && (
                <>
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={generateOutfit}
                            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition"
                        >
                            {loading ? "Thinking..." : "Generate Smart Outfit ✨"}
                        </button>
                    </div>

                    {!outfit && (
                        <p className="text-center text-gray-400">
                            Click to generate your outfit
                        </p>
                    )}

                    {outfit && (
                        <div className="flex flex-col items-center gap-6">

                            {/* SHIRT */}
                            <div className="text-center">
                                <img src={outfit.shirt.imageUrl} className="w-48 h-48 object-cover rounded-xl shadow" />
                                <p className="mt-2 font-semibold">{outfit.shirt.category}</p>

                                <div className="flex gap-2 mt-3 overflow-x-auto justify-center">
                                    {shirts.map(item => (
                                        <img
                                            key={item.id}
                                            src={item.imageUrl}
                                            onClick={() => swapItem("shirt", item)}
                                            className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${outfit.shirt.id === item.id ? "border-black" : "border-transparent"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* PANTS */}
                            <div className="text-center">
                                <img src={outfit.pant.imageUrl} className="w-48 h-48 object-cover rounded-xl shadow" />
                                <p className="mt-2 font-semibold">{outfit.pant.category}</p>

                                <div className="flex gap-2 mt-3 overflow-x-auto justify-center">
                                    {pants.map(item => (
                                        <img
                                            key={item.id}
                                            src={item.imageUrl}
                                            onClick={() => swapItem("pant", item)}
                                            className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${outfit.pant.id === item.id ? "border-black" : "border-transparent"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* SHOES */}
                            <div className="text-center">
                                <img src={outfit.shoe.imageUrl} className="w-48 h-48 object-cover rounded-xl shadow" />
                                <p className="mt-2 font-semibold">{outfit.shoe.category}</p>

                                <div className="flex gap-2 mt-3 overflow-x-auto justify-center">
                                    {shoes.map(item => (
                                        <img
                                            key={item.id}
                                            src={item.imageUrl}
                                            onClick={() => swapItem("shoe", item)}
                                            className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${outfit.shoe.id === item.id ? "border-black" : "border-transparent"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {outfit.reason && (
                                <p className="mt-4 text-center text-gray-600 italic max-w-md">
                                    {outfit.reason}
                                </p>
                            )}

                            <button
                                onClick={saveOutfit}
                                className="mt-6 bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition"
                            >
                                Save Outfit 💾
                            </button>

                        </div>
                    )}
                </>
            )}

            {/* ================= SAVED VIEW ================= */}
            {view === "saved" && (

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {savedOutfits.length === 0 && (
                        <p className="text-center text-gray-400 col-span-3">
                            No saved outfits yet
                        </p>
                    )}

                    {savedOutfits.map(outfit => {

                        const shirt = clothes.find(c => c.id === outfit.shirtId);
                        const pant = clothes.find(c => c.id === outfit.pantsId);
                        const shoe = clothes.find(c => c.id === outfit.shoesId);

                        if (!shirt || !pant || !shoe) return null;

                        return (
                            <div key={outfit.id} className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">

                                {/* DELETE */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => deleteOutfit(outfit.id)}
                                        className="text-red-500 text-sm hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>

                                {/* 🔥 OUTFIT STACK */}
                                <div className="flex flex-col items-center gap-4 mt-2">

                                    <img
                                        src={shirt.imageUrl}
                                        className="w-28 h-28 object-cover rounded-xl"
                                    />

                                    <img
                                        src={pant.imageUrl}
                                        className="w-28 h-28 object-cover rounded-xl"
                                    />

                                    <img
                                        src={shoe.imageUrl}
                                        className="w-28 h-28 object-cover rounded-xl"
                                    />

                                </div>

                                {/* LABEL */}
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Outfit #{outfit.id}
                                </p>

                            </div>
                        );
                    })}

                </div>
            )}

        </PageLayout>
    );
}