// src/components/layout/AppShell.jsx
"use client";

import { useState, useEffect } from "react"; // 🛡️ Added useEffect
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

  // 🛡️ State for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🛡️ ENTERPRISE FIX 1: Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 🛡️ ENTERPRISE FIX 2: Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    // Cleanup function in case component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const publicRoutes = ["/login"];

  if (publicRoutes.includes(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

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

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50 text-gray-900">
      
      {/* 📱 MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 🧭 SIDEBAR (Responsive) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Pass a prop so the Sidebar can close itself if a specific close button is clicked */}
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* 📄 MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0 h-screen relative">
        {/* 👈 Pass the open function to the Header */}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}