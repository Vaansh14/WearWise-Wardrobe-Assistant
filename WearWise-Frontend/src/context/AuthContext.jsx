import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await API.post("/api/auth/login", { email, password });
        const { token, name, email: userEmail } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify({ name, email: userEmail }));

        setToken(token);
        setUser({ name, email: userEmail });

        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await API.post("/api/auth/register", { name, email, password });
        const { token, name: userName, email: userEmail } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify({ name: userName, email: userEmail }));

        setToken(token);
        setUser({ name: userName, email: userEmail });

        return res.data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Remove legacy non-namespaced calendar keys (pre-isolation migration)
        localStorage.removeItem("gapi_access_token");
        localStorage.removeItem("gapi_token_expiry");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}