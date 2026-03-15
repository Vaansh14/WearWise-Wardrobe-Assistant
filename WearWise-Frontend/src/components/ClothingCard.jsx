export default function ClothingCard({ item }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 group">

            <div className="overflow-hidden">
                <img
                    src={item.image}
                    className="h-64 w-full object-cover group-hover:scale-105 transition duration-300"
                />
            </div>

            <div className="p-4">

                <p className="font-semibold">{item.category}</p>

                <p className="text-sm text-gray-500">
                    {item.color} • {item.season}
                </p>

            </div>

        </div>
    );
}