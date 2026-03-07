'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { setUser, setLoading: setAuthLoading } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Use Account Number as per your finalized FastAPI Schema
  const [formData, setFormData] = useState({ account_number: '', password: '' });

  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BACKEND}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANT: Credentials 'include' allows the Secure/HttpOnly cookies 
        // we set in the FastAPI backend to be stored by the browser.
        credentials: 'include', 
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update global auth state with the user object returned from FastAPI
        setUser(data.user); 
        
        // Redirect to Dashboard
        router.push('/');
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Invalid Account Number or Password');
      }
    } catch (err) {
      console.error("Login failed", err);
      setError("Connection refused. Please check your internet or server status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      
      {/* Subtle Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-navy/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,51,102,0.08)] border border-gray-100 p-10 z-10">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-18 w-18 bg-brand-navy rounded-2xl flex items-center justify-center shadow-xl shadow-brand-navy/20 mb-4 animate-in fade-in zoom-in duration-700">
            <ShieldCheck size={34} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
            Satyashodhak
          </h1>

          <div className="flex items-center gap-2 mt-1">
            <span className="h-px w-3 bg-gray-300" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">
              Udyojak Portal
            </p>
            <span className="h-px w-3 bg-gray-300" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Account Number */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider ml-1">
              Account Number
            </label>

            <div className="relative mt-2">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>

              <input
                type="text"
                required
                placeholder="e.g. SUCCS10000"
                className="w-full h-13 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/5 outline-none transition-all font-medium"
                onChange={(e)=>setFormData({...formData, account_number: e.target.value.toUpperCase()})}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider ml-1">
              Secret Password
            </label>

            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>

              <input
                type={showPassword ? "text":"password"}
                required
                placeholder="••••••••"
                className="w-full h-13 pl-11 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/5 outline-none transition-all font-medium tracking-widest"
                onChange={(e)=>setFormData({...formData, password: e.target.value})}
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={()=>setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 bg-brand-navy hover:bg-[#002244] text-white font-bold rounded-xl shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              "Sign In to Portal"
            )}
          </button>

        </form>

        {/* Security Footer */}
        <div className="mt-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    System Secured
                </p>
            </div>
            <p className="text-[9px] text-gray-400 text-center leading-relaxed">
                Authorized Access Only • Secure Banking Environment<br/>
                Satyashodhak Society IP Monitoring is Active
            </p>
        </div>

      </div>
    </div>
  );
}