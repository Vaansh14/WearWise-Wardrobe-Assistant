import { useState } from "react";
import PageLayout from "../layouts/PageLayout";
import ClothingCard from "../components/ClothingCard";

export default function Wardrobe() {

    const [clothes, setClothes] = useState([]);

    const [formData, setFormData] = useState({
        category: "",
        color: "",
        season: "",
    });

    const [image, setImage] = useState(null);

    const handleUpload = (e) => {
        setImage(e.target.files[0]);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const addClothing = () => {

        if (!image) return;

        const url = URL.createObjectURL(image);

        const newItem = {
            id: Date.now(),
            image: url,
            category: formData.category,
            color: formData.color,
            season: formData.season
        };

        setClothes([...clothes, newItem]);

        setFormData({
            category: "",
            color: "",
            season: ""
        });

        setImage(null);
    };

    return (
        <PageLayout title="My Wardrobe">

            {/* Upload Form */}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">

                <h2 className="font-semibold mb-4">Add Clothing</h2>

                <div className="grid md:grid-cols-4 gap-4">

                    <input
                        type="file"
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

                <button
                    onClick={addClothing}
                    className="mt-4 bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition"
                >
                    Add Item
                </button>

            </div>

            {/* Empty State */}

            {clothes.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg">Your wardrobe is empty</p>
                    <p className="text-sm">Add your first clothing item</p>
                </div>
            )}

            {/* Wardrobe Grid */}

            {clothes.length > 0 && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {clothes.map((item) => (
                        <ClothingCard key={item.id} item={item} />
                    ))}

                </div>
            )}

        </PageLayout>
    );
}