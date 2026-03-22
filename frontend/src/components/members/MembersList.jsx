// src/components/members/MembersList.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Search, User, Loader2, AlertCircle, 
  CheckCircle2, Phone, Calendar, ChevronRight
} from "lucide-react";
import Link from "next/link";

const TRANSLATIONS = {
  EN: {
    title: "Members Directory",
    subtitle: "Manage and view all registered society members.",
    searchPlaceholder: "Search by name, account no, or phone...",
    colAccount: "Account",
    colMember: "Member Details",
    colContact: "Contact",
    colJoined: "Joined Date",
    colStatus: "Status",
    colAction: "Action",
    active: "ACTIVE",
    inactive: "INACTIVE",
    noResults: "No members found matching your search.",
    fetchError: "Failed to load members. Please try again.",
    retry: "Retry"
  },
  MR: {
    title: "सभासद निर्देशिका",
    subtitle: "सर्व नोंदणीकृत सोसायटी सभासदांचे व्यवस्थापन करा आणि पहा.",
    searchPlaceholder: "नाव, खाते क्रमांक किंवा फोनद्वारे शोधा...",
    colAccount: "खाते",
    colMember: "सभासदाचा तपशील",
    colContact: "संपर्क",
    colJoined: "सामील होण्याची तारीख",
    colStatus: "स्थिती",
    colAction: "कृती",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    noResults: "तुमच्या शोधाशी जुळणारे कोणतेही सभासद आढळले नाहीत.",
    fetchError: "सभासद लोड करण्यात अक्षम. कृपया पुन्हा प्रयत्न करा.",
    retry: "पुन्हा प्रयत्न करा"
  }
};

const formatDate = (dateString, lang) => {
  if (!dateString) return "-";
  try {
    return new Intl.DateTimeFormat(lang === 'MR' ? 'mr-IN' : 'en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

export default function MembersList() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Members securely
  useEffect(() => {
    const controller = new AbortController();

    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(false);
        const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${API_BACKEND}/api/v1/members/`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Failed to fetch members");
        
        const data = await response.json();
        
        if (!controller.signal.aborted) {
          setMembers(data);
          setLoading(false); 
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Members fetch error:", err);
          setError(true);
          setLoading(false); 
        }
      }
    };

    fetchMembers();
    return () => controller.abort();
  }, []);

  // 2. High-Performance Client-Side Search Filter
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const lowerSearch = searchTerm.toLowerCase();
    return members.filter(member => 
      (member.full_name && member.full_name.toLowerCase().includes(lowerSearch)) ||
      (member.account_number && member.account_number.toLowerCase().includes(lowerSearch)) ||
      (member.phone_number && member.phone_number.includes(lowerSearch))
    );
  }, [members, searchTerm]);

  // 3. UI States
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-500 font-medium">Loading members directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mt-6">
        <AlertCircle size={24} aria-hidden="true" />
        <p className="font-medium">{t.fetchError}</p>
        <button onClick={() => window.location.reload()} className="ml-auto font-bold underline hover:text-red-800">
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">{t.title}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{t.subtitle}</p>
        </div>
        
        <div className="relative w-full md:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.colAccount}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.colMember}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">{t.colContact}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">{t.colJoined}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.colStatus}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.account_number} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold font-mono text-brand-blue bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        {member.account_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            member.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{member.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 font-mono">
                        <Phone size={14} className="text-gray-400" />
                        {member.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(member.joining_date, language)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        member.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {member.is_active ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {member.is_active ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {/* 🛡️ ENTERPRISE FIX: Added the navigation link for the Action column */}
                      <Link 
                        href={`/members/${member.account_number}`}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`View details for ${member.full_name}`}
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                /* 🛡️ ENTERPRISE FIX: The Empty State UI */
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search size={40} className="mb-3 opacity-20" aria-hidden="true" />
                      <p className="text-base font-medium text-gray-500">{t.noResults}</p>
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="mt-3 text-sm font-bold text-brand-blue hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}