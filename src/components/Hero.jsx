import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, CheckCircle2, ChevronRight, BarChart3 } from 'lucide-react';
import HeroCanvas from './HeroCanvas';

export default function Hero({ onBookAudit }) {
  const corePillars = [
    { title: 'Facebook Advertising', metric: 'Advantage+ & CAPI' },
    { title: 'Social Media Marketing', metric: 'Multi-Channel Reach' },
    { title: 'Platform Optimization', metric: 'Tracking & Conversion' },
    { title: 'Business Growth Planning', metric: 'Unit Economics' },
  ];

  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-brand-dark-950">
      {/* Interactive Canvas Background */}
      <HeroCanvas />

      {/* Modern Radial Mesh with Dark/Purple & Emerald Accents */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-tr from-brand-green-whiz/10 via-purple-600/10 to-brand-accent-orange/10 blur-[150px] opacity-75" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-dark-950 to-transparent z-10" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Grounded Authority Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full liquid-glass text-xs font-mono font-medium text-slate-200 mb-8 shadow-lg border border-brand-green-whiz/30">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green-whiz" />
          </span>
          <span className="text-brand-green-400 font-bold">DIGITAL MARKETING CONSULTANT</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Data-Backed Strategy & Platform Optimization</span>
        </div>

        {/* Headline: Simple, Fluent, Attractive & Grounded */}
        <h1 className="fluid-heading-xl font-extrabold tracking-tight text-white mb-6">
          Predictable Growth Built on <br className="hidden sm:inline" />
          <span className="text-gradient-dual">Data, Discipline & Clarity</span>
        </h1>

        {/* Subtitle: No spammy jargon, strictly realistic and trustworthy */}
        <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed font-normal mb-10">
          We help ambitious businesses scale their revenue through structured paid advertising, technical platform optimization, and robust business growth planning. No unrealistic shortcuts—just transparent, measurable performance.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onBookAudit()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-emerald text-slate-950 font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-brand-green-whiz/25 flex items-center justify-center gap-2.5 group"
          >
            <span>Book a Growth Audit</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <a
            href="#services"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl liquid-glass hover:bg-slate-800/80 text-white font-bold text-sm border border-slate-700/80 hover:border-brand-green-whiz/50 transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Core Services</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* 4 Core Pillars Stream */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {corePillars.map((pillar, idx) => (
              <div
                key={idx}
                className="liquid-glass rounded-2xl p-3.5 text-center border border-slate-800/80 hover:border-brand-green-whiz/40 transition-all duration-200"
              >
                <div className="text-xs font-bold text-white mb-0.5">
                  {pillar.title}
                </div>
                <div className="text-[11px] font-mono text-brand-green-400">
                  {pillar.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
