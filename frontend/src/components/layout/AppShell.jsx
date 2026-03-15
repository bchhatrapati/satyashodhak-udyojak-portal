"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const publicRoutes = ["/login"];

  // Public pages (login etc)
  if (publicRoutes.includes(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  // Auth loading state
 if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app-bg animate-pulse">
      <div className="h-12 w-12 bg-brand-navy rounded-xl mb-4" /> {/* Logo Placeholder */}
      <p className="text-xs uppercase tracking-widest text-text-muted font-bold">
        Securing Session...
      </p>
    </div>
  );
}
  // Not authenticated
  if (!user) {
    return <div className="min-h-screen bg-app-bg" />;
  }

  // Authenticated dashboard
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      
      <aside className="h-screen sticky top-0">
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 h-screen">
        
        <header>
          <Header />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}