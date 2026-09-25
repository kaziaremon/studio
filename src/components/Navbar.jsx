import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard, ChevronRight, Sun, Moon } from 'lucide-react';

export default function Navbar({ theme, onToggleTheme, onOpenPortal, onBookAudit }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'Platform Hub', href: '#platform-management' },
    { name: 'ROI Calculator', href: '#roi-calculator' },
    { name: 'Case Studies', href: '#case-studies' },
    { name: 'Framework', href: '#process' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-nav py-2 shadow-xl'
            : 'bg-transparent py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Prominent High-Visibility Logo */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none shrink-0 py-0.5">
            <img
              src="./assets/images/logo.png"
              alt="Whiz Studio Logo"
              style={{ height: '80px', width: 'auto', minHeight: '80px', maxHeight: '80px' }}
              className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_4px_16px_rgba(0,168,107,0.35)]"
            />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Synchronized Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm"
              title={theme === 'dark' ? 'Dark Mode is active. Click to switch to Light Mode.' : 'Light Mode is active. Click to switch to Dark Mode.'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-[11px] font-medium text-amber-300">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-medium text-slate-700">Dark Mode</span>
                </>
              )}
            </button>

            {/* Client Portal Button */}
            <button
              onClick={onOpenPortal}
              className="relative px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-brand-green-whiz/50 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all duration-200 flex items-center gap-2 group shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-brand-green-500 animate-pulse" />
              <LayoutDashboard className="w-3.5 h-3.5 text-brand-green-500 group-hover:text-brand-green-600 dark:text-brand-green-400 dark:group-hover:text-brand-green-300" />
              <span>Client Portal</span>
            </button>

            {/* Main CTA */}
            <button
              onClick={() => onBookAudit()}
              className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg hover:shadow-brand-green-whiz/25 flex items-center gap-1.5"
            >
              <span>Book Growth Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={onOpenPortal}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-brand-green-500 dark:text-brand-green-400 text-xs font-bold shadow-sm"
              aria-label="Client Portal"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-white/95 dark:bg-black/95 backdrop-blur-xl pt-24 px-6 pb-8 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              Navigation
            </div>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 text-lg font-bold text-slate-900 dark:text-slate-200 hover:text-brand-green-whiz border-b border-slate-200 dark:border-slate-800/80"
              >
                <span>{link.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPortal();
              }}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-sm font-bold flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-green-500 dark:text-brand-green-400" />
              <span>Access Client Portal</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookAudit();
              }}
              className="w-full py-3.5 rounded-xl bg-brand-green-whiz text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              <span>Schedule Free Growth Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
