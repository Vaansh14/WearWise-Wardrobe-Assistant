import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const CalendarContext = createContext(null);

const GOOGLE_CLIENT_ID = "766920400079-abetaslvqkdf27o0tdo45j0vv2snlsfe.apps.googleusercontent.com";

// Build user-specific localStorage keys so no two accounts ever share tokens
function buildKeys(email) {
    const safe = email.replace(/[^a-zA-Z0-9]/g, "_");
    return {
        tokenKey: `gapi_access_token_${safe}`,
        expiryKey: `gapi_token_expiry_${safe}`,
    };
}

export function CalendarProvider({ children }) {
    const { user } = useAuth();

    const [events, setEvents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // ── Re-runs every time the logged-in user identity changes ──────────────
    useEffect(() => {
        // Always wipe in-memory state first — prevents any cross-account leakage
        setEvents([]);
        setIsConnected(false);

        if (!user?.email) return;

        const { tokenKey, expiryKey } = buildKeys(user.email);
        const savedToken = localStorage.getItem(tokenKey);
        const savedExpiry = localStorage.getItem(expiryKey);
        const isValid = savedToken && savedExpiry && Date.now() < Number(savedExpiry);

        if (isValid) {
            // Same user just re-logged-in — silently restore their calendar
            fetchCalendarEvents(savedToken, user.email);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email]);

    // ── Fetch events from Google Calendar API ────────────────────────────────
    const fetchCalendarEvents = async (token, email) => {
        try {
            const res = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();

            if (data.error) {
                // Token expired / revoked — clear only THIS user's stored token
                const { tokenKey, expiryKey } = buildKeys(email);
                localStorage.removeItem(tokenKey);
                localStorage.removeItem(expiryKey);
                setIsConnected(false);
                setEvents([]);
                return;
            }

            const now = new Date();
            const upcoming = (data.items || [])
                .filter(e => new Date(e.start?.dateTime || e.start?.date) >= now)
                .sort((a, b) =>
                    new Date(a.start?.dateTime || a.start?.date) -
                    new Date(b.start?.dateTime || b.start?.date)
                );

            setEvents(upcoming);
            setIsConnected(true);
        } catch (err) {
            console.error("Calendar fetch error:", err);
        }
    };

    // ── Opens Google OAuth popup and stores token under the user's key ───────
    const connectCalendar = useCallback(() => {
        if (!user?.email) return;
        const email = user.email; // capture at call time

        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: "https://www.googleapis.com/auth/calendar.readonly",
                callback: async (tokenResponse) => {
                    const { tokenKey, expiryKey } = buildKeys(email);
                    localStorage.setItem(tokenKey, tokenResponse.access_token);
                    localStorage.setItem(
                        expiryKey,
                        Date.now() + tokenResponse.expires_in * 1000
                    );
                    await fetchCalendarEvents(tokenResponse.access_token, email);
                },
            });
            tokenClient.requestAccessToken();
        } catch (err) {
            console.error("Google Calendar connect error:", err);
        }
    }, [user?.email]);

    // ── Clears only THIS user's calendar token — other accounts untouched ────
    const disconnectCalendar = useCallback(() => {
        if (!user?.email) return;
        const { tokenKey, expiryKey } = buildKeys(user.email);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(expiryKey);
        setEvents([]);
        setIsConnected(false);
    }, [user?.email]);

    return (
        <CalendarContext.Provider
            value={{ events, isConnected, connectCalendar, disconnectCalendar }}
        >
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendar() {
    const ctx = useContext(CalendarContext);
    if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
    return ctx;
}