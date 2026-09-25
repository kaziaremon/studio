import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function Navbar({ onOpenPortal, onBookAudit }) {
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
            ? 'glass-nav py-3.5 shadow-2xl shadow-black/50'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Integration */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center">
              <img
                src="./assets/images/logo.png"
                alt="Whiz Studio Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_12px_rgba(0,168,107,0.3)]"
              />
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-full border border-slate-800/80 backdrop-blur-xl">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Client Portal Button */}
            <button
              onClick={onOpenPortal}
              className="relative px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-brand-green-whiz/50 text-slate-200 text-xs font-bold transition-all duration-200 flex items-center gap-2 group"
            >
              <span className="w-2 h-2 rounded-full bg-brand-green-500 animate-pulse" />
              <LayoutDashboard className="w-3.5 h-3.5 text-brand-green-400 group-hover:text-brand-green-300" />
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
            <button
              onClick={onOpenPortal}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-brand-green-400 text-xs font-bold"
              aria-label="Client Portal"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-black/90 backdrop-blur-xl pt-24 px-6 pb-8 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              Navigation
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
                onOpenPortal();
              }}
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-green-400" />
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
