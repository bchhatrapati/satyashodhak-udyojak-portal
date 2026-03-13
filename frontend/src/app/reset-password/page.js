"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, LockKeyhole, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ Bouncer: Kick out unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null; // Prevent flash while redirecting

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when the user starts typing again
    if (status.type === "error") setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Client-Side Validation
    if (formData.newPassword.length < 6) {
      setStatus({
        type: "error",
        message: language === "EN" ? "New password must be at least 6 characters." : "नवीन पासवर्ड किमान ६ अक्षरांचा असावा.",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({
        type: "error",
        message: language === "EN" ? "New passwords do not match." : "नवीन पासवर्ड जुळत नाहीत.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      // 2. Secure API Call to Backend
      const response = await fetch(`${API_BACKEND}/api/v1/auth/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 Crucial: proves the user is currently logged in
        body: JSON.stringify({
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: language === "EN" ? "Password updated successfully!" : "पासवर्ड यशस्वीरित्या बदलला!",
        });
        
        // Clear form on success
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        
        // Optional: Escort them back to dashboard after 2 seconds
        setTimeout(() => router.push("/"), 2000);
      } else {
        setStatus({
          type: "error",
          message: data.detail || (language === "EN" ? "Failed to update password." : "पासवर्ड बदलण्यात त्रुटी आली."),
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: language === "EN" ? "Server connection failed." : "सर्व्हरशी संपर्क तुटला.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* 🔙 Back Navigation */}
      <div className="w-full max-w-md mb-6">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-navy transition-colors text-sm font-bold"
        >
          <ArrowLeft size={16} />
          {language === "EN" ? "Back to Dashboard" : "डॅशबोर्डवर परत जा"}
        </button>
      </div>

      {/* 🔒 Password Form Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-navy/5 border border-gray-100 p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-4">
            <LockKeyhole size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-navy">
            {language === "EN" ? "Update Password" : "पासवर्ड बदला"}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {language === "EN" 
              ? "Ensure your new password is secure and at least 6 characters long." 
              : "तुमचा नवीन पासवर्ड सुरक्षित आणि किमान ६ अक्षरांचा असल्याची खात्री करा."}
          </p>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium ${
            status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p>{status.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "EN" ? "Current Password" : "सध्याचा पासवर्ड"}
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "EN" ? "New Password" : "नवीन पासवर्ड"}
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "EN" ? "Confirm New Password" : "नवीन पासवर्डची खात्री करा"}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status.type === "success"}
            className="w-full bg-brand-navy hover:bg-blue-950 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-navy/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              language === "EN" ? "Secure Update" : "सुरक्षितरित्या अपडेट करा"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}