// src/components/dashboard/MemberView.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; 
import { ArrowRightLeft, FileBarChart, UserCircle, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

const TRANSLATIONS = {
  EN: {
    accountSummary: "Account Summary",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    totalShares: "Total Share Capital",
    lastPaid: "Last Paid Share",
    asOf: "on", 
    transactions: "Transactions",
    transactionsDesc: "View your latest credit/debit history and account balance.",
    statementDetails: "Statement Details",
    passbook: "Passbook & Reports",
    passbookDesc: "Generate official monthly reports or download your e-passbook.",
    downloadCenter: "Download Center",
    profile: "My Profile",
    profileDesc: "View your personal information, KYC, and nominee details.",
    viewProfile: "View Profile",
    errorMsg: "Unable to load account details.",
    retry: "Retry", 
  },
  MR: {
    accountSummary: "खाते सारांश",
    status: "स्थिती",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    totalShares: "एकूण भाग भांडवल",
    lastPaid: "शेवटचा जमा वाटा",
    asOf: "रोजी", 
    transactions: "व्यवहार",
    transactionsDesc: "तुमचा अलीकडील जमा/खर्च इतिहास आणि खात्यातील शिल्लक पहा.",
    statementDetails: "स्टेटमेंट तपशील",
    passbook: "पासबुक आणि अहवाल",
    passbookDesc: "अधिकृत मासिक अहवाल तयार करा किंवा तुमचे ई-पासबुक डाउनलोड करा.",
    downloadCenter: "डाउनलोड सेंटर",
    profile: "माझी प्रोफाईल",
    profileDesc: "तुमची वैयक्तिक माहिती, केवायसी आणि वारसाचे (Nominee) तपशील पहा.",
    viewProfile: "प्रोफाईल पहा",
    errorMsg: "खाते तपशील लोड करण्यात अक्षम.", 
    retry: "पुन्हा प्रयत्न करा", 
  },
};

// UTILITY: Format numbers to Indian Rupee (INR) securely
const formatINR = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  const numericAmount = Number(amount.toString().replace(/[^0-9.-]+/g, ""));
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, 
  }).format(numericAmount || 0);
};

// UTILITY: Format date nicely
const formatDate = (dateString, lang) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'MR' ? 'mr-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString; 
  }
};

export default function MemberView() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [memberData, setMemberData] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 🛡️ ENTERPRISE FIX: If data is corrupted, fail fast and show error.
    if (!user?.account_number) {
      setHasError(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const [memberRes, txRes] = await Promise.all([
          fetch(`${API_BACKEND}/api/v1/members/${user.account_number}`, {
            method: "GET",
            credentials: "include", 
            signal: controller.signal
          }),
          fetch(`${API_BACKEND}/api/v1/transactions/${user.account_number}/latest`, {
            method: "GET",
            credentials: "include", 
            signal: controller.signal
          }).catch(() => ({ ok: false })) 
        ]);

        if (!memberRes.ok) throw new Error("Failed to fetch member data");
        
        const memberJson = await memberRes.json();
        setMemberData(memberJson);

        if (txRes.ok) {
          const txJson = await txRes.json();
          setLastTx(txJson);
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Network error fetching dashboard data:", err);
          setHasError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    return () => controller.abort();
  }, [user?.account_number]);

  // ========================================================
  // RENDER PIPELINE (Strict Enforcement)
  // ========================================================

  // 1. ERROR STATE (Checked first to prevent rendering broken UI)
  if (hasError) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium text-sm">{t.errorMsg}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="ml-auto text-xs font-bold underline hover:text-red-800"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  // 2. LOADING STATE (Hard Gate: Blocks render if loading OR data is missing)
  if (loading || !memberData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-500 font-medium">
          {language === "EN" ? "Loading your dashboard..." : "तुमचा डॅशबोर्ड लोड होत आहे..."}
        </p>
      </div>
    );
  }

  // 3. SAFE TO RENDER DASHBOARD
  const isActive = memberData.is_active === true;
  const totalSharesFormatted = formatINR(memberData.balance);
  const lastPaidFormatted = formatINR(lastTx?.amount); 
  const lastPaidDateFormatted = formatDate(lastTx?.created_at || memberData.joining_date, language);

  const dashboardCards = [
    {
      id: "profile",
      title: t.profile,
      description: t.profileDesc,
      href: "/profile", 
      buttonText: t.viewProfile,
      icon: UserCircle,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      id: "transactions",
      title: t.transactions,
      description: t.transactionsDesc,
      href: "/transactions",
      buttonText: t.statementDetails,
      icon: ArrowRightLeft,
      iconBg: "bg-blue-50",
      iconColor: "text-brand-blue",
    },
    {
      id: "passbook",
      title: t.passbook,
      description: t.passbookDesc,
      href: "/reports",
      buttonText: t.downloadCenter,
      icon: FileBarChart,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 fill-mode-both">
      {/* --- ACCOUNT SUMMARY HIGHLIGHT --- */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          {isActive ? (
            <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} aria-hidden="true" />
            </div>
          ) : (
            <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <XCircle size={24} aria-hidden="true" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.status}</p>
            <p className={`text-lg font-extrabold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? t.active : t.inactive}
            </p>
          </div>
        </div>

        <div className="h-px w-full md:w-px md:h-12 bg-gray-100 hidden md:block" aria-hidden="true"></div>

        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.totalShares}</p>
          <p className="text-2xl font-extrabold text-brand-navy font-numeric">{totalSharesFormatted}</p>
        </div>

        <div className="h-px w-full md:w-px md:h-12 bg-gray-100 hidden md:block" aria-hidden="true"></div>

        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.lastPaid}</p>
          <p className="text-lg font-extrabold text-brand-navy font-numeric">{lastPaidFormatted}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {language === "EN" ? `${t.asOf} ${lastPaidDateFormatted}` : `${lastPaidDateFormatted} ${t.asOf}`}
          </p>
        </div>
      </div>

      {/* --- CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          
          return (
            <div 
              key={card.id} 
              className="bg-white border border-gray-100 p-6 xl:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className={`h-14 w-14 ${card.iconBg} ${card.iconColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={28} aria-hidden="true" />
              </div>
              
              <h2 className="text-xl font-bold text-brand-navy mb-2">
                {card.title}
              </h2>
              
              <p className="text-gray-500 text-sm mb-6 leading-relaxed grow">
                {card.description}
              </p>
              
              <Link 
                href={card.href} 
                className="bg-gray-50 hover:bg-gray-100 text-brand-navy px-4 py-3 rounded-lg text-sm font-bold transition-colors inline-block text-center w-max"
              >
                {card.buttonText}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}