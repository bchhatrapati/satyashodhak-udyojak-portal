"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  History,
  FileBarChart,
  ShieldCheck,
} from "lucide-react";

/**
 * ============================================================
 * SATYASHODHAK UDYOJAK PORTAL - ROLE BASED SIDEBAR
 * ============================================================
 */

// 🔐 Replace with real AuthContext later
const currentUserRole = "admin"; // "admin" | "member"

export default function Sidebar() {
  const pathname = usePathname();
  const { language } = useLanguage(); // 🔥 Global language

  // --- ADMIN MENU ---
  const adminMenu = [
    { name: "Dashboard", mr: "डॅशबोर्ड", path: "/", icon: LayoutDashboard },
    { name: "Register Member", mr: "सभासद नोंदणी", path: "/register", icon: UserPlus },
    { name: "Members", mr: "सभासद", path: "/members", icon: Users },
    { name: "Transactions", mr: "व्यवहार", path: "/transactions", icon: History },
    { name: "Reports", mr: "अहवाल", path: "/reports", icon: FileBarChart },
  ];

  // --- MEMBER MENU ---
  const memberMenu = [
    { name: "My Dashboard", mr: "माझा डॅशबोर्ड", path: "/", icon: LayoutDashboard },
    { name: "My Transactions", mr: "माझे व्यवहार", path: "/transactions", icon: History },
    { name: "My Reports", mr: "माझे अहवाल", path: "/reports", icon: FileBarChart },
  ];

  const menuItems =
    currentUserRole === "admin" ? adminMenu : memberMenu;

  return (
    <aside
      className="hidden lg:flex flex-col w-72 bg-brand-navy h-screen sticky top-0 text-white shadow-2xl border-r border-white/10"
      role="navigation"
      aria-label="Sidebar Navigation"
    >
      {/* ================= HEADER ================= */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={22} className="text-blue-300" />
          <h1 className="text-headline font-bold tracking-wide">
            Satyashodhak
          </h1>
        </div>

        <p className="text-xs text-blue-300 uppercase tracking-widest opacity-80 font-semibold">
          Udyojak Portal
        </p>

        <div className="mt-4">
          <span className="text-[10px] bg-white/10 text-white/90 border border-white/20 px-2 py-1 rounded-md font-bold tracking-tighter uppercase">
            Access: {currentUserRole}
          </span>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === "/"
              ? pathname === "/"
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-brand-blue text-white shadow-lg border-l-4 border-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-white"
                    : "text-white/40 group-hover:text-white transition-colors"
                }
              />

              {/* 🔥 FIXED: Show only selected language */}
              <span className="text-body font-semibold">
                {language === "EN" ? item.name : item.mr}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="p-6 border-t border-white/10 text-[10px] text-blue-200 bg-white/5 tabular-nums">
        <p className="font-medium">
          © {new Date().getFullYear()} Satyashodhak Society
        </p>
        <p className="mt-1 opacity-70 tracking-widest uppercase">
          Version 1.0 • Enterprise Grade
        </p>
      </div>
    </aside>
  );
}