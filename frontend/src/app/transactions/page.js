// src/app/transactions/page.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";

// We will build these two components next!
import AdminTransactions from "@/components/transactions/AdminTransactions";
import MemberTransactions from "@/components/transactions/MemberTransactions";

const TRANSLATIONS = {
  EN: {
    title: "Transactions",
    adminDesc: "Process new deposits, withdrawals, and account entries.",
    memberDesc: "View and filter your complete transaction history.",
    loading: "Loading transactions...", // 🛡️ Added loading text
  },
  MR: {
    title: "व्यवहार",
    adminDesc: "नवीन ठेवी, पैसे काढणे आणि खात्यातील नोंदी प्रक्रिया करा.",
    memberDesc: "तुमचा संपूर्ण व्यवहार इतिहास पहा आणि फिल्टर करा.",
    loading: "व्यवहार लोड होत आहेत...", // 🛡️ Added loading text
  },
};

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" aria-hidden="true" />
        {/* 🛡️ ENTERPRISE FIX: Added localized loading text for better UX */}
        <p className="text-gray-500 font-medium">
          {t.loading}
        </p>
      </div>
    );
  }

  // Fallback if someone reaches here without being logged in (Middleware handles the actual redirect)
  if (!user) return null;

  // Safely evaluate role to prevent capitalization bugs
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <header>
        <h1 className="text-3xl font-extrabold text-brand-navy">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {isAdmin ? t.adminDesc : t.memberDesc}
        </p>
      </header>

      {/* 🚦 THE TRAFFIC COP */}
      {isAdmin ? <AdminTransactions /> : <MemberTransactions />}
      
    </div>
  );
}   