// src/components/layout/AppShell.jsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Loader2, ShieldCheck } from "lucide-react";

const TRANSLATIONS = {
  EN: { authenticating: "Authenticating Session...", gatewayVersion: "Satyashodhak Secure Gateway v1.0" },
  MR: { authenticating: "सत्र प्रमाणित करत आहे...", gatewayVersion: "सत्यशोधक सुरक्षित गेटवे v1.0" }
};

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  // 1. PUBLIC ROUTES (Removed /reset-password)
  // Now ONLY the login page bypasses the secure gateway.
  const publicRoutes = ["/login"];

  if (publicRoutes.includes(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  // 2. THE BANK-GRADE GATEWAY
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="h-20 w-20 bg-brand-navy rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-navy/20 mb-6">
            <ShieldCheck size={40} className="text-white animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 text-brand-navy font-bold tracking-widest text-xs uppercase">
            <Loader2 className="animate-spin text-brand-blue" size={18} aria-hidden="true" />
            {t.authenticating}
          </div>
          <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-tighter">
            {t.gatewayVersion}
          </p>
        </div>
      </div>
    );
  }

  // 3. SECURE AUTHENTICATED LAYOUT
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-app-bg text-foreground">
      <aside className="h-screen sticky top-0 z-50">
        <Sidebar />
      </aside>
      <div className="flex flex-1 flex-col min-w-0 h-screen relative">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}