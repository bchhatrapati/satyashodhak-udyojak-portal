"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Download, FileText, Calendar, ArrowDownRight, ArrowUpRight, Loader2, AlertCircle 
} from "lucide-react";

const TRANSLATIONS = {
  EN: {
    passbookTitle: "My E-Passbook",
    downloadBtn: "Download PDF Statement",
    date: "Date",
    receipt: "Receipt No.",
    type: "Type",
    credit: "Credit (In)",
    debit: "Debit (Out)",
    balance: "Balance",
    noData: "No transactions found for this account.",
    errorMsg: "Failed to load passbook data.",
    retry: "Retry",
    
    // Transaction Types (Lowercase keys for normalized lookup)
    deposit: "Deposit",
    share_capital: "Share Capital",
    interest: "Interest",
    withdrawal: "Withdrawal",
    installment: "Loan Installment",
    penalty: "Penalty"
  },
  MR: {
    passbookTitle: "माझे ई-पासबुक",
    downloadBtn: "PDF स्टेटमेंट डाउनलोड करा",
    date: "तारीख",
    receipt: "पावती क्र.",
    type: "प्रकार",
    credit: "जमा (In)",
    debit: "नावे (Out)",
    balance: "शिल्लक",
    noData: "या खात्यासाठी कोणतेही व्यवहार आढळले नाहीत.",
    errorMsg: "पासबुक डेटा लोड करण्यात अक्षम.",
    retry: "पुन्हा प्रयत्न करा",

    // Transaction Types
    deposit: "ठेव (Deposit)",
    share_capital: "भाग भांडवल (Share Capital)",
    interest: "व्याज (Interest)",
    withdrawal: "पैसे काढले (Withdrawal)",
    installment: "कर्ज हप्ता (Installment)",
    penalty: "दंड (Penalty)"
  },
};

// UTILITIES
const formatINR = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  const numericAmount = Number(amount.toString().replace(/[^0-9.-]+/g, ""));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(numericAmount || 0);
};

const formatDate = (dateString, lang) => {
  if (!dateString) return "N/A";
  try {
    return new Intl.DateTimeFormat(lang === 'MR' ? 'mr-IN' : 'en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dateString));
  } catch {
    return dateString; 
  }
};

export default function MemberReports() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.account_number) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchPassbook = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${API_BACKEND}/api/v1/transactions/${user.account_number}`, {
          method: "GET",
          credentials: "include", 
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Failed to fetch transactions");
        
        const data = await response.json();
        
        // 🛡️ ENTERPRISE FIX 1: Prevent map crashes by strictly enforcing an array type
        setTransactions(Array.isArray(data) ? data : []);
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Passbook fetch error:", err);
          setError(t.errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPassbook();
    return () => controller.abort();
  }, [user?.account_number, t.errorMsg]);

  // --- HANDLERS ---
  const handleDownloadPDF = () => {
    alert("PDF Generation Endpoint coming soon!");
  };

  // --- RENDER STATES ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-500 font-medium">Loading passbook...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="ml-auto text-xs font-bold underline hover:text-red-800">
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* TOOLBAR HEADER */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
            <FileText size={20} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy">{t.passbookTitle}</h2>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl hover:bg-blue-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} aria-hidden="true" /> {t.downloadBtn}
        </button>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {/* 🛡️ ENTERPRISE FIX 3: Added scope="col" for screen readers */}
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.date}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.receipt}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.type}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.credit}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.debit}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.balance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">{t.noData}</td>
              </tr>
            ) : (
              transactions.map((tx) => {
                // 🛡️ ENTERPRISE FIX 2: Safely normalize strings from the DB
                const txTypeSafe = tx.transaction_type?.toLowerCase() || "";
                const isCredit = ["deposit", "share_capital", "interest"].includes(txTypeSafe);
                
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" aria-hidden="true" />
                        {formatDate(tx.created_at, language)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">{tx.receipt_no}</td>
                    <td className="p-4 text-sm font-semibold text-gray-700">
                      {/* Safely lookup translation */}
                      {t[txTypeSafe] || tx.transaction_type}
                    </td>
                    
                    {/* CREDIT COLUMN */}
                    <td className="p-4 text-sm font-bold text-green-600 text-right font-numeric">
                      {isCredit ? <span className="flex items-center justify-end gap-1"><ArrowDownRight size={14} aria-hidden="true"/> {formatINR(tx.amount)}</span> : "-"}
                    </td>
                    
                    {/* DEBIT COLUMN */}
                    <td className="p-4 text-sm font-bold text-red-600 text-right font-numeric">
                      {!isCredit ? <span className="flex items-center justify-end gap-1"><ArrowUpRight size={14} aria-hidden="true"/> {formatINR(tx.amount)}</span> : "-"}
                    </td>
                    
                    {/* RUNNING BALANCE */}
                    <td className="p-4 text-sm font-black text-brand-navy text-right font-numeric bg-gray-50/30">
                      {formatINR(tx.new_balance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (Responsive design fallback for small screens) */}
      <div className="md:hidden divide-y divide-gray-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.noData}</div>
        ) : (
          transactions.map((tx) => {
            const txTypeSafe = tx.transaction_type?.toLowerCase() || "";
            const isCredit = ["deposit", "share_capital", "interest"].includes(txTypeSafe);

            return (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">{tx.receipt_no}</p>
                    <p className="font-bold text-gray-900">{t[txTypeSafe] || tx.transaction_type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold flex items-center justify-end gap-1 ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? <ArrowDownRight size={14} aria-hidden="true"/> : <ArrowUpRight size={14} aria-hidden="true"/>}
                      {formatINR(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(tx.created_at, language)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.balance}</span>
                  <span className="text-sm font-black text-brand-navy">{formatINR(tx.new_balance)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}