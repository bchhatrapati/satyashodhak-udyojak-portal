// src/app/members/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MembersList from "@/components/members/MembersList";
import { Loader2 } from "lucide-react";

export default function MembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 🛡️ Security Check: Only Admins can view this page
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user?.role?.toLowerCase() !== "admin") { 
        // 🛡️ ENTERPRISE FIX: Case-insensitive role check
        router.replace("/"); // Redirect normal members back to their dashboard
      }
    }
  }, [user, loading, router]);

  // 🛡️ Show loading state while verifying or if redirecting
  if (loading || !user || user?.role?.toLowerCase() !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 text-brand-blue animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-500 font-medium text-sm animate-pulse">
          Verifying access...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <MembersList />
    </div>
  );
}