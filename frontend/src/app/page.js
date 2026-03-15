// src/app/page.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PlusCircle, Loader2, ShieldCheck } from "lucide-react";

import AdminView from "@/components/dashboard/AdminView";
import MemberView from "@/components/dashboard/MemberView";

const TRANSLATIONS = {
  EN: {
    societyOverview: "Society Overview",
    accountDashboard: "Account Dashboard",
    welcome: "Welcome,",
    registerMember: "Register Member",
    authSession: "Authenticating Session...",
  },
  MR: {
    societyOverview: "संस्थेचा आढावा",
    accountDashboard: "खाते डॅशबोर्ड",
    welcome: "स्वागत आहे,",
    registerMember: "सभासद नोंदणी",
    authSession: "सत्र प्रमाणित करत आहे...",
  },
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  // 🏛️ BANK GRADE GATEWAY SCREEN
  // NOTE: In a true enterprise setup, Next.js Middleware handles the redirect 
  // before we even hit this component. This loading state simply covers the 
  // split-second hydration of the user context.
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="h-20 w-20 bg-brand-navy rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-navy/20 mb-6">
            <ShieldCheck size={40} className="text-white animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 text-brand-navy font-bold tracking-widest text-xs uppercase">
            <Loader2 className="animate-spin text-brand-blue" size={18} aria-hidden="true" />
            {t.authSession}
          </div>
          <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-tighter">
            Satyashodhak Secure Gateway v1.0
          </p>
        </div>
      </div>
    );
  }

  // Safely check the role using optional chaining to prevent runtime crashes
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const displayName = user?.full_name || user?.name || "Member";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ================= HEADER & SHARED ACTIONS ================= */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">
            {isAdmin ? t.societyOverview : t.accountDashboard}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t.welcome} {displayName}
          </p>
        </div>

        {/* MOBILE-FIRST ACTION: Only Admins see this. Stretches full width on phones. */}
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

      {/* ================= CONTENT SECTION (ISOLATED) ================= */}
      <div className="grid grid-cols-1 gap-8">
        {isAdmin ? <AdminView /> : <MemberView />}
      </div>
    </div>
  );
}