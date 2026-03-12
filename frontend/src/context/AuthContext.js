"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;
  
  // 🛡️ Prevents double-firing in React 18 Strict Mode
  const hasChecked = useRef(false);

  // 🔍 1. SESSION RESTORE (The Handshake)
  const checkUserStatus = useCallback(async () => {
    // Fail-fast if the environment is misconfigured
    if (!API_BACKEND) {
      console.error("Critical Error: NEXT_PUBLIC_API_URL is not defined in environment variables.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BACKEND}/api/v1/members/me`, {
        method: "GET",
        credentials: "include", // 👈 Mandatory for HttpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        // data.user should match your FastAPI MeResponse schema
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth Handshake Failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API_BACKEND]);


  // 🚀 2. INITIAL MOUNT CHECK
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkUserStatus();
    }
  }, [checkUserStatus]);


  // 🔄 3. MULTI-TAB LOGOUT SYNC
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "logout_event") {
        setUser(null);
        // Only redirect if they are not already on the login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


  //  4. LOGOUT ACTION
  const logout = async () => {
    try {
      await fetch(`${API_BACKEND}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // Deterministic Cleanup: Wipe state regardless of server response
      setUser(null);
      localStorage.setItem("logout_event", Date.now().toString());
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {/* 
          🏦 BANK GUARD: 
          Prevents the app from rendering while we are verifying the user.
          This stops "flickering" of protected dashboard content.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 🛠️ CUSTOM HOOK
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}