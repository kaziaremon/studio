import React from 'react';
import { Shield, TrendingUp, Cpu, Award, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { getCompanyStats } from '../utils/companyStats';

export default function AboutSection({ onBookAudit }) {
  const stats = getCompanyStats();

  const pillars = [
    {
      icon: Cpu,
      title: "Data-First Platform Governance",
      desc: "Zero reliance on flawed browser cookies. We engineer server-side Conversions API (CAPI) infrastructure that captures 100% of purchase signals."
    },
    {
      icon: TrendingUp,
      title: "Unit-Economics & ROAS Scaling",
      desc: "We prioritize contribution margin and blended CAC over vanity impressions. Every dollar spent is tied directly to bottom-line profitability."
    },
    {
      icon: Shield,
      title: "Strict Brand Safety & Compliance",
      desc: "Enterprise-grade policy compliance protocols to ensure ad account stability, high trust scores, and zero disruption to your active sales channels."
    },
    {
      icon: Award,
      title: "High-Velocity Creative Engines",
      desc: "Continuous creative iteration, dynamic hook testing, and conversion-engineered visual assets customized for each target ecosystem."
    }
  ];

  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Background Accent Mesh */}
      <div className="pointer-events-none absolute top-1/2 left-0 w-96 h-96 bg-brand-green-whiz/5 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-brand-accent-orange/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-green-400" />
            <span>ABOUT WHIZ STUDIO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            Architecting Scalable Growth for <br className="hidden sm:inline" />
            <span className="text-gradient-whiz">Modern Digital Ecosystems</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Whiz Studio is a bespoke digital platform management and growth advisory agency. We bridge the gap between technical tracking infrastructure, high-intent audience modeling, and profitable media buying across all major ad networks.
          </p>
        </div>

        {/* Dynamic Auto-Scaling Statistics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20">
          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-green-whiz/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-400 font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.experienceText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Industry Experience
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Dynamic Experience Tracker
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-green-whiz/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.projectsText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Projects & Funnels Scaled
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Live Scale Index
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-accent-orange/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-accent-orange font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.successRateText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Verified Client Retention
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Rigorous Quality Metric
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-green-whiz/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-emerald font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.avgRoasText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Average Client Blended ROAS
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Verified Multi-Channel Metric
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="liquid-glass rounded-3xl p-8 hover:border-brand-green-whiz/40 transition-all duration-300 group flex gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-green-950/80 border border-brand-green-800/60 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-brand-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-green-400 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct CTA */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 border border-brand-green-whiz/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Ready to Audit Your Acquisition Channels?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              We diagnose tracking leaks, creative fatigue, and ad waste with an engineering-grade roadmap.
            </p>
          </div>
          <button
            onClick={onBookAudit}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-lg hover:shadow-brand-green-whiz/25 shrink-0 flex items-center gap-2"
          >
            <span>Claim Free Growth Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
