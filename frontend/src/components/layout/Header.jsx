// src/components/layout/Header.jsx
"use client";

import React, { useRef, useEffect, useMemo } from "react";
import Link from "next/link"; // 🛡️ ENTERPRISE FIX: Imported Next.js Link
import {
  Menu,
  Globe,
  User,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Header = ({ onMenuClick, notificationCount = 0 }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  if (!user) return null;

  const roleBadgeStyle = useMemo(() => {
    return user.role === "admin"
      ? "bg-brand-navy text-white"
      : "bg-gray-100 text-gray-500";
  }, [user.role]);

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        dropdownButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full h-16 bg-white border-b border-gray-100 
               flex items-center justify-between px-4 md:px-8 shadow-sm"
      role="banner"
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden min-h-touch min-w-touch flex items-center 
                   justify-center text-brand-navy hover:bg-gray-100 
                   rounded-lg transition active:scale-95"
          aria-label="Open Navigation Menu"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div className="hidden sm:block select-none">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-brand-navy">
              {language === "EN" ? "Satyashodhak" : "सत्यशोधक"}
            </span>{" "}
            <span className="text-brand-blue">
              {language === "EN" ? "Portal" : "पोर्टल"}
            </span>
          </h1>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-6">
        <button
          onClick={toggleLanguage}
          className="min-h-touch px-3 flex items-center gap-2 
                   text-gray-500 hover:text-brand-blue 
                   transition-colors group"
          aria-label={`Toggle language. Current language: ${language}`}
        >
          <Globe size={18} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
          <span className="font-bold text-sm uppercase tabular-nums">
            {language}
          </span>
        </button>

        <button
          className="relative min-h-touch min-w-touch flex items-center justify-center 
                   text-gray-500 hover:text-brand-blue transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
          {notificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-4.5 h-4.5
                       bg-red-500 text-white text-[10px]
                       rounded-full flex items-center justify-center px-1 tabular-nums animate-pulse font-bold"
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />

        {/* USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={dropdownButtonRef}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 min-h-touch pl-2 pr-1 
                     rounded-lg hover:bg-gray-50 transition-all"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="Open user menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                {user.full_name}
              </p>
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${roleBadgeStyle}`}
              >
                {user.role}
              </span>
            </div>

            <div
              className="h-9 w-9 bg-brand-navy text-white rounded-full 
                       flex items-center justify-center border-2 border-gray-100"
              aria-hidden="true"
            >
              <User size={18} />
            </div>

            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {/* DROPDOWN MENU */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white z-50
                       border border-gray-100 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2"
              role="menu"
            >
              {/* 🛡️ ENTERPRISE FIX: Converted to Next.js Link and added auto-close */}
              <Link 
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                role="menuitem"
              >
                <Settings size={16} aria-hidden="true" />
                {language === "EN" ? "Account Settings" : "खाते सेटिंग्ज"}
              </Link>

              <button
                onClick={handleLogoutClick}
                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} aria-hidden="true" />
                {language === "EN" ? "Sign Out" : "बाहेर पडा"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;