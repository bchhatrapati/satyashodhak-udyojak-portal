// src/app/members/[account_number]/page.js
"use client";

import { useEffect, use } from "react"; // 🛡️ Added 'use'
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, ArrowLeft, HardHat, Clock } from "lucide-react";
import Link from "next/link";

const TRANSLATIONS = {
  EN: {
    back: "Back to Directory",
    title: "Feature Coming Soon",
    description: "The detailed member view and profile editing capabilities are currently under active development. Please check back later.",
  },
  MR: {
    back: "निर्देशिकेत परत जा",
    title: "वैशिष्ट्य लवकरच येत आहे",
    description: "सविस्तर सभासद दृश्य आणि प्रोफाईल संपादन क्षमता सध्या विकसित केल्या जात आहेत. कृपया नंतर तपासा.",
  }
};

export default function MemberDetailPage({ params }) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  // 🛡️ ENTERPRISE FIX 1: Unwrap the params Promise safely for Next.js App Router
  const unwrappedParams = use(params);
  const account_number = unwrappedParams.account_number;

  // 🛡️ Security Check: Only Admins can see this placeholder
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user?.role?.toLowerCase() !== "admin") {
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user?.role?.toLowerCase() !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 text-brand-blue animate-spin mb-4" aria-hidden="true" />
        {/* 🛡️ ENTERPRISE FIX 2: Consistent UX Loader */}
        <p className="text-gray-500 font-medium text-sm animate-pulse">
          Verifying access...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 🔙 Back Navigation */}
      <div className="flex items-center">
        <Link 
          href="/members" 
          className="flex items-center gap-2 text-brand-blue hover:text-blue-800 font-bold text-sm transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t.back}
        </Link>
      </div>

      {/* 🚧 Coming Soon State */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[60vh]">
        
        {/* Animated Icon Group */}
        <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
          <HardHat size={40} className="text-brand-blue" />
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
            <Clock size={20} className="text-orange-500 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-brand-navy mb-4">
          {t.title}
        </h1>
        
        <p className="text-gray-500 font-medium max-w-md mx-auto mb-8 leading-relaxed">
          {t.description}
        </p>

        {/* Displaying the ID proves the dynamic routing works */}
        <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 font-mono shadow-sm">
          TARGET ID: {account_number}
        </div>

      </div>
      
    </div>
  );
}