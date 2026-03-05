'use client'; // CRITICAL: This enables hooks in the Next.js App Router

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  Menu,
  Globe,
  User,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';

/**
 * ============================================================
 * SATYASHODHAK UDYOJAK PORTAL - ENTERPRISE HEADER
 * ============================================================
 * * CORE PHILOSOPHY:
 * - Trust through clarity: High-contrast financial blue palette.
 * - Stability through structure: Role-based visual indicators.
 * - Accessibility for all: 44px touch targets & Marathi support.
 * ============================================================
 */

const Header = ({
  onMenuClick,
  userRole = 'admin',
  userName = 'Krushna',
  onLogout = () => {},
  notificationCount = 0,
}) => {
  /* ------------------------------------------------------------
     STATE & REFS
     ------------------------------------------------------------ */
  const [language, setLanguage] = useState('EN'); 
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  /* ------------------------------------------------------------
     ROLE-BASED THEMING
     ------------------------------------------------------------ */
  const roleBadgeStyle = useMemo(() => {
    const styles = {
      admin: 'bg-brand-navy text-text-inverse',
      cashier: 'bg-brand-blue text-text-inverse',
      auditor: 'bg-transaction-pending text-text-primary',
      member: 'bg-app-muted text-text-secondary',
    };
    return styles[userRole] || styles.member;
  }, [userRole]);

  /* ------------------------------------------------------------
     HANDLERS
     ------------------------------------------------------------ */
  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'EN' ? 'MR' : 'EN'));
  }, []);

  /* ------------------------------------------------------------
     ACCESSIBILITY HANDLERS
     ------------------------------------------------------------ */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
        dropdownButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);

  return (
    <header
      className="sticky top-0 z-40 w-full h-16 bg-app-surface border-b border-app-border 
                 flex items-center justify-between px-4 md:px-8 shadow-card"
      role="banner"
    >
      {/* LEFT: BRAND & NAV */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden min-h-touch min-w-touch flex items-center 
                     justify-center text-brand-navy hover:bg-app-background 
                     rounded-lg transition-colors active:scale-95"
          aria-label="Open Navigation"
        >
          <Menu size={24} />
        </button>

        <div className="hidden sm:block select-none">
          <h1 className="text-subheadline font-bold tracking-tight">
            <span className="text-brand-navy">
              {language === 'EN' ? 'Satyashodhak' : 'सत्यशोधक'}
            </span>{' '}
            <span className="text-brand-blue">
              {language === 'EN' ? 'Portal' : 'पोर्टल'}
            </span>
          </h1>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-6">
        
        {/* Language Switch */}
        <button
          onClick={toggleLanguage}
          className="min-h-touch px-3 flex items-center gap-2 
                     text-text-secondary hover:text-brand-blue 
                     transition-colors group"
        >
          <Globe size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-small tabular-nums uppercase">{language}</span>
        </button>

        {/* Notifications [Fixing Canonical Classes cite: image_4c10e8.png] */}
        <button
          className="relative min-h-touch min-w-touch flex items-center justify-center 
                     text-text-secondary hover:text-brand-blue transition-colors"
          aria-label="Alerts"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-transaction-debit 
                             text-white text-[10px] rounded-full flex items-center 
                             justify-center px-1 tabular-nums animate-in fade-in zoom-in">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-app-border hidden sm:block" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={dropdownButtonRef}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 min-h-touch pl-2 pr-1 
                       rounded-lg hover:bg-app-background transition-all"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-small font-semibold text-text-primary leading-none mb-1">
                {userName}
              </p>
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${roleBadgeStyle}`}>
                {userRole}
              </span>
            </div>

            <div className="h-9 w-9 bg-brand-navy text-text-inverse rounded-full flex items-center justify-center border-2 border-app-border">
              <User size={18} />
            </div>

            <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-app-surface border border-app-border rounded-card shadow-card py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-app-border mb-1 sm:hidden">
                <p className="text-small font-bold text-text-primary">{userName}</p>
                <p className="text-[11px] text-text-muted capitalize">{userRole}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-small text-text-secondary hover:bg-app-background transition-colors">
                <Settings size={16} />
                {language === 'EN' ? 'Account Settings' : 'खाते सेटिंग्ज'}
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-small text-transaction-debit hover:bg-transaction-debitBg transition-colors font-semibold"
              >
                <LogOut size={16} />
                {language === 'EN' ? 'Sign Out' : 'बाहेर पडा'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;