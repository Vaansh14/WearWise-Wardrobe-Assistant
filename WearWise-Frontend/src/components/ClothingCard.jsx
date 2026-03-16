export default function ClothingCard({ item, onDelete, onEdit }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">

            <img
                src={item.imageUrl}
                alt="clothing"
                className="h-64 w-full object-cover"
            />

            <div className="p-4 flex justify-between items-center">

                <div>
                    <p className="font-semibold">{item.category}</p>
                    <p className="text-sm text-gray-500">
                        {item.color} • {item.season}
                    </p>
                </div>

                <button
                    onClick={() => onEdit(item)}
                    className="text-blue-500 hover:text-blue-700"
                >
                    Edit
                </button>

                <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-500 hover:text-red-700"
                >
                    Delete
                </button>

            </div>

        </div>
    );
}