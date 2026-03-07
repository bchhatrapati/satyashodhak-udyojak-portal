import "./globals.css";
import { Inter } from "next/font/google"; // 🚀 Added for better UI performance
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Satyashodhak Udyojak Portal",
  description: "Enterprise-Grade Financial Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} min-h-screen bg-app-bg antialiased text-foreground`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}