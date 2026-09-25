import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Heart, Send, Phone, Mail, Globe } from 'lucide-react';
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

  // Visually appealing grid of platform logos/icons with clickable placeholder links (#)
  const platformEcosystemLinks = [
    { name: 'Meta Ads (Facebook)', id: 'facebook-marketing', href: '#', color: '#1877F2' },
    { name: 'Instagram Marketing', id: 'instagram-marketing', href: '#', color: '#E1306C' },
    { name: 'Google Ads & PMax', id: 'google-ads', href: '#', color: '#4285F4' },
    { name: 'WhatsApp Business CRM', id: 'whatsapp-marketing', href: '#', color: '#25D366' },
    { name: 'YouTube Video Network', id: 'youtube-marketing', href: '#', color: '#FF0000' },
    { name: 'LinkedIn Enterprise B2B', id: 'linkedin-marketing', href: '#', color: '#0A66C2' },
    { name: 'Pinterest Visual Shopping', id: 'pinterest-marketing', href: '#', color: '#E60023' },
  ];

  return (
    <>
      <footer className="relative bg-brand-dark-950 border-t border-slate-800/80 pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-gradient-to-r from-brand-green-whiz/5 via-purple-600/5 to-brand-accent-orange/5 blur-[140px] rounded-full" />

        <div className="max-w-7xl mx-auto">
          {/* Top Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-slate-800/80">
            {/* Brand & Direct Contact Details Col */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src="./assets/images/logo.png"
                  alt="Whiz Studio Logo"
                  style={{
                    minHeight: '80px',
                    maxHeight: '100px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  className="whiz-logo-strict w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,168,107,0.35)]"
                />
              </div>
              
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                Whiz Studio is a bespoke digital marketing consultancy. We combine server-side data integrity, conversion rate optimization, and disciplined media buying to scale ambitious businesses.
              </p>

              {/* Formatted Contact Details Box */}
              <div className="p-4 rounded-2xl liquid-glass border border-slate-800/80 space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-brand-green-400 font-bold">
                  Direct Inquiries & Bookings
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Phone className="w-4 h-4 text-brand-green-whiz shrink-0" />
                  <span><strong>Phone:</strong> +1 (555) 234-5678 / +880 1700-000000</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Mail className="w-4 h-4 text-brand-green-whiz shrink-0" />
                  <span><strong>Webmail:</strong> consult@whizstudio.art</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span><strong>Domain:</strong> whizstudio.art • Global Remote Operations</span>
                </div>
              </div>
            </div>

            {/* Sitemap Columns: 4 Core Services */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-brand-green-400 font-bold">
                Core Services
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><a href="#services" className="hover:text-white transition-colors">Facebook Advertising</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Social Media Marketing</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Platform Optimization</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Business Growth Planning</a></li>
                <li><a href="#roi-calculator" className="hover:text-white transition-colors">ROI Simulator</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-brand-accent-orange font-bold">
                Consulting Hub
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><a href="#about" className="hover:text-white transition-colors">About Our Approach</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Strategic Knowledge Base</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Client Reviews</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Answered Questions</a></li>
                <li><button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors text-left">Terms & 60-20-20 Policy</button></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                Weekly Strategic Briefing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Join forward-thinking founders and marketing directors receiving our weekly teardowns of algorithm changes, CAC reduction tactics, and unit economics.
              </p>

              {subscribed ? (
                <div className="p-3 rounded-xl bg-brand-green-950/60 border border-brand-green-800/40 text-brand-green-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Subscribed! Check your inbox for the briefing.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="founder@company.com"
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
                <span>Client Telemetry & Reporting SLA: 99.98%</span>
              </div>
            </div>
          </div>

          {/* Social & Platform Integration Grid with Clickable Placeholders (#) */}
          <div className="py-8 border-b border-slate-800/80">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4 text-center sm:text-left">
              Ecosystem & Advertising Platform Integrations
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {platformEcosystemLinks.map((plat) => (
                <a
                  key={plat.name}
                  href={plat.href}
                  className="p-3 rounded-2xl liquid-glass border border-slate-800 hover:border-brand-green-whiz/50 transition-all flex flex-col items-center justify-center gap-2 text-center group hover:scale-105 shadow-sm"
                  aria-label={`Integration link for ${plat.name}`}
                >
                  <div style={{ color: plat.color }}>
                    <ServiceIcon id={plat.id} className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate max-w-full">
                    {plat.name.split(' ')[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © {new Date().getFullYear()} Whiz Studio. All rights reserved. Strategic Digital Marketing Consulting.
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
