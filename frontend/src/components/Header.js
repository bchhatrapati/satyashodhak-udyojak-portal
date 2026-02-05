'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Menu items (Same as Sidebar for consistency)
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Members', path: '/members', icon: '👥' },
    { name: 'Transactions', path: '/transactions', icon: '💸' },
  ];

  return (
    <>
      <header className="w-full bg-surface h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button - Now Functional */}
          <button 
            onClick={() => setIsOpen(true)}
            className="block lg:hidden text-2xl p-2 touch-target text-brand-navy"
            aria-label="Open Menu"
          >
            ☰
          </button>
          <h2 className="text-lg font-semibold text-brand-navy hidden md:block">Main Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none text-brand-navy">Suraj B.</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Administrator</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
            SB
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (Specification 5.0 - Mobile First) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Sidebar Content */}
          <nav className="fixed top-0 left-0 bottom-0 w-72 bg-brand-navy p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <span className="text-white font-bold">Satyashodhak</span>
              <button onClick={() => setIsOpen(false)} className="text-white text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              {menuItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-white p-3 rounded-xl hover:bg-white/10"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}