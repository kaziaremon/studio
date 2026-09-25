import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Heart, Send, Scale } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';
import TermsModal from './TermsModal';

export default function Footer({ onOpenPortal }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  // Official Untouched Brand Colors
  const socialLinks = [
    { name: 'Facebook', id: 'facebook-marketing', href: 'https://facebook.com', color: '#1877F2' },
    { name: 'Instagram', id: 'instagram-marketing', href: 'https://instagram.com', color: '#E1306C' },
    { name: 'WhatsApp', id: 'whatsapp-marketing', href: 'https://whatsapp.com', color: '#25D366' },
    { name: 'YouTube', id: 'youtube-marketing', href: 'https://youtube.com', color: '#FF0000' },
    { name: 'Pinterest', id: 'pinterest-marketing', href: 'https://pinterest.com', color: '#E60023' },
    { name: 'LinkedIn', id: 'linkedin-marketing', href: 'https://linkedin.com', color: '#0A66C2' },
  ];

  return (
    <>
      <footer className="relative bg-brand-dark-950 border-t border-slate-800/80 pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-brand-green-whiz/5 blur-[140px] rounded-full" />

        <div className="max-w-7xl mx-auto">
          {/* Top Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-slate-800/80">
            {/* Brand Info Col */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
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
                  className="whiz-logo-strict w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,168,107,0.35)]"
                />
              </div>
              
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                Whiz Studio is a premier digital platform management and multi-channel marketing agency. We engineer full-funnel acquisition, server-side data telemetry, and automated sales architectures.
              </p>

              {/* Social Media Routing with Official Untouched Brand Colors */}
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">
                  Connect Across Ecosystems
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-xl liquid-glass border border-slate-800 flex items-center justify-center hover:border-brand-green-whiz/50 transition-all hover:scale-110 shadow-sm"
                      style={{ color: social.color }}
                      aria-label={`Visit Whiz Studio on ${social.name}`}
                    >
                      <ServiceIcon id={social.id} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Sitemap Columns */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-brand-green-400 font-bold">
                Core Services
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><a href="#services" className="hover:text-white transition-colors">Facebook Advertising</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Social Media Marketing</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Platform Optimization</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Business Growth Planning</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Google Ads & PMax</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">WhatsApp CRM Engine</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">LinkedIn Enterprise B2B</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-brand-accent-orange font-bold">
                Platform Hub
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><a href="#about" className="hover:text-white transition-colors">About Whiz Studio</a></li>
                <li><a href="#roi-calculator" className="hover:text-white transition-colors">Ad ROI Simulator</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Client Testimonials</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Knowledge Base & Blog</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Answered Questions</a></li>
                <li><button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors text-left">Payment Terms (60-20-20)</button></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                The Whiz Growth Dispatch
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Join 12,000+ CMOs and digital leaders receiving our weekly teardowns of algorithm changes, high-ROAS hooks, and platform updates.
              </p>

              {subscribed ? (
                <div className="p-3 rounded-xl bg-brand-green-950/60 border border-brand-green-800/40 text-brand-green-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Subscribed to Growth Dispatch! Check your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-brand-green-whiz text-slate-950 font-bold text-xs hover:bg-brand-green-400 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-brand-green-500 animate-pulse" />
                <span>Whiz Platform Engine SLA: 99.98% Uptime</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © {new Date().getFullYear()} Whiz Studio Inc. All rights reserved. Precision Digital Platform Governance.
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors">
                Terms of Service
              </button>
              <button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors">
                Payment Policy (60-20-20)
              </button>
              <a href="#contact" className="hover:text-white transition-colors">
                Security & SLA
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms & Payment Policy Modal */}
      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </>
  );
}
