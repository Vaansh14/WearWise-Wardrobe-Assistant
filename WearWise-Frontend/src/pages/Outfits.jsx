import { useState, useEffect } from "react";
import PageLayout from "../layouts/PageLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import API from "../services/api";

// Maps each builder slot to the expected clothing category
const SLOT_CATEGORY = {
    top: "Top",
    bottom: "Bottom",
    footwear: "Footwear",
    outerwear: "Outerwear",
    accessory: "Accessory",
};

export default function Outfits() {

    const [clothes, setClothes] = useState([]);
    const [outfit, setOutfit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [outfitWarning, setOutfitWarning] = useState("");

    const [view, setView] = useState("generate");
    const [savedOutfits, setSavedOutfits] = useState([]);

    const [outfitName, setOutfitName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [showPromptInput, setShowPromptInput] = useState(false);
    const [promptError, setPromptError] = useState("");

    // Drag-drop mismatch feedback
    const [dropError, setDropError] = useState("");

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

        // Dragging from the wardrobe palette onto a builder slot
        if (sourceId === "wardrobe") {
            // destId is always a slot key (top/bottom/footwear/outerwear/accessory)
            const item = clothes.find(c => c.id === parseInt(result.draggableId));
            if (!item) return;

            const expectedCategory = SLOT_CATEGORY[destId];

            // Category validation — reject mismatches
            if (item.category !== expectedCategory) {
                setDropError(
                    `❌ "${item.type || item.category}" is a ${item.category} — drop it in the ${item.category} slot.`
                );
                setTimeout(() => setDropError(""), 3500);
                return;
            }

            setDropError("");
            setBuilder(prev => ({ ...prev, [destId]: item }));

        } else {
            // Swapping two builder slots — only allow if categories still match
            const movingItem = builder[sourceId];
            const targetItem = builder[destId];

            const sourceExpected = SLOT_CATEGORY[sourceId];
            const destExpected = SLOT_CATEGORY[destId];

            const sourceOk = !targetItem || targetItem.category === sourceExpected;
            const destOk = !movingItem || movingItem.category === destExpected;

            if (!sourceOk || !destOk) {
                setDropError(" Category mismatch — items must stay in their correct slots.");
                setTimeout(() => setDropError(""), 3500);
                return;
            }

            setDropError("");
            setBuilder(prev => {
                const updated = { ...prev };
                updated[sourceId] = targetItem;
                updated[destId] = movingItem;
                return updated;
            });
        }
    };

    // ================= GENERATE =================
    const generateOutfit = async () => {
        if (!clothes.length) return;
        setLoading(true);
        setOutfitWarning("");

        try {
            const res = await API.post("/api/clothing/outfit");
            const ai = res.data;

            console.log("AI response:", ai);

            const top = clothes.find(c => c.id === ai.top) ?? null;
            const bottom = clothes.find(c => c.id === ai.bottom) ?? null;
            const footwear = clothes.find(c => c.id === ai.footwear) ?? null;
            const outerwear = ai.outerwear != null ? (clothes.find(c => c.id === ai.outerwear) ?? null) : null;
            const accessory = ai.accessory != null ? (clothes.find(c => c.id === ai.accessory) ?? null) : null;

            // Show a warning if any required slot is missing — don't hard-fail
            const missing = [];
            if (!top) missing.push("Top");
            if (!bottom) missing.push("Bottom");
            if (!footwear) missing.push("Footwear");

            if (missing.length > 0) {
                setOutfitWarning(
                    `⚠️ Some sections are missing (${missing.join(", ")}). Add more clothing items for better results.`
                );
            }

            setOutfit({
                top,
                bottom,
                footwear,
                outerwear,
                accessory,
                reason: ai.reason
            });

        } catch (err) {
            console.error("AI error:", err);
            alert("Failed to generate outfit. Please try again.");
        }

        setLoading(false);
    };

    // ================= GENERATE WITH PROMPT =================
    const generateOutfitWithPrompt = async () => {
        if (!clothes.length || !prompt.trim()) return;
        setLoading(true);
        setPromptError("");
        setOutfitWarning("");

        try {
            const res = await API.post("/api/outfits/generate/prompt", { prompt });
            const ai = res.data;

            console.log("Prompt AI response:", ai);

            const top = clothes.find(c => c.id === ai.top) ?? null;
            const bottom = clothes.find(c => c.id === ai.bottom) ?? null;
            const footwear = clothes.find(c => c.id === ai.footwear) ?? null;
            const outerwear = ai.outerwear != null ? (clothes.find(c => c.id === ai.outerwear) ?? null) : null;
            const accessory = ai.accessory != null ? (clothes.find(c => c.id === ai.accessory) ?? null) : null;

            const missing = [];
            if (!top) missing.push("Top");
            if (!bottom) missing.push("Bottom");
            if (!footwear) missing.push("Footwear");

            if (missing.length > 0) {
                setOutfitWarning(
                    `⚠️ Some sections are missing (${missing.join(", ")}). Add more clothing items for better results.`
                );
            }

            setOutfit({ top, bottom, footwear, outerwear, accessory, reason: ai.reason });
            setShowPromptInput(false);
            setPromptError("");

        } catch (err) {
            console.error("Prompt AI error:", err);

            const detail = err?.response?.data?.detail || "";
            if (detail.toLowerCase().includes("invalid fashion prompt")) {
                setPromptError(" Invalid fashion prompt. Please describe an outfit or style.");
            } else {
                setPromptError("Failed to generate outfit. Please try again.");
            }
        }

        setLoading(false);
    };

    // ================= SAVE =================
    const saveOutfit = async () => {
        try {
            let top, bottom, footwear, outerwear, accessory;

            if (view === "generate") {
                if (!outfit) return;
                ({ top, bottom, footwear, outerwear, accessory } = outfit);
            } else {
                if (!builder.top || !builder.bottom || !builder.footwear) {
                    alert("Please fill in Top, Bottom and Footwear slots first.");
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

            alert("Outfit saved! ");

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
                    <div className="flex flex-col items-center gap-4 mb-6">

                        <div className="flex gap-3">
                            <button
                                onClick={generateOutfit}
                                disabled={loading}
                                className="bg-blue-500 text-white px-6 py-2 rounded-xl disabled:opacity-50"
                            >
                                {loading && !showPromptInput ? "Thinking..." : "Generate Smart Outfit "}
                            </button>

                            <button
                                onClick={() => setShowPromptInput(prev => !prev)}
                                disabled={loading}
                                className="bg-purple-500 text-white px-6 py-2 rounded-xl disabled:opacity-50"
                            >
                                Generate with Prompt
                            </button>
                        </div>

                        {showPromptInput && (
                            <div className="flex flex-col gap-2 w-full max-w-lg">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => {
                                            setPrompt(e.target.value);
                                            if (promptError) setPromptError("");
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && generateOutfitWithPrompt()}
                                        placeholder='e.g. "casual streetwear for cold weather"'
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

                                {promptError && (
                                    <p className="text-red-500 text-sm text-center">{promptError}</p>
                                )}
                            </div>
                        )}

                    </div>

                    {/* AI warning: missing wardrobe sections */}
                    {outfitWarning && (
                        <div className="mb-4 text-center text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-md mx-auto">
                            {outfitWarning}
                        </div>
                    )}

                    {outfit && (
                        <div className="flex flex-col items-center gap-5">

                            {outfit.outerwear && <img src={outfit.outerwear.imageUrl} className="w-36 h-36 rounded-2xl shadow" alt="outerwear" />}
                            {outfit.top && <img src={outfit.top.imageUrl} className="w-44 h-44 rounded-2xl shadow" alt="top" />}
                            {outfit.bottom && <img src={outfit.bottom.imageUrl} className="w-44 h-44 rounded-2xl shadow" alt="bottom" />}
                            {outfit.footwear && <img src={outfit.footwear.imageUrl} className="w-40 h-40 rounded-2xl shadow" alt="footwear" />}
                            {outfit.accessory && <img src={outfit.accessory.imageUrl} className="w-24 h-24 rounded-xl shadow" alt="accessory" />}

                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 px-5 py-4 rounded-2xl shadow-sm max-w-md text-center">
                                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">AI Stylist Insight</p>
                                <p className="text-gray-800 text-sm leading-relaxed font-medium">{outfit.reason}</p>
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

                    {/* Drop error toast */}
                    {dropError && (
                        <div className="mb-4 text-center text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 max-w-md mx-auto transition-all">
                            {dropError}
                        </div>
                    )}

                    <div className="flex gap-12 justify-center items-start flex-wrap">

                        {/* LEFT — Wardrobe palette */}
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 text-center">Your Wardrobe</p>
                            <Droppable droppableId="wardrobe" isDropDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="grid grid-cols-3 gap-3 max-w-xs"
                                    >
                                        {clothes.map((item, index) => (
                                            <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        title={`${item.type} (${item.category})`}
                                                        className={`relative rounded-xl overflow-hidden cursor-grab border-2 transition-all ${snapshot.isDragging
                                                            ? "border-blue-400 shadow-xl scale-105"
                                                            : "border-transparent hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <img
                                                            src={item.imageUrl}
                                                            className="w-20 h-20 object-cover"
                                                            alt={item.type}
                                                        />
                                                        <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-black/50 text-white py-0.5 truncate">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>

                        {/* RIGHT — Builder slots */}
                        <div className="flex flex-col items-center gap-5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Drag items here</p>

                            {[
                                { key: "outerwear", label: "Outerwear", required: false },
                                { key: "top", label: "Top ✱", required: true },
                                { key: "bottom", label: "Bottom ✱", required: true },
                                { key: "footwear", label: "Footwear ✱", required: true },
                                { key: "accessory", label: "Accessory", required: false },
                            ].map(({ key, label, required }) => (
                                <Droppable droppableId={key} key={key}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`w-44 h-44 border-2 rounded-2xl flex flex-col items-center justify-center relative transition-all ${snapshot.isDraggingOver
                                                ? "border-blue-400 bg-blue-50 scale-105"
                                                : required
                                                    ? "border-dashed border-gray-300"
                                                    : "border-dotted border-gray-200"
                                                }`}
                                        >
                                            {builder[key] ? (
                                                <>
                                                    <img
                                                        src={builder[key].imageUrl}
                                                        className="w-full h-full object-cover rounded-2xl"
                                                        alt={builder[key].type}
                                                    />
                                                    {/* Clear button */}
                                                    <button
                                                        onClick={() => setBuilder(prev => ({ ...prev, [key]: null }))}
                                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                                                        title="Remove"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            ) : (
                                                <p className={`text-sm ${required ? "text-gray-500 font-medium" : "text-gray-300"}`}>
                                                    {label}
                                                </p>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}

                            <div className="flex flex-col items-center gap-3 mt-2 w-full">
                                <input
                                    placeholder="Outfit name (optional)"
                                    value={outfitName}
                                    onChange={(e) => setOutfitName(e.target.value)}
                                    className="border border-gray-300 px-4 py-2 rounded-xl text-sm w-full text-center focus:outline-none focus:ring-2 focus:ring-green-300"
                                />
                                <button
                                    onClick={saveOutfit}
                                    className="bg-green-500 text-white px-6 py-2 rounded-xl w-full hover:bg-green-600 transition-colors"
                                >
                                    Save Outfit 💾
                                </button>
                            </div>
                        </div>

                    </div>

                </DragDropContext>
            )}

            {/* ================= SAVED ================= */}
            {view === "saved" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {savedOutfits.length === 0 && (
                        <p className="text-gray-400 col-span-full text-center py-12">No saved outfits yet.</p>
                    )}

                    {savedOutfits.map(saved => {
                        const top = clothes.find(c => c.id === saved.topId);
                        const bottom = clothes.find(c => c.id === saved.bottomId);
                        const footwear = clothes.find(c => c.id === saved.footwearId);
                        const outerwear = clothes.find(c => c.id === saved.outerwearId);
                        const accessory = clothes.find(c => c.id === saved.accessoryId);

                        if (!top || !bottom || !footwear) return null;

                        return (
                            <div key={saved.id} className="bg-white p-5 rounded-2xl shadow flex flex-col items-center gap-2">

                                {outerwear && <img src={outerwear.imageUrl} className="w-20 h-20 object-cover rounded-xl" alt="outerwear" />}
                                <img src={top.imageUrl} className="w-24 h-24 object-cover rounded-xl" alt="top" />
                                <img src={bottom.imageUrl} className="w-24 h-24 object-cover rounded-xl" alt="bottom" />
                                <img src={footwear.imageUrl} className="w-24 h-24 object-cover rounded-xl" alt="footwear" />
                                {accessory && <img src={accessory.imageUrl} className="w-16 h-16 object-cover rounded-lg" alt="accessory" />}

                                <p className="mt-2 font-semibold text-center">
                                    {saved.name || `Outfit #${saved.id}`}
                                </p>

                                <button
                                    onClick={() => deleteOutfit(saved.id)}
                                    className="text-red-400 text-sm hover:text-red-600 transition-colors mt-1"
                                >
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