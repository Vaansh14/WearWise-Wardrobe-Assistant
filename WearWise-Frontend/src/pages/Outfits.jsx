import { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import API from "../services/api";

export default function Outfits() {

    const [clothes, setClothes] = useState([]);
    const [outfit, setOutfit] = useState(null);
    const [loading, setLoading] = useState(false);

    const [view, setView] = useState("generate");
    const [savedOutfits, setSavedOutfits] = useState([]);

    const [outfitName, setOutfitName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [showPromptInput, setShowPromptInput] = useState(false);

    const [builder, setBuilder] = useState({
        top: null,
        bottom: null,
        footwear: null,
        outerwear: null,
        accessory: null
    });

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

    // ================= DRAG =================
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const sourceId = result.source.droppableId;
        const destId = result.destination.droppableId;

        if (sourceId === "wardrobe") {
            const item = clothes.find(c => c.id === parseInt(result.draggableId));
            setBuilder(prev => ({ ...prev, [destId]: item }));
        } else {
            setBuilder(prev => {
                const updated = { ...prev };
                const temp = updated[sourceId];
                updated[sourceId] = updated[destId];
                updated[destId] = temp;
                return updated;
            });
        }
    };

    // ================= GENERATE (no prompt) =================
    const generateOutfit = async () => {
        if (!clothes.length) return;
        setLoading(true);

        try {
            const res = await API.post("/api/clothing/outfit");
            const ai = res.data;

            const top = clothes[ai.top];
            const bottom = clothes[ai.bottom];
            const footwear = clothes[ai.footwear];
            const outerwear = ai.outerwear !== null ? clothes[ai.outerwear] : null;
            const accessory = ai.accessory !== null ? clothes[ai.accessory] : null;

            if (!top || !bottom || !footwear) throw new Error("Invalid AI response");

            setOutfit({ top, bottom, footwear, outerwear, accessory, reason: ai.reason });

        } catch (err) {
            console.error("AI error:", err);
            alert("Failed to generate outfit");
        }

        setLoading(false);
    };

    // ================= GENERATE WITH PROMPT =================
    const generateOutfitWithPrompt = async () => {
        if (!clothes.length || !prompt.trim()) return;
        setLoading(true);

        try {
            const res = await API.post("/api/outfits/generate/prompt", { prompt });
            const ai = res.data;

            const top = clothes[ai.top];
            const bottom = clothes[ai.bottom];
            const footwear = clothes[ai.footwear];
            const outerwear = ai.outerwear !== null ? clothes[ai.outerwear] : null;
            const accessory = ai.accessory !== null ? clothes[ai.accessory] : null;

            if (!top || !bottom || !footwear) throw new Error("Invalid AI response");

            setOutfit({ top, bottom, footwear, outerwear, accessory, reason: ai.reason });
            setShowPromptInput(false);

        } catch (err) {
            console.error("Prompt AI error:", err);
            alert("Failed to generate outfit from prompt");
        }

        setLoading(false);
    };

    // ================= SAVE =================
    const saveOutfit = async () => {
        try {
            let top, bottom, footwear, outerwear, accessory;

            if (view === "generate") {
                if (!outfit) return;
                top = outfit.top;
                bottom = outfit.bottom;
                footwear = outfit.footwear;
                outerwear = outfit.outerwear;
                accessory = outfit.accessory;
            } else {
                if (!builder.top || !builder.bottom || !builder.footwear) {
                    alert("Complete the outfit first!");
                    return;
                }
                top = builder.top;
                bottom = builder.bottom;
                footwear = builder.footwear;
                outerwear = builder.outerwear;
                accessory = builder.accessory;
            }

            await API.post("/api/outfits", {
                topId: top.id,
                bottomId: bottom.id,
                footwearId: footwear.id,
                outerwearId: outerwear?.id || null,
                accessoryId: accessory?.id || null,
                name: outfitName
            });

            alert("Outfit saved! ✅");

            setOutfitName("");
            setBuilder({ top: null, bottom: null, footwear: null, outerwear: null, accessory: null });

            fetchSavedOutfits();

        } catch (err) {
            console.error(err);
        }
    };

    const deleteOutfit = async (id) => {
        try {
            await API.delete(`/api/outfits/${id}`);
            fetchSavedOutfits();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <PageLayout title="Outfit Generator">

            {/* TOGGLE */}
            <div className="flex gap-4 mb-6 justify-center">
                <button onClick={() => setView("generate")} className={`px-4 py-2 rounded-lg ${view === "generate" ? "bg-black text-white" : "bg-gray-100"}`}>
                    Generate
                </button>
                <button onClick={() => setView("build")} className={`px-4 py-2 rounded-lg ${view === "build" ? "bg-black text-white" : "bg-gray-100"}`}>
                    Build Outfit
                </button>
                <button onClick={() => setView("saved")} className={`px-4 py-2 rounded-lg ${view === "saved" ? "bg-black text-white" : "bg-gray-100"}`}>
                    Saved
                </button>
            </div>

            {/* ================= GENERATE ================= */}
            {view === "generate" && (
                <>
                    {/* Two generation buttons */}
                    <div className="flex flex-col items-center gap-4 mb-6">

                        <div className="flex gap-3">
                            <button
                                onClick={generateOutfit}
                                disabled={loading}
                                className="bg-blue-500 text-white px-6 py-2 rounded-xl disabled:opacity-50"
                            >
                                {loading && !showPromptInput ? "Thinking..." : "Generate Smart Outfit ✨"}
                            </button>

                            <button
                                onClick={() => setShowPromptInput(prev => !prev)}
                                disabled={loading}
                                className="bg-purple-500 text-white px-6 py-2 rounded-xl disabled:opacity-50"
                            >
                                Generate with Prompt 💬
                            </button>
                        </div>

                        {/* Prompt input — shown when toggled */}
                        {showPromptInput && (
                            <div className="flex gap-2 w-full max-w-lg">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && generateOutfitWithPrompt()}
                                    placeholder='e.g. "casual streetwear for cold weather using my red jacket"'
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                />
                                <button
                                    onClick={generateOutfitWithPrompt}
                                    disabled={loading || !prompt.trim()}
                                    className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                                >
                                    {loading ? "Thinking..." : "Go"}
                                </button>
                            </div>
                        )}

                    </div>

                    {outfit && (
                        <div className="flex flex-col items-center gap-5">

                            {outfit.outerwear && (
                                <img src={outfit.outerwear.imageUrl} className="w-36 h-36 rounded-2xl shadow" />
                            )}

                            <img src={outfit.top.imageUrl} className="w-44 h-44 rounded-2xl shadow" />
                            <img src={outfit.bottom.imageUrl} className="w-44 h-44 rounded-2xl shadow" />
                            <img src={outfit.footwear.imageUrl} className="w-40 h-40 rounded-2xl shadow" />

                            {outfit.accessory && (
                                <img src={outfit.accessory.imageUrl} className="w-24 h-24 rounded-xl shadow" />
                            )}

                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 px-5 py-4 rounded-2xl shadow-sm max-w-md text-center">
                                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                    AI Stylist Insight
                                </p>
                                <p className="text-gray-800 text-sm leading-relaxed font-medium">
                                    {outfit.reason}
                                </p>
                            </div>

                            <input
                                placeholder="Outfit name"
                                value={outfitName}
                                onChange={(e) => setOutfitName(e.target.value)}
                                className="border p-2 rounded-lg text-center"
                            />

                            <button
                                onClick={saveOutfit}
                                className="bg-green-500 text-white px-6 py-2 rounded-xl"
                            >
                                Save Outfit 💾
                            </button>

                        </div>
                    )}
                </>
            )}

            {/* ================= BUILD ================= */}
            {view === "build" && (
                <DragDropContext onDragEnd={handleDragEnd}>

                    <div className="flex gap-16 justify-center items-start">

                        {/* LEFT */}
                        <Droppable droppableId="wardrobe" isDropDisabled={true}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}
                                    className="grid grid-cols-3 gap-4 max-w-sm">

                                    {clothes.map((item, index) => (
                                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                                            {(provided) => (
                                                <img
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    src={item.imageUrl}
                                                    className="w-20 h-20 object-cover rounded-xl cursor-grab"
                                                />
                                            )}
                                        </Draggable>
                                    ))}

                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* RIGHT */}
                        <div className="flex flex-col items-center gap-6">

                            {[
                                { key: "outerwear", label: "Outerwear" },
                                { key: "top", label: "Top" },
                                { key: "bottom", label: "Bottom" },
                                { key: "footwear", label: "Footwear" },
                                { key: "accessory", label: "Accessory" }
                            ].map(({ key, label }) => (

                                <Droppable droppableId={key} key={key}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="w-44 h-44 border-2 border-dashed rounded-2xl flex items-center justify-center"
                                        >
                                            {builder[key] ? (
                                                <img src={builder[key].imageUrl} className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <p className="text-gray-400">{label}</p>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}

                        </div>

                    </div>

                    <div className="flex flex-col items-center mt-10 gap-4">
                        <input
                            placeholder="Outfit name"
                            value={outfitName}
                            onChange={(e) => setOutfitName(e.target.value)}
                        />
                        <button onClick={saveOutfit} className="bg-green-500 text-white px-6 py-2 rounded-xl">
                            Save Outfit 💾
                        </button>
                    </div>

                </DragDropContext>
            )}

            {/* ================= SAVED ================= */}
            {view === "saved" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {savedOutfits.map(outfit => {

                        const top = clothes.find(c => c.id === outfit.topId);
                        const bottom = clothes.find(c => c.id === outfit.bottomId);
                        const footwear = clothes.find(c => c.id === outfit.footwearId);
                        const outerwear = clothes.find(c => c.id === outfit.outerwearId);
                        const accessory = clothes.find(c => c.id === outfit.accessoryId);

                        if (!top || !bottom || !footwear) return null;

                        return (
                            <div key={outfit.id} className="bg-white p-5 rounded-2xl shadow flex flex-col items-center">

                                {outerwear && <img src={outerwear.imageUrl} className="w-20 h-20 rounded-xl" />}
                                <img src={top.imageUrl} className="w-24 h-24 rounded-xl" />
                                <img src={bottom.imageUrl} className="w-24 h-24 rounded-xl" />
                                <img src={footwear.imageUrl} className="w-24 h-24 rounded-xl" />
                                {accessory && <img src={accessory.imageUrl} className="w-16 h-16 rounded-lg" />}

                                <p className="mt-3 font-semibold">
                                    {outfit.name || `Outfit #${outfit.id}`}
                                </p>

                                <button onClick={() => deleteOutfit(outfit.id)} className="mt-3 text-red-500">
                                    Delete
                                </button>

                            </div>
                        );
                    })}

                </div>
            )}

        </PageLayout>
    );
}