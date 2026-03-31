import { useEffect, useState, useRef } from "react";
import PageLayout from "../layouts/PageLayout";
import API from "../services/api";

export default function Dashboard() {

    const [clothes, setClothes] = useState([]);
    const [outfit, setOutfit] = useState(null);
    const [weather, setWeather] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const hasGenerated = useRef(false);

    // ================= FETCH CLOTHES =================
    const fetchClothes = async () => {
        try {
            const res = await API.get("/api/clothing");
            setClothes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // ================= FETCH WEATHER =================
    const fetchWeather = async () => {
        try {
            const position = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject)
            );

            const { latitude, longitude } = position.coords;

            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );

            const data = await res.json();
            setWeather(data.current_weather);

        } catch (err) {
            console.error("Weather error:", err);
        }
    };

    // ================= FETCH CALENDAR EVENTS =================
    const fetchCalendarEvents = async (token) => {
        const res = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        // Token was rejected/expired — clear it so next visit re-authenticates
        if (data.error) {
            localStorage.removeItem("gapi_access_token");
            localStorage.removeItem("gapi_token_expiry");
            return;
        }

        const now = new Date();

        // Filter upcoming only
        const upcoming = (data.items || [])
            .filter(event => new Date(event.start?.dateTime || event.start?.date) >= now)
            .sort((a, b) =>
                new Date(a.start?.dateTime || a.start?.date) -
                new Date(b.start?.dateTime || b.start?.date)
            );

        setEvents(upcoming);
    };

    // ================= GOOGLE CALENDAR =================
    const initGoogleCalendar = async () => {
        try {
            const existingToken = localStorage.getItem("gapi_access_token");
            const tokenExpiry = localStorage.getItem("gapi_token_expiry");
            const isValid = existingToken && tokenExpiry && Date.now() < Number(tokenExpiry);

            if (isValid) {
                // Token still valid — fetch calendar silently, no popup
                await fetchCalendarEvents(existingToken);
                return;
            }

            // No valid token — prompt login once
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: "766920400079-abetaslvqkdf27o0tdo45j0vv2snlsfe.apps.googleusercontent.com",
                scope: "https://www.googleapis.com/auth/calendar.readonly",
                callback: async (tokenResponse) => {
                    // Save token + expiry (Google access tokens last ~1 hour)
                    localStorage.setItem("gapi_access_token", tokenResponse.access_token);
                    localStorage.setItem("gapi_token_expiry", Date.now() + tokenResponse.expires_in * 1000);

                    await fetchCalendarEvents(tokenResponse.access_token);
                }
            });

            tokenClient.requestAccessToken();

        } catch (err) {
            console.error("GOOGLE ERROR:", err);
        }
    };

    // ================= EVENT → OCCASION =================
    const getOccasionFromEvent = (name) => {
        const text = name.toLowerCase();

        if (text.includes("gym")) return "Gym";
        if (text.includes("meeting") || text.includes("lecture")) return "Formal";
        if (text.includes("party") || text.includes("dinner")) return "Party";

        return "Casual";
    };

    // ================= FETCH OUTFIT =================
    const fetchOutfit = async () => {

        if (!clothes.length || !weather || loading) return;

        const firstEvent = events[0];

        const occasion = firstEvent
            ? getOccasionFromEvent(firstEvent.summary)
            : "Casual";

        setLoading(true);

        try {
            const res = await API.post("/api/outfits/generate", {
                temperature: weather.temperature,
                windspeed: weather.windspeed,
                occasion
            });

            const ai = res.data;

            const mapped = {
                top: clothes[ai.top],
                bottom: clothes[ai.bottom],
                footwear: clothes[ai.footwear],
                outerwear: ai.outerwear !== null ? clothes[ai.outerwear] : null,
                accessory: ai.accessory !== null ? clothes[ai.accessory] : null,
                reason: ai.reason
            };

            setOutfit(mapped);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ================= INIT =================
    useEffect(() => {
        fetchClothes();
        fetchWeather();

        // Only silently fetch if we already have a valid token — no popup on load
        const existingToken = localStorage.getItem("gapi_access_token");
        const tokenExpiry = localStorage.getItem("gapi_token_expiry");
        const isValid = existingToken && tokenExpiry && Date.now() < Number(tokenExpiry);

        if (isValid) {
            fetchCalendarEvents(existingToken);
        }
    }, []);

    // ================= GENERATE OUTFIT =================
    useEffect(() => {
        if (
            clothes.length > 0 &&
            weather &&
            !outfit &&
            !hasGenerated.current
        ) {
            hasGenerated.current = true;
            fetchOutfit();
        }
    }, [clothes, weather, events]);

    return (
        <PageLayout title="Dashboard">

            <div className="grid md:grid-cols-3 gap-6">

                {/* ================= OUTFIT ================= */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Today's Outfit</h2>

                        <button
                            onClick={fetchOutfit}
                            disabled={loading}
                            className="text-sm text-blue-500 hover:underline disabled:opacity-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {(!weather || clothes.length === 0) && (
                        <p className="text-gray-400 text-sm">
                            Preparing your outfit...
                        </p>
                    )}

                    {loading && (
                        <p className="text-gray-400 text-sm">
                            Generating outfit...
                        </p>
                    )}

                    {!loading && outfit && (
                        <div className="flex flex-col items-center gap-4">

                            {outfit.outerwear && (
                                <img src={outfit.outerwear.imageUrl} className="w-20 h-20 rounded-xl shadow" />
                            )}

                            {outfit.top && (
                                <img src={outfit.top.imageUrl} className="w-28 h-28 rounded-xl shadow" />
                            )}

                            {outfit.bottom && (
                                <img src={outfit.bottom.imageUrl} className="w-28 h-28 rounded-xl shadow" />
                            )}

                            {outfit.footwear && (
                                <img src={outfit.footwear.imageUrl} className="w-24 h-24 rounded-xl shadow" />
                            )}

                            {outfit.accessory && (
                                <img src={outfit.accessory.imageUrl} className="w-16 h-16 rounded-lg shadow" />
                            )}

                            <p className="text-xs text-gray-500 text-center max-w-xs">
                                {outfit.reason}
                            </p>

                        </div>
                    )}

                </div>

                {/* ================= WEATHER ================= */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <h2 className="text-lg font-semibold mb-3">Weather</h2>

                    {weather ? (
                        <>
                            <p className="text-4xl font-bold">
                                {Math.round(weather.temperature)}°C
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                Wind: {weather.windspeed} km/h
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-400 text-sm">Loading weather...</p>
                    )}

                </div>

                {/* ================= EVENTS ================= */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Upcoming Events</h2>

                        {localStorage.getItem("gapi_access_token") && Date.now() < Number(localStorage.getItem("gapi_token_expiry")) ? (
                            <button
                                onClick={() => {
                                    localStorage.removeItem("gapi_access_token");
                                    localStorage.removeItem("gapi_token_expiry");
                                    setEvents([]);
                                }}
                                className="text-xs text-red-400 hover:underline"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={initGoogleCalendar}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                Connect Calendar
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">

                        {!localStorage.getItem("gapi_access_token") && (
                            <p className="text-gray-400">Connect your calendar to see events</p>
                        )}

                        {localStorage.getItem("gapi_access_token") && events.length === 0 && (
                            <p className="text-gray-400">No upcoming events</p>
                        )}

                        {events.map((event, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{event.summary}</span>
                                <span>
                                    {event.start?.dateTime
                                        ? new Date(event.start.dateTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })
                                        : "All Day"}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

            </div>

        </PageLayout>
    );
}