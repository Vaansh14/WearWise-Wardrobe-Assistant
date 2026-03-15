import PageLayout from "../layouts/PageLayout";

export default function Dashboard() {
    return (
        <PageLayout title="Dashboard">

            <div className="grid md:grid-cols-3 gap-6">

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-medium mb-2">Today's Outfit</h2>
                    <p className="text-gray-500 text-sm">
                        AI will recommend an outfit based on weather & events.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-medium mb-2">Weather</h2>
                    <p className="text-gray-500 text-sm">
                        Real-time weather based suggestions.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-medium mb-2">Upcoming Events</h2>
                    <p className="text-gray-500 text-sm">
                        Calendar events influence outfit suggestions.
                    </p>
                </div>

            </div>

        </PageLayout>
    );
}