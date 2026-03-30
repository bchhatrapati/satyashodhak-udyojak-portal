// src/app/members/[account_number]/page.js
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {  
  ArrowLeft, User, Phone, Mail, Users, Calendar,
  Edit3, CheckCircle2, XCircle, Loader2, Wallet, Shield,
  AlertCircle, History, Activity
} from "lucide-react";

// 🛡️ FINAL POLISH: Added all form labels and placeholders to the dictionary
const TRANSLATIONS = {
  EN: {
    back: "Back to Directory",
    edit: "Edit Profile",
    cancel: "Cancel",
    save: "Save Changes",
    status: "Status",
    balance: "Current Balance",
    personalInfo: "Personal & Contact Details",
    societyInfo: "Society Settings",
    recentActivity: "Recent Transactions",
    successMsg: "Profile updated successfully!",
    errorMsg: "Failed to update profile. Please try again.",
    noChanges: "No changes made.",
    accountAge: "Account Age",
    notProvided: "Not provided",
    notAssigned: "Not Assigned",
    notSet: "Not Set",
    accountAccess: "Account Access",
    suspendDesc: "Suspend this account to block logins and new transactions.",
    ledgerPending: "Ledger Integration Pending",
    ledgerDesc: "Transaction history will be displayed here once the ledger API is connected.",
    viewLedger: "View Full Ledger",
    active: "ACTIVE",
    suspended: "SUSPENDED",
    // Form Labels
    fullNameLabel: "Full Name",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    nomineeNameLabel: "Nominee Name",
    relationLabel: "Relation",
    installmentLabel: "Installment Date (1-28)",
    phonePlaceholder: "10-digit number",
    relationPlaceholder: "e.g. Spouse, Son"
  },
  MR: {
    back: "निर्देशिकेत परत जा",
    edit: "प्रोफाइल संपादित करा",
    cancel: "रद्द करा",
    save: "बदल जतन करा",
    status: "स्थिती",
    balance: "सध्याची शिल्लक",
    personalInfo: "वैयक्तिक आणि संपर्क तपशील",
    societyInfo: "संस्था सेटिंग्ज",
    recentActivity: "अलीकडील व्यवहार",
    successMsg: "प्रोफाइल यशस्वीरित्या अद्यतनित केले!",
    errorMsg: "प्रोफाइल अद्यतनित करण्यात अक्षम.",
    noChanges: "कोणतेही बदल केलेले नाहीत.",
    accountAge: "खात्याचे वय",
    notProvided: "दिले नाही",
    notAssigned: "नियुक्त केले नाही",
    notSet: "सेट केले नाही",
    accountAccess: "खाते प्रवेश",
    suspendDesc: "लॉगिन आणि नवीन व्यवहार अवरोधित करण्यासाठी हे खाते निलंबित करा.",
    ledgerPending: "लेजर एकत्रीकरण प्रलंबित",
    ledgerDesc: "लेजर API कनेक्ट झाल्यावर व्यवहाराचा इतिहास येथे प्रदर्शित केला जाईल.",
    viewLedger: "संपूर्ण लेजर पहा",
    active: "सक्रिय",
    suspended: "निलंबित",
    // Form Labels
    fullNameLabel: "पूर्ण नाव",
    phoneLabel: "फोन नंबर",
    emailLabel: "ईमेल पत्ता",
    nomineeNameLabel: "वारसाचे नाव",
    relationLabel: "नाते",
    installmentLabel: "हप्त्याची तारीख (१-२८)",
    phonePlaceholder: "१०-अंकी क्रमांक",
    relationPlaceholder: "उदा. जोडीदार, मुलगा"
  }
};

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function MemberProfilePage({ params }) {
  const unwrappedParams = use(params);
  const account_number = unwrappedParams.account_number;

  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, type: "", text: "" });

  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    // We wrap them in Promise.all to fetch them simultaneously for speed
    const loadAllData = async () => {
      setLoading(true);
      setTxLoading(true);
      await Promise.all([
        fetchMemberDetails(),
        fetchTransactionHistory()
      ]);
      setLoading(false);
      setTxLoading(false);
    };
    
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account_number]);

  const fetchMemberDetails = async () => {
    try {
      const res = await fetch(`${API_BACKEND}/api/v1/members/${account_number}`, {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Member not found");
      const data = await res.json();

      setMember(data);

      const mappedData = {
        full_name: data.full_name || "",
        phone_number: data.phone_number || "",
        email: data.email || "",
        is_active: data.is_active ?? true,
        nominee_name: data.nominee_name || "",
        nominee_relation: data.nominee_relation || "",
        monthly_installment_date: data.monthly_installment_date || ""
      };

      setFormData(mappedData);
      setOriginalData(mappedData);
    } catch (err) {
      showToast("error", "Failed to load member data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const res = await fetch(`${API_BACKEND}/api/v1/transactions/${account_number}?limit=10`, {
        method: "GET",
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Failed to load transaction history:", err);
    }
  };

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: "", text: "" }), 4000);
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Name is required";
    if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Must be exactly 10 digits";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.monthly_installment_date) {
      const date = parseInt(formData.monthly_installment_date);
      if (date < 1 || date > 28) newErrors.monthly_installment_date = "Must be between 1 and 28";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (payload.monthly_installment_date) {
        payload.monthly_installment_date = parseInt(payload.monthly_installment_date);
      } else {
        payload.monthly_installment_date = null;
      }

      const res = await fetch(`${API_BACKEND}/api/v1/members/${account_number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedData = await res.json();
      setMember(updatedData);
      
      const mappedUpdatedData = {
        full_name: updatedData.full_name || "",
        phone_number: updatedData.phone_number || "",
        email: updatedData.email || "",
        is_active: updatedData.is_active ?? true,
        nominee_name: updatedData.nominee_name || "",
        nominee_relation: updatedData.nominee_relation || "",
        monthly_installment_date: updatedData.monthly_installment_date || ""
      };

      setFormData(mappedUpdatedData);
      setOriginalData(mappedUpdatedData);
      setIsEditing(false);
      showToast("success", t.successMsg);
    } catch (err) {
      showToast("error", t.errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        <p className="text-gray-500 font-semibold animate-pulse">Loading secure profile...</p>
      </div>
    );
  }

  if (!member) return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-800">Member Not Found</h2>
      <button onClick={() => router.push('/members')} className="mt-4 text-brand-blue hover:underline">
        Return to Directory
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 font-bold transition-all duration-300 transform translate-y-0 opacity-100 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {toast.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <button
            onClick={() => router.push('/members')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-blue font-semibold transition-colors mb-3"
          >
            <ArrowLeft size={16} /> {t.back}
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">{member.full_name}</h1>
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${member.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {member.is_active ? t.active : t.suspended}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-gray-500 font-mono text-sm bg-gray-100 w-fit px-3 py-1 rounded-md">
            <Shield size={14} className="text-brand-blue" />
            {member.account_number}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setFormData(originalData);
                    setErrors({});
                    setIsEditing(false);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md ${!hasChanges ? 'bg-gray-400 cursor-not-allowed' : 'bg-action-success hover:bg-green-700'}`}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {t.save}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-blue hover:bg-blue-700 rounded-xl transition-all shadow-md"
              >
                <Edit3 size={18} /> {t.edit}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-linear-to-r from-brand-navy to-[#1e3a8a] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white opacity-5 blur-2xl"></div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-blue-200 mb-4 opacity-90">
              <Wallet size={18} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.balance}</h3>
            </div>
            <p className="text-5xl md:text-6xl font-extrabold font-numeric tracking-tight">
              {formatINR(member.balance)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue mb-2">
            <Activity size={24} />
          </div>
          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{t.accountAge}</p>
          <p className="text-xl font-bold text-brand-navy">
            {member.created_at ? new Date(member.created_at).toLocaleDateString(language === 'MR' ? 'mr-IN' : 'en-IN', { month: 'short', year: 'numeric' }) : t.notProvided}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <div className={`bg-white rounded-2xl shadow-sm border p-6 lg:p-8 transition-colors ${isEditing ? 'border-brand-blue/30 ring-1 ring-brand-blue/10' : 'border-gray-200'}`}>
          <h2 className="text-lg font-bold text-brand-navy mb-6 flex items-center gap-2">
            <User size={20} className="text-brand-blue" /> {t.personalInfo}
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.fullNameLabel}</label>
              {isEditing ? (
                <div>
                  <div className="relative">
                    {/* 🛡️ ADDED: User icon for visual consistency */}
                    <User size={16} className={`absolute left-4 top-3.5 ${errors.full_name ? 'text-red-400' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:outline-none transition-all ${errors.full_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-blue/20 focus:border-brand-blue'}`}
                    />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.full_name}</p>}
                </div>
              ) : (
                <p className="text-base font-semibold text-gray-900 px-1">{member.full_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.phoneLabel}</label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <Phone size={16} className={`absolute left-4 top-3.5 ${errors.phone_number ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '') })}
                        maxLength="10"
                        placeholder={t.phonePlaceholder}
                        className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:outline-none transition-all ${errors.phone_number ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-blue/20 focus:border-brand-blue'}`}
                      />
                    </div>
                    {errors.phone_number && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone_number}</p>}
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 px-1 flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" /> {member.phone_number || t.notProvided}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.emailLabel}</label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <Mail size={16} className={`absolute left-4 top-3.5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-blue/20 focus:border-brand-blue'}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 px-1 flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" /> {member.email || t.notProvided}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm border p-6 lg:p-8 transition-colors ${isEditing ? 'border-brand-blue/30 ring-1 ring-brand-blue/10' : 'border-gray-200'}`}>
          <h2 className="text-lg font-bold text-brand-navy mb-6 flex items-center gap-2">
            <Shield size={20} className="text-brand-blue" /> {t.societyInfo}
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.nomineeNameLabel}</label>
                {isEditing ? (
                  <div className="relative">
                    <Users size={16} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.nominee_name}
                      onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:outline-none transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 px-1">{member.nominee_name || t.notAssigned}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.relationLabel}</label>
                {isEditing ? (
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.relationPlaceholder}
                      value={formData.nominee_relation}
                      onChange={(e) => setFormData({ ...formData, nominee_relation: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:outline-none transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 px-1">{member.nominee_relation || "N/A"}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.installmentLabel}</label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <Calendar size={16} className={`absolute left-4 top-3.5 ${errors.monthly_installment_date ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type="number"
                        min="1" max="28"
                        value={formData.monthly_installment_date}
                        onChange={(e) => setFormData({ ...formData, monthly_installment_date: e.target.value })}
                        className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:outline-none transition-all font-numeric ${errors.monthly_installment_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-blue/20 focus:border-brand-blue'}`}
                      />
                    </div>
                    {errors.monthly_installment_date && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.monthly_installment_date}</p>}
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900 px-1">
                    {member.monthly_installment_date ? `Day ${member.monthly_installment_date} of month` : t.notSet}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between mt-8">
                <div>
                  <p className="font-bold text-brand-navy text-sm">{t.accountAccess}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.suspendDesc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <div className="w-12 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🟢 RECENT TRANSACTIONS LEDGER */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <History size={22} className="text-brand-blue" /> {t.recentActivity}
          </h2>
          <button 
            onClick={() => router.push(`/transactions?account=${account_number}`)}
            className="text-sm font-bold text-brand-blue hover:text-blue-800 transition-colors"
          >
            {t.viewLedger} &rarr;
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {txLoading ? (
             <div className="p-8 flex justify-center items-center">
               <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
             </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
              <Activity size={24} className="mb-2 text-gray-300" />
              <p className="font-semibold">No transactions found</p>
              <p className="text-xs mt-1">This account has no recorded financial activity.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Receipt No</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isCredit = ['deposit', 'share_capital', 'interest'].includes(tx.transaction_type.toLowerCase());
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.receipt_no}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {tx.transaction_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-bold font-numeric ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}