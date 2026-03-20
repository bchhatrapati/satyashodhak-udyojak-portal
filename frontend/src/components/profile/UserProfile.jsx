// src/components/profile/UserProfile.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  User, Phone, Calendar, ShieldCheck, CreditCard, 
  FileText, Users, Loader2, AlertCircle, Mail, Clock
} from "lucide-react";
import Image from "next/image"; // For optimized profile picture rendering

const TRANSLATIONS = {
  EN: {
    personalInfo: "Personal Information",
    contactInfo: "Contact Details",
    kycInfo: "KYC Documents",
    nomineeInfo: "Nominee Details",
    fullName: "Full Name",
    dob: "Date of Birth",
    email: "Email Address", // 🛡️ Added
    phone: "Phone Number",
    installmentDate: "Monthly Installment Day", // 🛡️ Added
    aadhar: "Aadhar Number",
    pan: "PAN Number",
    nomineeName: "Nominee Name",
    nomineeRelation: "Relation",
    joined: "Joined On",
    errorMsg: "Failed to load profile data.",
    retry: "Retry",
    notProvided: "Not Provided"
  },
  MR: {
    personalInfo: "वैयक्तिक माहिती",
    contactInfo: "संपर्क तपशील",
    kycInfo: "केवायसी कागदपत्रे",
    nomineeInfo: "वारसाचे तपशील (Nominee)",
    fullName: "पूर्ण नाव",
    dob: "जन्म तारीख",
    email: "ईमेल पत्ता", // 🛡️ Added
    phone: "फोन नंबर",
    installmentDate: "मासिक हप्ता दिवस", // 🛡️ Added
    aadhar: "आधार क्रमांक",
    pan: "पॅन क्रमांक",
    nomineeName: "वारसाचे नाव",
    nomineeRelation: "नाते",
    joined: "सामील झाल्याची तारीख",
    errorMsg: "प्रोफाईल डेटा लोड करण्यात अक्षम.",
    retry: "पुन्हा प्रयत्न करा",
    notProvided: "दिले नाही"
  }
};

const formatDate = (dateString, lang) => {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat(lang === 'MR' ? 'mr-IN' : 'en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

export default function UserProfile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.account_number) return;
    
    // 🛡️ ENTERPRISE FIX 3: Restored AbortController
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(false);
        const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${API_BACKEND}/api/v1/members/${user.account_number}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Failed to fetch profile");
        
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Profile fetch error:", err);
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [user?.account_number]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <Loader2 className="h-8 w-8 text-brand-blue animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium text-sm">{t.errorMsg}</p>
        <button onClick={() => window.location.reload()} className="ml-auto text-xs font-bold underline hover:text-red-800">
          {t.retry}
        </button>
      </div>
    );
  }

  const DataField = ({ label, value, icon: Icon, isMono = false }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="mt-0.5 text-gray-400">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-sm font-semibold text-brand-navy ${isMono ? 'font-mono tracking-wide' : ''}`}>
          {value || <span className="text-gray-400 italic font-sans">{t.notProvided}</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* 🛡️ ENTERPRISE FIX 2: Profile Header with Photo */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg shrink-0 relative">
          {profileData.photo_url ? (
            <img 
              src={profileData.photo_url} 
              alt={profileData.full_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User size={40} />
            </div>
          )}
        </div>
        
        <div className="text-center sm:text-left flex-1 space-y-2 mt-2">
          <h1 className="text-2xl font-black text-brand-navy">{profileData.full_name}</h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="px-3 py-1 bg-blue-50 text-brand-blue border border-blue-100 rounded-lg text-sm font-bold font-mono">
              {profileData.account_number}
            </span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${profileData.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {profileData.is_active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* DATA CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: Personal Info */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
            <User size={20} className="text-brand-blue" aria-hidden="true" />
            {t.personalInfo}
          </h2>
          <div className="space-y-2">
            {/* 🛡️ ENTERPRISE FIX 1: Strict DB Mappings */}
            <DataField label={t.fullName} value={profileData.full_name} icon={User} />
            <DataField label={t.dob} value={formatDate(profileData.date_of_birth, language)} icon={Calendar} />
            <DataField label={t.joined} value={formatDate(profileData.joining_date, language)} icon={ShieldCheck} />
          </div>
        </div>

        {/* CARD 2: Contact Info */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone size={20} className="text-brand-blue" aria-hidden="true" />
            {t.contactInfo}
          </h2>
          <div className="space-y-2">
            {/* 🛡️ ENTERPRISE FIX 1: Strict DB Mappings */}
            <DataField label={t.phone} value={profileData.phone_number} icon={Phone} isMono />
            <DataField label={t.email} value={profileData.email} icon={Mail} />
            <DataField label={t.installmentDate} value={profileData.monthly_installment_date ? `Day ${profileData.monthly_installment_date} of every month` : null} icon={Clock} />
          </div>
        </div>

        {/* CARD 3: KYC Details */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck size={20} className="text-brand-blue" aria-hidden="true" />
            {t.kycInfo}
          </h2>
          <div className="space-y-2">
            {/* 🛡️ ENTERPRISE FIX 1: Corrected schema keys to aadhar_no and pan_no */}
            <DataField label={t.aadhar} value={profileData.aadhar_no} icon={CreditCard} isMono />
            <DataField label={t.pan} value={profileData.pan_no} icon={FileText} isMono />
          </div>
        </div>

        {/* CARD 4: Nominee Details */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Users size={20} className="text-brand-blue" aria-hidden="true" />
            {t.nomineeInfo}
          </h2>
          <div className="space-y-2">
            <DataField label={t.nomineeName} value={profileData.nominee_name} icon={User} />
            <DataField label={t.nomineeRelation} value={profileData.nominee_relation} icon={Users} />
          </div>
        </div>

      </div>
    </div>
  );
}