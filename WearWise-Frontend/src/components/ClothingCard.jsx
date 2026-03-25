export default function ClothingCard({ item, onDelete, onEdit }) {
    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition duration-300">

            {/* IMAGE */}
            <div className="relative">
                <img
                    src={item.imageUrl || "https://via.placeholder.com/300"}
                    alt="clothing"
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                />

                {/* 🔥 HOVER OVERLAY */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">

                    <button
                        onClick={() => onEdit(item)}
                        className="bg-white px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition"
                    >
                        Edit
                    </button>

                    <button
                        onClick={() => onDelete(item.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition"
                    >
                        Delete
                    </button>

                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4">

                {/* TITLE */}
                <p className="font-semibold text-lg truncate">
                    {item.type || item.category}
                </p>

                {/* CATEGORY TAG */}
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {item.category}
                </p>

                {/* DETAILS */}
                <p className="text-sm text-gray-600 mt-1 truncate">
                    {item.color} • {item.season}
                </p>

                {/* EXTRA TAGS */}
                <div className="flex gap-2 mt-2 flex-wrap">

                    {item.gender && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {item.gender}
                        </span>
                    )}

                    {item.occasion && (
                        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">
                            {item.occasion}
                        </span>
                    )}

                </div>

            </div>
        </div>
    );
}