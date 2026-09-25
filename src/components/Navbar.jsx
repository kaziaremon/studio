import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard, ChevronRight, Sun, Moon, DollarSign } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function Navbar({ theme, onToggleTheme, onOpenPortal, onBookAudit }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currency, toggleCurrency } = useCurrency();

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
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Blog', href: '#blog' },
    { name: 'ROI Calculator', href: '#roi-calculator' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-nav py-1 shadow-2xl'
            : 'bg-transparent py-2.5 sm:py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Prominent High-Visibility Logo (Strict 85px Zero-Compression Rule) */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none shrink-0 py-0.5">
            <img
              src="./assets/images/logo.png"
              alt="Whiz Studio Logo"
              style={{
                height: '85px',
                minHeight: '85px',
                width: 'auto',
                objectFit: 'contain',
                maxHeight: 'none',
                display: 'block'
              }}
              className="whiz-logo-strict w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_4px_16px_rgba(0,168,107,0.35)]"
            />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 liquid-glass p-1.5 rounded-full backdrop-blur-xl shadow-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Global Currency Switcher Toggle [ $ USD | ৳ BDT ] */}
            <button
              onClick={toggleCurrency}
              className="px-3 py-2 rounded-xl liquid-glass hover:bg-slate-800/80 text-white text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border border-brand-green-whiz/30"
              title={`Switch Global Currency (Active: ${currency})`}
              aria-label="Toggle currency between USD and BDT"
            >
              <span className={currency === 'USD' ? 'text-brand-green-400 font-extrabold' : 'text-slate-400'}>
                $ USD
              </span>
              <span className="text-slate-600">|</span>
              <span className={currency === 'BDT' ? 'text-brand-accent-orange font-extrabold' : 'text-slate-400'}>
                ৳ BDT
              </span>
            </button>

            {/* Synchronized Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="px-3 py-2 rounded-xl liquid-glass hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm"
              title={theme === 'dark' ? 'Dark Mode active. Click for Light Mode.' : 'Light Mode active. Click for Dark Mode.'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-[11px] font-medium text-amber-300 hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-medium text-slate-700 hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Main CTA */}
            <button
              onClick={() => onBookAudit()}
              className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg hover:shadow-brand-green-whiz/25 flex items-center gap-1.5"
            >
              <span>Book Growth Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex xl:hidden items-center gap-2">
            {/* Mobile Currency Switcher */}
            <button
              onClick={toggleCurrency}
              className="px-2.5 py-2 rounded-lg liquid-glass text-xs font-mono font-bold text-brand-green-400"
              aria-label="Toggle currency"
            >
              {currency === 'USD' ? '$ USD' : '৳ BDT'}
            </button>

            {/* Mobile Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg liquid-glass text-slate-300"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg liquid-glass text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 xl:hidden bg-black/95 backdrop-blur-2xl pt-24 px-6 pb-8 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              Navigation Menu
            </div>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 text-lg font-bold text-slate-200 hover:text-brand-green-whiz border-b border-slate-800/80"
              >
                <span>{link.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookAudit();
              }}
              className="w-full py-3.5 rounded-xl bg-brand-green-whiz text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg"
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
