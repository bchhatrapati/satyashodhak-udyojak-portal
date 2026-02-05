import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// 1. Update Metadata to your actual brand
export const metadata = {
  title: "Satyashodhak Udyojak Portal",
  description: "Enterprise-Grade Financial Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-app-bg antialiased text-foreground">
        {/* 2. Persistent Navigation (Desktop Sidebar) */}
        <Sidebar />

        {/* 3. Main Content Container */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar for Profile and Global Actions */}
          <Header />
          
          {/* Scrollable area for the page content */}
          <main className="p-4 md:p-8 flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}