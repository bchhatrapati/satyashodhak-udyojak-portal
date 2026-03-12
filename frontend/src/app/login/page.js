'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, setUser, loading } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ account_number: '', password: '' });

  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

  // 🛡️ Guard: Prevent authenticated users from seeing login
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
    if (inputRef.current) inputRef.current.focus();
  }, [user, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!API_BACKEND) {
      setError("System configuration error: Missing API URL.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Standardize input for the Bank Backend
    const payload = {
      account_number: formData.account_number.trim().toUpperCase(),
      password: formData.password
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // Increased to 12s for slow mobile networks

    try {
      const response = await fetch(`${API_BACKEND}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Crucial for Secure HttpOnly Cookies
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        console.log("Login successful:", data.user);
        router.replace('/'); // Clean redirect (no back-button loop)
      } else {
        const detail = data.detail;
        // Advanced Error Parsing: Handles Pydantic list errors or standard strings
        setError(
          Array.isArray(detail) 
            ? (detail[0]?.msg || "Invalid input format") 
            : (detail || "Access Denied: Invalid Credentials")
        );
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Security Gateway Timeout. Please retry.");
      } else {
        setError("Secure Connection Failed. Server may be offline.");
      }
    } finally {
      clearTimeout(timeout); // Always clear the timer
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      
      {/* Background Polish */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-brand-blue/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-brand-navy/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 p-12 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        <div className="flex flex-col items-center mb-12">
          <div className="h-20 w-20 bg-brand-navy rounded-4xl flex items-center justify-center shadow-2xl shadow-brand-navy/30 mb-6 transition-transform hover:scale-105">
            <ShieldCheck size={38} className="text-white" />
          </div>

          <h1 className="text-3xl font-black text-brand-navy tracking-tightest">Satyashodhak</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="h-px w-4 bg-gray-200" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Udyojak Portal</p>
            <span className="h-px w-4 bg-gray-200" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold uppercase tracking-tight flex items-center gap-2 animate-bounce">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Account Identifier</label>
            <div className="relative mt-2 group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors"/>
              <input
                ref={inputRef}
                type="text"
                required
                placeholder="SS-XXXXX"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all font-bold text-brand-navy"
                onChange={(e)=>setFormData({...formData, account_number: e.target.value})}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Security Key</label>
            <div className="relative mt-2 group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors"/>
              <input
                type={showPassword ? "text":"password"}
                required
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all font-bold tracking-[0.3em] text-brand-navy"
                onChange={(e)=>setFormData({...formData, password: e.target.value})}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={()=>setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-navy transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-brand-navy hover:bg-[#001A33] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-navy/20 transition-all active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Authorize Access"}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 bg-emerald-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest">AES-256 Encrypted</p>
            </div>
            <p className="text-[9px] text-gray-400 text-center leading-relaxed font-medium">
                Satyashodhak Udyojak Sahakari Patpedhi Maryadit<br/>
                © 2026 Secure Portal Deployment
            </p>
        </div>
      </div>
    </div>
  );
}