// src/components/dashboard/StatsGrid.jsx
'use client';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext"; // Brought in LanguageContext

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

const TRANSLATIONS = {
  EN: {
    totalFunds: "Total Society Funds",
    totalMembers: "Total Members",
    active: "Active",
    inactive: "Inactive",
    fetchError: "Unable to load society statistics.",
    retry: "Retry"
  },
  MR: {
    totalFunds: "एकूण निधी",
    totalMembers: "एकूण सभासद",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    fetchError: "संस्थेची आकडेवारी लोड करण्यात अक्षम.",
    retry: "पुन्हा प्रयत्न करा"
  }
};

// UTILITY: Format numbers to Indian Rupee (INR) safely
const formatINR = (amount) => {
  // 1. Enterprise Fix: Safely default to ₹0 to prevent naked "0"s in the UI
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "₹0";
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export default function StatsGrid() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [stats, setStats] = useState({ 
    total_members: null, 
    active_members: null, 
    inactive_members: null,
    total_society_funds: null 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BACKEND}/api/v1/admin-stats`, { 
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error("Failed to fetch statistics");
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Stats fetch failed:", err);
          setError(t.fetchError); // 2. Localized error message
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [t.fetchError]); // Added t.fetchError to dependencies to keep linter happy

  if (error) {
    return (
      <div className="w-full mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="ml-auto text-xs font-bold underline hover:text-red-800"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  const cards = [
    { 
      label: t.totalFunds, 
      value: formatINR(stats.total_society_funds), 
      color: "text-emerald-500" 
    },
    { label: t.totalMembers, value: stats.total_members, color: "text-brand-navy" },
    { label: t.active, value: stats.active_members, color: "text-action-success" },
    { label: t.inactive, value: stats.inactive_members, color: "text-action-danger" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {card.label}
          </span>
          
          {loading ? (
            <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg"></div> 
          ) : (
            <h2 className={`text-4xl font-bold font-numeric ${card.color}`}>
              {/* Fallback handles normal numbers, formatINR handles currency */}
              {card.value ?? 0} 
            </h2>
          )}
        </div>
      ))}
    </div>
  );
}