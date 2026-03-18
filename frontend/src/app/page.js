// src/app/page.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PlusCircle } from "lucide-react";

import AdminView from "@/components/dashboard/AdminView";
import MemberView from "@/components/dashboard/MemberView";

const TRANSLATIONS = {
  EN: {
    societyOverview: "Society Overview",
    accountDashboard: "Account Dashboard",
    welcome: "Welcome,",
    registerMember: "Register Member",
  },
  MR: {
    societyOverview: "संस्थेचा आढावा",
    accountDashboard: "खाते डॅशबोर्ड",
    welcome: "स्वागत आहे,",
    registerMember: "सभासद नोंदणी",
  },
};

export default function Dashboard() {
  const { user } = useAuth(); // No longer need 'loading' here!
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const displayName = user?.full_name || user?.name || "Member";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">
            {isAdmin ? t.societyOverview : t.accountDashboard}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t.welcome} {displayName}
          </p>
        </div>

        {/* MOBILE-FIRST ACTION */}
        {isAdmin && (
          <Link 
            href="/register"
            className="w-full md:w-auto group flex items-center justify-center gap-2 bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-950 transition-all shadow-lg shadow-brand-navy/10 active:scale-95"
          >
            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
            {t.registerMember}
          </Link>
        )}
      </header>

      {/* ================= CONTENT ================= */}
      <div className="grid grid-cols-1 gap-8">
        {isAdmin ? <AdminView /> : <MemberView />}
      </div>
    </div>
  );
}