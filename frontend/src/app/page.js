"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PlusCircle, FileText, ArrowRightLeft } from "lucide-react";

import StatsGrid from "@/components/StatsGrid";
import MemberTable from "@/components/MemberTable";

export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6 animate-in fade-in duration-500">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">
            {language === "EN"
              ? isAdmin ? "Society Overview" : "My Account Overview"
              : isAdmin ? "संस्थेचा आढावा" : "माझ्या खात्याचा आढावा"}
          </h1>
          <p className="text-text-secondary">
            {language === "EN"
              ? `Welcome back, ${user.name}`
              : `परत स्वागत आहे, ${user.name}`}
          </p>
        </div>

        {/* Quick Action Buttons for Admin */}
        {isAdmin && (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => router.push('/register')}
              className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-navy transition-all active:scale-95 shadow-md"
            >
              <PlusCircle size={18} />
              {language === "EN" ? "New Member" : "नवीन सभासद"}
            </button>
          </div>
        )}
      </header>

      {/* ================= SHARED STATS ================= */}
      <StatsGrid />

      {/* ================= ADMIN VIEW ================= */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-navy">
                {language === "EN" ? "Recent Registered Members" : "नुकतेच नोंदणी केलेले सभासद"}
              </h2>
              <button 
                onClick={() => router.push('/members')}
                className="text-brand-blue text-sm font-semibold hover:underline"
              >
                {language === "EN" ? "View All" : "सर्व पहा"}
              </button>
            </div>
            {/* Table component with container for scrollability */}
            <div className="bg-app-surface rounded-card shadow-card border border-app-border overflow-hidden">
              <MemberTable limit={5} /> 
            </div>
          </section>
        </div>
      )}

      {/* ================= MEMBER VIEW ================= */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Access Cards for Members */}
          <div className="bg-app-surface border border-app-border p-6 rounded-card shadow-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4">
              <ArrowRightLeft size={24} />
            </div>
            <h2 className="text-lg font-bold text-brand-navy mb-2">
              {language === "EN" ? "Recent Transactions" : "अलीकडील व्यवहार"}
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              {language === "EN" 
                ? "Track your latest credits and debits here." 
                : "तुमचे अलीकडील जमा आणि खर्च येथे तपासा."}
            </p>
            <button onClick={() => router.push('/transactions')} className="text-brand-blue font-bold text-sm flex items-center gap-1">
              {language === "EN" ? "View Transactions" : "व्यवहार पहा"} →
            </button>
          </div>

          <div className="bg-app-surface border border-app-border p-6 rounded-card shadow-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <FileBarChart size={24} />
            </div>
            <h2 className="text-lg font-bold text-brand-navy mb-2">
              {language === "EN" ? "Download Reports" : "अहवाल डाउनलोड करा"}
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              {language === "EN" 
                ? "Generate your monthly statement or passbook." 
                : "तुमचे मासिक स्टेटमेंट किंवा पासबुक तयार करा."}
            </p>
            <button onClick={() => router.push('/reports')} className="text-brand-blue font-bold text-sm flex items-center gap-1">
              {language === "EN" ? "Open Reports" : "अहवाल उघडा"} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}