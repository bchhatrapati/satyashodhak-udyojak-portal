// src/components/layout/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; 
import {
  LayoutDashboard,
  UserPlus,
  Users,
  History,
  FileBarChart,
  ShieldCheck,
  LogOut,
  LockKeyhole,
  UserCircle // 🛡️ Added for Profile Link
} from "lucide-react";

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user, logout } = useAuth(); 

  const currentUserRole = user?.role?.toLowerCase() || "member";
  const displayName = user?.full_name || user?.name || "Member";

  // --- ADMIN MENU ---
  const adminMenu = [
    { name: "Dashboard", mr: "डॅशबोर्ड", path: "/", icon: LayoutDashboard },
    { name: "Register Member", mr: "सभासद नोंदणी", path: "/register", icon: UserPlus },
    { name: "Members", mr: "सभासद", path: "/members", icon: Users },
    { name: "Transactions", mr: "व्यवहार", path: "/transactions", icon: History },
    { name: "Reports", mr: "अहवाल", path: "/reports", icon: FileBarChart },
    // 🛡️ ENTERPRISE FIX 1: Added Profile Route
    { name: "My Profile", mr: "माझी प्रोफाईल", path: "/profile", icon: UserCircle }, 
  ];

  // --- MEMBER MENU ---
  const memberMenu = [
    { name: "My Dashboard", mr: "माझा डॅशबोर्ड", path: "/", icon: LayoutDashboard },
    { name: "My Transactions", mr: "माझे व्यवहार", path: "/transactions", icon: History },
    { name: "My Reports", mr: "माझे अहवाल", path: "/reports", icon: FileBarChart },
    // 🛡️ ENTERPRISE FIX 1: Added Profile Route
    { name: "My Profile", mr: "माझी प्रोफाईल", path: "/profile", icon: UserCircle },
  ];

  const menuItems = currentUserRole === "admin" ? adminMenu : memberMenu;

  return (
    <aside
      // 🛡️ ENTERPRISE FIX 3: Added 'overflow-hidden' to prevent iOS flex-stretching
      className="flex flex-col w-72 bg-brand-navy h-full overflow-hidden text-white shadow-2xl border-r border-white/10"
      role="navigation"
      aria-label="Sidebar Navigation"
    >
      {/* ================= HEADER ================= */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={22} className="text-blue-300" aria-hidden="true" />
          <h1 className="text-xl font-bold tracking-wide">
            Satyashodhak
          </h1>
        </div>

        <p className="text-xs text-blue-300 uppercase tracking-widest opacity-80 font-semibold">
          Udyojak Portal
        </p>
        {/* 🛡️ ENTERPRISE FIX 2: Removed redundant top role badge to clean up UI */}
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose} 
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-brand-blue text-white shadow-lg border-l-4 border-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={20}
                className={isActive ? "text-white" : "text-white/40 group-hover:text-white transition-colors"}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold">
                {language === "EN" ? item.name : item.mr}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ================= FOOTER & USER ACTIONS ================= */}
      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="flex flex-col gap-3 mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold shadow-inner" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-blue-300 uppercase tracking-widest">{currentUserRole}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/reset-password"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <LockKeyhole size={14} aria-hidden="true" />
              <span>{language === "EN" ? "Password" : "पासवर्ड"}</span>
            </Link>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 py-2 px-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <LogOut size={14} aria-hidden="true" />
              <span>{language === "EN" ? "Logout" : "बाहेर पडा"}</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-blue-200 tabular-nums">
          <p className="font-medium">© {new Date().getFullYear()} Satyashodhak Society</p>
          <p className="mt-1 opacity-70 tracking-widest uppercase">Version 1.0 • Enterprise Grade</p>
        </div>
      </div>
    </aside>
  );
}