// src/components/transactions/AdminTransactions.jsx
"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Search, ShieldCheck, AlertCircle, Loader2, CheckCircle2, 
  ArrowRightLeft, User, Wallet, FileText, CreditCard
} from "lucide-react";

const TRANSLATIONS = {
  EN: {
    verifySection: "1. Verify Account",
    accPlaceholder: "Enter Account No. (e.g. SUCCS0001)",
    verifyBtn: "Verify Member",
    memberDetails: "Member Details",
    status: "Status",
    currentBalance: "Current Balance",
    txSection: "2. Process Transaction",
    txType: "Transaction Type",
    paymentMode: "Payment Mode",
    amount: "Amount (₹)",
    note: "Reference Note (Optional)",
    submitBtn: "Process Transaction",
    processing: "Processing...",
    successMsg: "Transaction processed successfully!",
    errorMsg: "Failed to process transaction.",
    verifyError: "Account not found.",
    inactiveWarning: "Cannot process transactions for an inactive account.",
    deposit: "Deposit (+)",
    share_capital: "Share Capital (+)",
    interest: "Interest (+)",
    withdrawal: "Withdrawal (-)",
    installment: "Loan Installment (-)",
    penalty: "Penalty (-)",
    cash: "Cash",
    online: "Online / UPI",
    transfer: "Bank Transfer",
    cheque: "Cheque"
  },
  MR: {
    verifySection: "1. खाते सत्यापित करा",
    accPlaceholder: "खाते क्र. प्रविष्ट करा",
    verifyBtn: "सदस्य तपासा",
    memberDetails: "सदस्य तपशील",
    status: "स्थिती",
    currentBalance: "सध्याची शिल्लक",
    txSection: "2. व्यवहार प्रक्रिया करा",
    txType: "व्यवहाराचा प्रकार",
    paymentMode: "पेमेंट मोड",
    amount: "रक्कम (₹)",
    note: "संदर्भ नोंद (पर्यायी)",
    submitBtn: "व्यवहार पूर्ण करा",
    processing: "प्रक्रिया करत आहे...",
    successMsg: "व्यवहार यशस्वीरीत्या पूर्ण झाला!",
    errorMsg: "व्यवहार पूर्ण करण्यात अक्षम.",
    verifyError: "खाते आढळले नाही.",
    inactiveWarning: "निष्क्रिय खात्यासाठी व्यवहार करता येत नाहीत.",
    deposit: "ठेव (+)",
    share_capital: "भाग भांडवल (+)",
    interest: "व्याज (+)",
    withdrawal: "पैसे काढले (-)",
    installment: "कर्ज हप्ता (-)",
    penalty: "दंड (-)",
    cash: "रोख (Cash)",
    online: "ऑनलाइन / UPI",
    transfer: "बँक ट्रान्सफर",
    cheque: "चेक (Cheque)"
  },
};

// 🛡️ ENTERPRISE FIX: Updated to support up to 2 decimal places (Paisa)
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function AdminTransactions() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [accountNo, setAccountNo] = useState("");
  const [memberPreview, setMemberPreview] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [formData, setFormData] = useState({
    transaction_type: "deposit",
    payment_mode: "cash", 
    amount: "",
    reference_note: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" }); 

  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!accountNo.trim()) return;

    try {
      setIsVerifying(true);
      setVerifyError("");
      setMemberPreview(null);
      setSubmitStatus({ type: "", message: "" });

      const response = await fetch(`${API_BACKEND}/api/v1/members/${accountNo.trim().toUpperCase()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Not found");
      
      const data = await response.json();
      setMemberPreview(data);

    } catch (err) {
      setVerifyError(t.verifyError);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberPreview || !memberPreview.is_active) return;

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: "", message: "" });

      const payload = {
        account_number: memberPreview.account_number,
        transaction_type: formData.transaction_type,
        payment_mode: formData.payment_mode,
        amount: Number(formData.amount),
        note: formData.reference_note.trim() || null
      };

      const response = await fetch(`${API_BACKEND}/api/v1/transactions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Transaction failed");
      }

      const successData = await response.json();

      setSubmitStatus({ 
        type: "success", 
        message: `${t.successMsg} Receipt: ${successData.receipt_no}` 
      });
      
      setFormData({ transaction_type: "deposit", payment_mode: "cash", amount: "", reference_note: "" });
      
      setMemberPreview(prev => ({
        ...prev,
        balance: successData.new_balance
      }));

    } catch (err) {
      setSubmitStatus({ type: "error", message: err.message || t.errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT COLUMN: VERIFICATION & PREVIEW */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" aria-hidden="true" />
          <h2 className="text-lg font-bold text-brand-navy mb-4 flex items-center gap-2">
            <Search size={20} className="text-brand-blue" aria-hidden="true" />
            {t.verifySection}
          </h2>
          
          <form onSubmit={handleVerify} className="flex gap-3">
            <input
              type="text"
              value={accountNo}
              onChange={(e) => {
                setAccountNo(e.target.value.toUpperCase());
                if (submitStatus.message) setSubmitStatus({ type: "", message: "" });
              }}
              placeholder={t.accPlaceholder}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all uppercase font-mono"
              required
            />
            <button
              type="submit"
              disabled={isVerifying || !accountNo}
              className="bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isVerifying ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
              {t.verifyBtn}
            </button>
          </form>

          {verifyError && (
            <p className="text-red-600 text-sm font-medium flex items-center gap-1.5 mt-3 bg-red-50 p-2 rounded-lg animate-in zoom-in-95">
              <AlertCircle size={16} aria-hidden="true" /> {verifyError}
            </p>
          )}
        </div>

        {memberPreview && (
          <div className="bg-linear-to-br from-brand-navy to-blue-950 rounded-2xl shadow-md p-6 text-white animate-in slide-in-from-left-4 duration-300">
            {/* 🛡️ Comments are safely nestled inside the main returned div block now! */}
            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-4 border-b border-blue-800/50 pb-2">
              {t.memberDetails}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/10 p-2 rounded-lg"><User size={20} aria-hidden="true" /></div>
                <div>
                  <p className="text-xs text-blue-200 font-mono">{memberPreview.account_number}</p>
                  <p className="font-bold text-lg">{memberPreview.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-blue-200 mb-1">{t.status}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${memberPreview.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {memberPreview.is_active ? <CheckCircle2 size={12} aria-hidden="true" /> : <AlertCircle size={12} aria-hidden="true" />}
                    {memberPreview.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">{t.currentBalance}</p>
                  <p className="font-bold text-xl font-numeric">{formatINR(memberPreview.balance)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: TRANSACTION FORM */}
      <div className="lg:col-span-7">
        <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-6 lg:p-8 transition-opacity duration-300 ${!memberPreview ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <h2 className="text-lg font-bold text-brand-navy mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <ArrowRightLeft size={20} className="text-brand-blue" aria-hidden="true" />
            {t.txSection}
          </h2>

          {memberPreview && !memberPreview.is_active && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium text-sm">
              <AlertCircle size={20} aria-hidden="true" className="shrink-0" />
              {t.inactiveWarning}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{t.txType}</label>
                <select 
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  required
                  disabled={!memberPreview?.is_active}
                >
                  <option value="deposit">{t.deposit}</option>
                  <option value="share_capital">{t.share_capital}</option>
                  <option value="interest">{t.interest}</option>
                  <option value="withdrawal">{t.withdrawal}</option>
                  <option value="installment">{t.installment}</option>
                  <option value="penalty">{t.penalty}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{t.paymentMode}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CreditCard size={16} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <select 
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    required
                    disabled={!memberPreview?.is_active}
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="online">{t.online}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="cheque">{t.cheque}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{t.amount}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Wallet size={16} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="0.01" // 🛡️ ENTERPRISE FIX: Allows decimal precision
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-numeric"
                    required
                    disabled={!memberPreview?.is_active}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">{t.note}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FileText size={16} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    value={formData.reference_note}
                    onChange={(e) => setFormData({...formData, reference_note: e.target.value})}
                    placeholder="e.g. Check #12345"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    disabled={!memberPreview?.is_active}
                  />
                </div>
              </div>
            </div>

            {submitStatus.message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 duration-300 ${
                submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {submitStatus.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                {submitStatus.message}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !memberPreview || !memberPreview.is_active || !formData.amount}
                className="flex items-center gap-2 px-8 py-3 bg-action-success text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t.processing}</>
                ) : (
                  <><CheckCircle2 size={18} aria-hidden="true" /> {t.submitBtn}</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}