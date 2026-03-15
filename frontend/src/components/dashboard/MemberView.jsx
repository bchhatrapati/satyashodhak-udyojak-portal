// src/components/dashboard/MemberView.jsx
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; 
import { ArrowRightLeft, FileBarChart, UserCircle, CheckCircle2, XCircle } from "lucide-react";

const TRANSLATIONS = {
  EN: {
    accountSummary: "Account Summary",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    totalShares: "Total Share Capital",
    lastPaid: "Last Paid Share",
    asOf: "on", // <-- Added translation
    transactions: "Transactions",
    transactionsDesc: "View your latest credit/debit history and account balance.",
    statementDetails: "Statement Details",
    passbook: "Passbook & Reports",
    passbookDesc: "Generate official monthly reports or download your e-passbook.",
    downloadCenter: "Download Center",
    profile: "My Profile",
    profileDesc: "View your personal information, KYC, and nominee details.",
    viewProfile: "View Profile",
  },
  MR: {
    accountSummary: "खाते सारांश",
    status: "स्थिती",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    totalShares: "एकूण भाग भांडवल",
    lastPaid: "शेवटचा जमा वाटा",
    asOf: "रोजी", // <-- Added translation
    transactions: "व्यवहार",
    transactionsDesc: "तुमचा अलीकडील जमा/खर्च इतिहास आणि खात्यातील शिल्लक पहा.",
    statementDetails: "स्टेटमेंट तपशील",
    passbook: "पासबुक आणि अहवाल",
    passbookDesc: "अधिकृत मासिक अहवाल तयार करा किंवा तुमचे ई-पासबुक डाउनलोड करा.",
    downloadCenter: "डाउनलोड सेंटर",
    profile: "माझी प्रोफाईल",
    profileDesc: "तुमची वैयक्तिक माहिती, केवायसी आणि वारसाचे (Nominee) तपशील पहा.",
    viewProfile: "प्रोफाईल पहा",
  },
};

// UTILITY: Format numbers to Indian Rupee (INR) securely
const formatINR = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  // Strip out any non-numeric characters just in case backend sends dirty data
  const numericAmount = Number(amount.toString().replace(/[^0-9.-]+/g, ""));
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // Set to 2 if you handle paisa
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
    return dateString; // Fallback to raw string if parsing fails
  }
};

export default function MemberView() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  // STRICT BUSINESS LOGIC: Default to inactive unless explicitly active
  const isActive = user?.status?.toLowerCase() === "active";
  
  // Cleanly formatted data
  const totalSharesFormatted = formatINR(user?.total_shares);
  const lastPaidFormatted = formatINR(user?.last_paid_amount);
  const lastPaidDateFormatted = formatDate(user?.last_paid_date, language);

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
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both">
      
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

        {/* Added aria-hidden to decorative dividers */}
        <div className="h-px w-full md:w-px md:h-12 bg-gray-100 hidden md:block" aria-hidden="true"></div>

        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.totalShares}</p>
          <p className="text-2xl font-extrabold text-brand-navy font-numeric">{totalSharesFormatted}</p>
        </div>

        <div className="h-px w-full md:w-px md:h-12 bg-gray-100 hidden md:block" aria-hidden="true"></div>

        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.lastPaid}</p>
          <p className="text-lg font-extrabold text-brand-navy font-numeric">{lastPaidFormatted}</p>
          {/* Handled translation correctly for Marathi vs English syntax */}
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