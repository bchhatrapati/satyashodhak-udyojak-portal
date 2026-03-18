// src/app/reports/page.jsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AdminReports from "@/components/reports/AdminReports";
import MemberReports from "@/components/reports/MemberReports";
import { Loader2 } from "lucide-react";

// 1. Extracted nested ternaries into a clean dictionary
const TRANSLATIONS = {
  EN: {
    title: "Reports & Statements",
    adminDesc: "System-wide financial analytics and ledgers.",
    memberDesc: "Download your personal e-passbook and history.",
  },
  MR: {
    title: "अहवाल आणि स्टेटमेंट्स",
    adminDesc: "सिस्टम-व्यापी आर्थिक विश्लेषण आणि लेजर्स.",
    memberDesc: "तुमचे वैयक्तिक ई-पासबुक आणि इतिहास डाउनलोड करा.",
  },
};

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  // 2. Safely normalize the role to prevent capitalization bugs
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header that both roles share */}
      <header>
        <h1 className="text-3xl font-extrabold text-brand-navy">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {isAdmin ? t.adminDesc : t.memberDesc}
        </p>
      </header>

      {/* 🚦 THE TRAFFIC COP */}
      {isAdmin ? <AdminReports /> : <MemberReports />}
      
    </div>
  );
}