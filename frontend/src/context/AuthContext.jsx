"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;
  
  // 🛡️ Refs
  const hasChecked = useRef(false);
  const lastActivity = useRef(Date.now()); 

  // --------------------------------------------------------
  // 1. LOGOUT ACTION
  // --------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      if (API_BACKEND) {
        await fetch(`${API_BACKEND}/api/v1/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      localStorage.setItem("logout_event", Date.now().toString());
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }, [API_BACKEND]);

  // --------------------------------------------------------
  // 2. SESSION RESTORE (The Handshake)
  // --------------------------------------------------------
  const checkUserStatus = useCallback(async () => {
    if (!API_BACKEND) {
      console.error("Critical Error: NEXT_PUBLIC_API_URL is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BACKEND}/api/v1/members/me`, {
        method: "GET",
        credentials: "include", 
      });

      if (response.ok) {
        const data = await response.json();
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

  // --------------------------------------------------------
  // 3. SILENT REFRESH FUNCTION
  // --------------------------------------------------------
  const silentRefresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_BACKEND}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Session expired");
      console.log("🔒 Session silently refreshed!");
      
    } catch (error) {
      console.error("Refresh failed, logging out:", error);
      logout(); 
    }
  }, [API_BACKEND, logout]);

  // ========================================================
  // 🚀 EFFECTS & LIFECYCLES
  // ========================================================

  // A. INITIAL MOUNT CHECK
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkUserStatus();
    }
  }, [checkUserStatus]);

  // B. MULTI-TAB LOGOUT SYNC
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "logout_event") {
        setUser(null);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // C. THE HEARTBEAT (13-Minute Token Refresh)
  useEffect(() => {
    if (!user) return; 

    const REFRESH_INTERVAL = 13 * 60 * 1000; 
    const intervalId = setInterval(() => {
      silentRefresh();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, silentRefresh]);

  // D. IDLE INACTIVITY TRACKER (15-Minute Auto-Logout)
  useEffect(() => {
    if (!user) return; 

    // 🛡️ ENTERPRISE FIX 2: Throttled Activity Tracking
    const updateActivity = () => {
      const now = Date.now();
      // Only update the ref if 1000ms (1 second) has passed since the last update
      if (now - lastActivity.current > 1000) {
        lastActivity.current = now;
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => 
      window.addEventListener(event, updateActivity, { passive: true })
    );

    const MAX_IDLE_TIME = 15 * 60 * 1000; 
    const idleCheckInterval = setInterval(() => {
      const timeSinceLastMove = Date.now() - lastActivity.current;
      
      if (timeSinceLastMove >= MAX_IDLE_TIME) {
        console.warn("🔒 Logging out due to 15 minutes of inactivity...");
        logout(); 
      }
    }, 60 * 1000); 

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(idleCheckInterval);
    };
  }, [user, logout]);

  // 🛡️ ENTERPRISE FIX 3: Memoized Context Value to prevent render waterfalls
  const contextValue = useMemo(() => ({
    user,
    setUser,
    logout,
    loading
  }), [user, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {/* 🛡️ ENTERPRISE FIX 1: Unconditional render allows AppShell to show its own Loader2 */}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}