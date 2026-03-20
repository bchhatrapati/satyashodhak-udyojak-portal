// src/components/transactions/MemberTransactions.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowDownRight, ArrowUpRight, Loader2, AlertCircle, Filter } from "lucide-react";

const TRANSLATIONS = {
  EN: {
    all: "All",
    credits: "Credits (In)",
    debits: "Debits (Out)",
    noData: "No transactions found.",
    errorMsg: "Failed to load transactions.",
    balance: "Balance",
    retry: "Retry",
    loadMore: "Load Older Transactions", // 🛡️ Added translation
    deposit: "Deposit",
    share_capital: "Share Capital",
    interest: "Interest",
    withdrawal: "Withdrawal",
    installment: "Loan Installment",
    penalty: "Penalty"
  },
  MR: {
    all: "सर्व",
    credits: "जमा (In)",
    debits: "नावे (Out)",
    noData: "कोणतेही व्यवहार आढळले नाहीत.",
    errorMsg: "व्यवहार लोड करण्यात अक्षम.",
    balance: "शिल्लक",
    retry: "पुन्हा प्रयत्न करा",
    loadMore: "जुने व्यवहार लोड करा", // 🛡️ Added translation
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
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  } catch {
    return dateString; 
  }
};

export default function MemberTransactions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filter, setFilter] = useState("ALL"); 
  
  // 🛡️ ENTERPRISE FIX: Added Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const fetchTransactions = async (isLoadMore = false, overridePage = page) => {
    try {
      setLoading(true);
      setHasError(false);
      const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 🛡️ ENTERPRISE FIX: Append pagination parameters
      const params = new URLSearchParams({
        skip: overridePage * LIMIT,
        limit: LIMIT
      });
      
      const response = await fetch(`${API_BACKEND}/api/v1/transactions/${user.account_number}?${params.toString()}`, {
        method: "GET",
        credentials: "include", 
      });

      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      const safeData = Array.isArray(data) ? data : [];
      
      setHasMore(safeData.length === LIMIT);

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...safeData]);
      } else {
        setTransactions(safeData);
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch Effect
  useEffect(() => {
    if (!user?.account_number) return;
    const controller = new AbortController();
    
    // Reset and fetch page 0
    setPage(0);
    fetchTransactions(false, 0);
    
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.account_number]);

  // Load More Handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(true, nextPage);
  };

  // --- FILTER LOGIC ---
  const filteredTransactions = transactions.filter((tx) => {
    const txTypeSafe = tx.transaction_type?.toLowerCase() || "";
    const isCredit = ["deposit", "share_capital", "interest"].includes(txTypeSafe);
    
    if (filter === "CREDIT") return isCredit;
    if (filter === "DEBIT") return !isCredit;
    return true; 
  });

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" aria-hidden="true" />
      </div>
    );
  }

  if (hasError && transactions.length === 0) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium text-sm">{t.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="ml-auto text-xs font-bold underline hover:text-red-800">
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* FILTER TABS */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto">
        <Filter size={16} className="text-gray-400 mr-2 shrink-0" aria-hidden="true" />
        {["ALL", "CREDIT", "DEBIT"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f 
                ? "bg-brand-navy text-white shadow-sm" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "ALL" ? t.all : f === "CREDIT" ? t.credits : t.debits}
          </button>
        ))}
      </div>

      {/* TRANSACTION LIST */}
      <div className="divide-y divide-gray-100">
        {filteredTransactions.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">{t.noData}</div>
        ) : (
          filteredTransactions.map((tx) => {
            const txTypeSafe = tx.transaction_type?.toLowerCase() || "";
            const isCredit = ["deposit", "share_capital", "interest"].includes(txTypeSafe);

            return (
              <div key={tx.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {/* 🛡️ Added aria-hidden to decorative icons */}
                    {isCredit ? <ArrowDownRight size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{t[txTypeSafe] || tx.transaction_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tx.receipt_no}</span>
                      <span className="text-xs text-gray-400" aria-hidden="true">•</span>
                      <span className="text-xs text-gray-500">{formatDate(tx.created_at, language)}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <p className={`text-lg font-black font-numeric ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? "+" : "-"}{formatINR(tx.amount)}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">
                    {t.balance}: <span className="text-brand-navy">{formatINR(tx.new_balance)}</span>
                  </p>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 🛡️ PAGINATION FOOTER */}
      {loading && transactions.length > 0 && (
         <div className="p-6 flex justify-center border-t border-gray-100">
           <Loader2 className="h-6 w-6 text-brand-blue animate-spin" aria-hidden="true" />
         </div>
      )}

      {!loading && hasMore && filteredTransactions.length > 0 && (
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