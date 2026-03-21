import { useState } from "react";
import PageLayout from "../layouts/PageLayout";
import ClothingCard from "../components/ClothingCard";
import API from "../services/api";
import { useEffect, useRef } from "react";

export default function Wardrobe() {

    const [clothes, setClothes] = useState([]);

    const [formData, setFormData] = useState({
        category: "",
        color: "",
        season: "",
    });

    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    const [mode, setMode] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        fetchClothes();
    }, []);

    const fetchClothes = async () => {
        try {
            const response = await API.get("/api/clothing");
            setClothes(response.data);
        } catch (error) {
            console.error("Error fetching clothes:", error);
        }
    };

    //  AI ANALYSIS
    const handleUpload = async (e) => {

        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        setMode("analyzing");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await API.post("/api/clothing/analyze", formData);

            const aiData = response.data;

            setFormData({
                category: aiData.category,
                color: aiData.color,
                season: aiData.season,
            });

        } catch (error) {
            console.error("AI error:", error);
        }

        setMode("");
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = (item) => {
        setEditingItem(item);

        setFormData({
            category: item.category,
            color: item.color,
            season: item.season
        });

        setImage(null); // 🚨 important

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    //  SAVE / UPDATE
    const addClothing = async () => {

        setMode("saving");

        try {

            // 🔥 UPDATE MODE
            if (editingItem) {

                await API.put(`/api/clothing/${editingItem.id}`, formData);

            } else {

                if (!image) {
                    setError("Please upload an image");
                    setMode("");
                    return;
                }

                const imageUrl = await uploadImage(image);

                const formDataToSend = new FormData();
                formDataToSend.append("file", image);
                formDataToSend.append("imageUrl", imageUrl);

                //  SEND USER VALUES (CRITICAL FIX)
                formDataToSend.append("category", formData.category);
                formDataToSend.append("color", formData.color);
                formDataToSend.append("season", formData.season);

                await API.post("/api/clothing/upload", formDataToSend);
            }

            fetchClothes();

            // reset
            setImage(null);
            setEditingItem(null);
            setFormData({ category: "", color: "", season: "" });

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error) {
            console.error(error);
        }

        setMode("");
    };

    const uploadImage = async (file) => {

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "wearwise");

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dadny2h6g/image/upload",
            {
                method: "POST",
                body: data
            }
        );

        const result = await response.json();

        return result.secure_url;
    };

    const deleteClothing = async (id) => {
        try {
            await API.delete(`/api/clothing/${id}`);
            fetchClothes();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const filteredClothes =
        filter === "All"
            ? clothes
            : clothes.filter((item) => item.category === filter);

    return (
        <PageLayout title="My Wardrobe">

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">

                <h2 className="font-semibold mb-4">
                    {editingItem ? "Edit Clothing" : "Add Clothing"}
                </h2>

                <div className="grid md:grid-cols-4 gap-4">

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="border p-2 rounded-lg"
                    />

                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border p-2 rounded-lg"
                    >
                        <option value="">Category</option>
                        <option>Shirt</option>
                        <option>Pants</option>
                        <option>Shoes</option>
                        <option>Jacket</option>
                    </select>

                    <input
                        name="color"
                        placeholder="Color"
                        value={formData.color}
                        onChange={handleChange}
                        className="border p-2 rounded-lg"
                    />

                    <select
                        name="season"
                        value={formData.season}
                        onChange={handleChange}
                        className="border p-2 rounded-lg"
                    >
                        <option value="">Season</option>
                        <option>Summer</option>
                        <option>Winter</option>
                        <option>All Season</option>
                    </select>

                </div>

                {error && (
                    <p className="text-red-500 text-sm mt-3">
                        {error}
                    </p>
                )}

                <button
                    onClick={addClothing}
                    disabled={mode !== ""}
                    className="mt-4 bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition"
                >
                    {mode === "analyzing"
                        ? "Analyzing with AI..."
                        : mode === "saving"
                            ? "Saving..."
                            : editingItem
                                ? "Update Item"
                                : "Add Item"}
                </button>

            </div>

            {clothes.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg">Your wardrobe is empty</p>
                    <p className="text-sm">Add your first clothing item</p>
                </div>
            )}

            <div className="flex gap-3 mb-6 flex-wrap">
                {["All", "Shirt", "Pants", "Shoes", "Jacket"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg border transition ${filter === type
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {clothes.length > 0 && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredClothes.map((item) => (
                        <ClothingCard
                            key={item.id}
                            item={item}
                            onDelete={deleteClothing}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

        </PageLayout>
    );
}