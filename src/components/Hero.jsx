import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, Zap, CheckCircle2, Play } from 'lucide-react';
import HeroCanvas from './HeroCanvas';
import { ServiceIcon } from './ServiceIcons';

export default function Hero({ onBookAudit, onOpenPortal }) {
  const platformBadges = [
    { name: 'Meta Ads (FB & IG)', id: 'facebook-marketing', color: '#1877F2' },
    { name: 'Google Ads & PMax', id: 'google-ads', color: '#4285F4' },
    { name: 'WhatsApp Cloud CRM', id: 'whatsapp-marketing', color: '#25D366' },
    { name: 'YouTube Video Ads', id: 'youtube-ads', color: '#FF0000' },
    { name: 'Pinterest Visual Shopping', id: 'pinterest-marketing', color: '#E60023' },
    { name: 'LinkedIn Enterprise B2B', id: 'linkedin-marketing', color: '#0A66C2' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-brand-dark-950">
      {/* Dynamic Interactive HTML5 Canvas Constellation */}
      <HeroCanvas />

      {/* Radial Gradient Background Meshes */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-hero-mesh blur-[140px] opacity-70" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-brand-dark-950 to-transparent z-10" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-brand-green-whiz/40 text-xs font-mono font-medium text-slate-200 mb-8 backdrop-blur-xl shadow-lg shadow-brand-green-whiz/10">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green-whiz"></span>
          </span>
          <span className="text-brand-green-400 font-bold">WHIZ STUDIO</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Enterprise Digital Platform Governance & High-Velocity Ad Scaling</span>
        </div>

        {/* Powerful Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Scale Your Digital Ecosystem with <br className="hidden sm:inline" />
          <span className="text-gradient-dual">Precision Platform Management</span>
        </h1>

        {/* Sub-headline */}
        <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed font-normal mb-10">
          We engineer full-funnel acquisition architectures, 24/7 server-side tracking governance, and high-converting paid ad engines across <strong className="text-white">Meta, Google, YouTube, WhatsApp, Pinterest & LinkedIn</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={() => onBookAudit()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-400 text-slate-950 font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-brand-green-whiz/30 flex items-center justify-center gap-2.5 group"
          >
            <span>Book Free Platform Audit</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => onOpenPortal()}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 hover:border-brand-green-whiz/50 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-brand-green-whiz fill-brand-green-whiz" />
            <span>Explore Client Portal Live Demo</span>
          </button>
        </div>

        {/* Live Platform Status Stream */}
        <div className="max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-4">
            Certified Multi-Channel Ecosystem
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {platformBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all shadow-sm"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <ServiceIcon id={badge.id} className="w-3.5 h-3.5" />
                </div>
                <span>{badge.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
