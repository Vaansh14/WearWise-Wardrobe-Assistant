import { useState, useEffect, useRef } from "react";
import PageLayout from "../layouts/PageLayout";
import ClothingCard from "../components/ClothingCard";
import API from "../services/api";

export default function Wardrobe() {

    const [clothes, setClothes] = useState([]);

    const [formData, setFormData] = useState({
        category: "",
        type: "",
        color: "",
        season: "",
        gender: "",
        occasion: ""
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

    // 🔥 AI ANALYSIS (with clothing validation)
    const handleUpload = async (e) => {

        const file = e.target.files[0];
        if (!file) return;

        setError("");
        setMode("analyzing");

        try {
            const data = new FormData();
            data.append("file", file);

            const response = await API.post("/api/clothing/analyze", data);
            const ai = response.data;

            // ✅ Image validation guard
            if (ai.invalid === true) {
                setError("Please upload a clothing item");
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setMode("");
                return;
            }

            setImage(file);
            setFormData({
                category: ai.category || "",
                type: ai.type || "",
                color: ai.color || "",
                season: ai.season || "",
                gender: ai.gender || "",
                occasion: ai.occasion || ""
            });

        } catch (error) {
            console.error("AI error:", error);
            setError("Failed to analyze image. Please try again.");
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
            category: item.category || "",
            type: item.type || "",
            color: item.color || "",
            season: item.season || "",
            gender: item.gender || "",
            occasion: item.occasion || ""
        });

        setImage(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    //  SAVE / UPDATE
    const addClothing = async () => {

        setMode("saving");

        try {

            if (editingItem) {

                await API.put(`/api/clothing/${editingItem.id}`, formData);

            } else {

                if (!image) {
                    setError("Please upload an image");
                    setMode("");
                    return;
                }

                const imageUrl = await uploadImage(image);

                const data = new FormData();
                data.append("file", image);
                data.append("imageUrl", imageUrl);

                //  NEW FIELDS
                Object.keys(formData).forEach(key => {
                    data.append(key, formData[key]);
                });

                await API.post("/api/clothing/upload", data);
            }

            fetchClothes();

            setImage(null);
            setEditingItem(null);
            setFormData({
                category: "",
                type: "",
                color: "",
                season: "",
                gender: "",
                occasion: ""
            });

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
        data.append("upload_preset", "stylemate");

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dg6wknxgy/image/upload",
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

            {/* FORM */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-10">

                <h2 className="font-semibold mb-4">
                    {editingItem ? "Edit Clothing" : "Add Clothing"}
                </h2>

                <div className="grid md:grid-cols-3 gap-4">

                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="border p-2 rounded-lg" />

                    {/* CATEGORY */}
                    <select name="category" value={formData.category} onChange={handleChange} className="border p-2 rounded-lg">
                        <option value="">Category</option>
                        <option>Top</option>
                        <option>Bottom</option>
                        <option>Footwear</option>
                        <option>Outerwear</option>
                        <option>Accessory</option>
                    </select>

                    {/* TYPE */}
                    <input name="type" placeholder="Type (e.g. Hoodie, Skirt)" value={formData.type} onChange={handleChange} className="border p-2 rounded-lg" />

                    <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} className="border p-2 rounded-lg" />

                    <select name="season" value={formData.season} onChange={handleChange} className="border p-2 rounded-lg">
                        <option value="">Season</option>
                        <option>Summer</option>
                        <option>Winter</option>
                        <option>All Season</option>
                    </select>

                    <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded-lg">
                        <option value="">Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Unisex</option>
                    </select>

                    <select name="occasion" value={formData.occasion} onChange={handleChange} className="border p-2 rounded-lg">
                        <option value="">Occasion</option>
                        <option>Casual</option>
                        <option>Formal</option>
                        <option>Gym</option>
                        <option>Party</option>
                    </select>

                </div>

                {error && <p className="text-red-500 mt-3">{error}</p>}

                <button
                    onClick={addClothing}
                    disabled={mode !== ""}
                    className="mt-4 bg-black text-white px-6 py-2 rounded-xl"
                >
                    {mode === "analyzing" ? "Analyzing..." :
                        mode === "saving" ? "Saving..." :
                            editingItem ? "Update Item" : "Add Item"}
                </button>

            </div>

            {/* FILTER */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {["All", "Top", "Bottom", "Footwear", "Outerwear", "Accessory"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg border ${filter === type ? "bg-black text-white" : ""}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* GRID */}
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

        </PageLayout>
    );
}