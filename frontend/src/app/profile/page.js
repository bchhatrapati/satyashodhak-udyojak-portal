// src/app/profile/page.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";

import UserProfile from "@/components/profile/UserProfile";

// 🛡️ ENTERPRISE FIX: Maintain architectural consistency with a Translation Dictionary
const TRANSLATIONS = {
  EN: {
    title: "My Profile",
    description: "View your personal, KYC, and account details.",
    loading: "Loading profile...",
  },
  MR: {
    title: "माझी प्रोफाईल",
    description: "तुमचे वैयक्तिक, केवायसी आणि खाते तपशील पहा.",
    loading: "प्रोफाईल लोड होत आहे...",
  },
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" aria-hidden="true" />
        <p className="text-gray-500 font-medium">
          {t.loading}
        </p>
      </div>
    );
  }

  // Middleware handles the redirect, but we return null to prevent flash of empty layout
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold text-brand-navy">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {t.description}
        </p>
      </header>

      {/* 🚀 Next Step: The actual profile UI */}
      <UserProfile />
    </div>
  );
}