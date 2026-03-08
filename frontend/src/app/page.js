"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PlusCircle, ArrowRightLeft, Loader2, ShieldCheck, FileBarChart } from "lucide-react";

import StatsGrid from "@/components/StatsGrid";
import MemberTable from "@/components/MemberTable";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user exists, escort to login immediately
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // 🏛️ BANK GRADE GATEWAY SCREEN
  // This shows instead of a blank page during the session check
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="h-20 w-20 bg-brand-navy rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-navy/20 mb-6">
            <ShieldCheck size={40} className="text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-3 text-brand-navy font-bold tracking-widest text-xs uppercase">
            <Loader2 className="animate-spin text-brand-blue" size={18} />
            Authenticating Session...
          </div>
          <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-tighter">
            Satyashodhak Secure Gateway v1.0
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">
            {language === "EN"
              ? isAdmin ? "Society Overview" : "Account Dashboard"
              : isAdmin ? "संस्थेचा आढावा" : "खाते डॅशबोर्ड"}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {language === "EN"
              ? `Welcome, ${user.full_name || user.name}`
              : `स्वागत आहे, ${user.full_name || user.name}`}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/register')}
              className="group flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-950 transition-all shadow-lg shadow-brand-navy/10 active:scale-95"
            >
              <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              {language === "EN" ? "Register Member" : "सभासद नोंदणी"}
            </button>
          </div>
        )}
      </header>

      {/* ================= STATS SECTION ================= */}
      <StatsGrid />

      {/* ================= CONTENT SECTION ================= */}
      <div className="grid grid-cols-1 gap-8">
        {isAdmin ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                <span className="h-5 w-1 bg-brand-blue rounded-full" />
                {language === "EN" ? "Recent Registrations" : "अलीकडील नोंदणी"}
              </h2>
              <button 
                onClick={() => router.push('/members')}
                className="text-brand-blue text-xs font-bold hover:text-brand-navy transition-colors uppercase tracking-widest"
              >
                {language === "EN" ? "View Directory" : "सर्व यादी"} →
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MemberTable limit={5} /> 
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <div className="h-14 w-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ArrowRightLeft size={28} />
              </div>
              <h2 className="text-xl font-bold text-brand-navy mb-2">
                {language === "EN" ? "Transactions" : "व्यवहार"}
              </h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {language === "EN" 
                  ? "View your latest credit/debit history and account balance." 
                  : "तुमचा अलीकडील जमा/खर्च इतिहास आणि खात्यातील शिल्लक पहा."}
              </p>
              <button onClick={() => router.push('/transactions')} className="bg-gray-50 hover:bg-gray-100 text-brand-navy px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                {language === "EN" ? "Statement Details" : "स्टेटमेंट तपशील"}
              </button>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileBarChart size={28} />
              </div>
              <h2 className="text-xl font-bold text-brand-navy mb-2">
                {language === "EN" ? "Passbook & Reports" : "पासबुक आणि अहवाल"}
              </h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {language === "EN" 
                  ? "Generate official monthly reports or download your e-passbook." 
                  : "अधिकृत मासिक अहवाल तयार करा किंवा तुमचे ई-पासबुक डाउनलोड करा."}
              </p>
              <button onClick={() => router.push('/reports')} className="bg-gray-50 hover:bg-gray-100 text-brand-navy px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                {language === "EN" ? "Download Center" : "डाउनलोड सेंटर"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}