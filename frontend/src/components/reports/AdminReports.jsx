// src/components/reports/AdminReports.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Download, FileText, Calendar, ArrowDownRight, ArrowUpRight, 
  Loader2, AlertCircle, Search, User
} from "lucide-react";

const TRANSLATIONS = {
  // ... (Keep your exact TRANSLATIONS object here)
  EN: {
    ledgerTitle: "Global System Ledger",
    downloadBtn: "Export Ledger (CSV)",
    searchPlaceholder: "Search by Account No. or Receipt...",
    date: "Date",
    account: "Account No.",
    receipt: "Receipt No.",
    type: "Type",
    credit: "Credit (In)",
    debit: "Debit (Out)",
    balance: "Member Balance",
    noData: "No transactions found matching your search.",
    errorMsg: "Failed to load global ledger data.",
    retry: "Retry",
    loadMore: "Load More Transactions", // Added for pagination
    deposit: "Deposit",
    share_capital: "Share Capital",
    interest: "Interest",
    withdrawal: "Withdrawal",
    installment: "Loan Installment",
    penalty: "Penalty"
  },
  MR: {
    ledgerTitle: "ग्लोबल सिस्टम लेजर",
    downloadBtn: "लेजर एक्सपोर्ट करा (CSV)",
    searchPlaceholder: "खाते क्र. किंवा पावती शोधा...",
    date: "तारीख",
    account: "खाते क्र.",
    receipt: "पावती क्र.",
    type: "प्रकार",
    credit: "जमा (In)",
    debit: "नावे (Out)",
    balance: "सदस्य शिल्लक",
    noData: "तुमच्या शोधाशी जुळणारे कोणतेही व्यवहार आढळले नाहीत.",
    errorMsg: "ग्लोबल लेजर डेटा लोड करण्यात अक्षम.",
    retry: "पुन्हा प्रयत्न करा",
    loadMore: "अधिक व्यवहार लोड करा", // Added for pagination
    deposit: "ठेव (Deposit)",
    share_capital: "भाग भांडवल (Share Capital)",
    interest: "व्याज (Interest)",
    withdrawal: "पैसे काढले (Withdrawal)",
    installment: "कर्ज हप्ता (Installment)",
    penalty: "दंड (Penalty)"
  },
};

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
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString));
  } catch {
    return dateString; 
  }
};

export default function AdminReports() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🛡️ Restored Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const fetchGlobalLedger = async (isLoadMore = false, overridePage = page) => {
    try {
      setLoading(true);
      setError(null);
      const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 🛡️ Pass search and pagination directly to the backend
      const params = new URLSearchParams({
        skip: overridePage * LIMIT,
        limit: LIMIT
      });
      if (searchTerm) params.append("search", searchTerm.trim());

      const response = await fetch(`${API_BACKEND}/api/v1/transactions/?${params.toString()}`, {
        method: "GET",
        credentials: "include", 
      });

      if (!response.ok) throw new Error("Failed to fetch global ledger");
      
      const data = await response.json();
      const safeData = Array.isArray(data) ? data : [];
      
      setHasMore(safeData.length === LIMIT);

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...safeData]);
      } else {
        setTransactions(safeData);
      }
      
    } catch (err) {
      console.error("Ledger fetch error:", err);
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") {
      setError("Unauthorized access.");
      setLoading(false);
      return;
    }

    // Reset pagination when search changes
    setPage(0);
    fetchGlobalLedger(false, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, searchTerm]); // Trigger fetch on search change

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGlobalLedger(true, nextPage);
  };

  const handleExportCSV = () => {
    alert("Global CSV Export Endpoint coming soon!");
  };

  // --- RENDER STATES (Unchanged) ---
  if (error && transactions.length === 0) {
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
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
            <FileText size={20} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy">{t.ledgerTitle}</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          {/* SEARCH BAR (Now triggers server-side fetch via useEffect) */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl hover:bg-blue-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download size={16} aria-hidden="true" /> {t.downloadBtn}
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          {/* ... (Keep your exact Desktop Header and Body mapping here) ... */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.date}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.account}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.receipt}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.type}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.credit}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.debit}</th>
              <th scope="col" className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.balance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-gray-500">{t.noData}</td>
              </tr>
            ) : (
              transactions.map((tx) => {
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
                    <td className="p-4 text-sm font-bold text-brand-blue">
                      <div className="flex items-center gap-1.5">
                        <User size={14} aria-hidden="true" />
                        {tx.account_number}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">{tx.receipt_no}</td>
                    <td className="p-4 text-sm font-semibold text-gray-700">
                      {t[txTypeSafe] || tx.transaction_type}
                    </td>
                    
                    <td className="p-4 text-sm font-bold text-green-600 text-right font-numeric">
                      {isCredit ? <span className="flex items-center justify-end gap-1"><ArrowDownRight size={14} aria-hidden="true"/> {formatINR(tx.amount)}</span> : "-"}
                    </td>
                    
                    <td className="p-4 text-sm font-bold text-red-600 text-right font-numeric">
                      {!isCredit ? <span className="flex items-center justify-end gap-1"><ArrowUpRight size={14} aria-hidden="true"/> {formatINR(tx.amount)}</span> : "-"}
                    </td>
                    
                    <td className="p-4 text-sm font-black text-gray-800 text-right font-numeric bg-gray-50/30">
                      {formatINR(tx.new_balance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden divide-y divide-gray-100">
        {transactions.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">{t.noData}</div>
        ) : (
          transactions.map((tx) => {
            const txTypeSafe = tx.transaction_type?.toLowerCase() || "";
            const isCredit = ["deposit", "share_capital", "interest"].includes(txTypeSafe);

            return (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-brand-blue rounded text-xs font-bold border border-blue-100">
                        {tx.account_number}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{tx.receipt_no}</span>
                    </div>
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
                {/* 🛡️ Restored Missing Balance Row for Mobile */}
                <div className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.balance}</span>
                  <span className="text-sm font-black text-gray-800">{formatINR(tx.new_balance)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION FOOTER */}
      {loading && (
         <div className="p-8 flex justify-center border-t border-gray-100">
           <Loader2 className="h-8 w-8 text-brand-blue animate-spin" />
         </div>
      )}

      {!loading && hasMore && transactions.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
          <button 
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white border border-gray-200 text-brand-navy font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            {t.loadMore}
          </button>
        </div>
      )}

    </div>
  );
}