import React from 'react';
import { Shield, TrendingUp, Cpu, Award, CheckCircle2, ArrowRight, Sparkles, Target, Compass } from 'lucide-react';
import { getCompanyStats } from '../utils/companyStats';

export default function AboutSection({ onBookAudit }) {
  const stats = getCompanyStats();

  const philosophies = [
    {
      icon: Target,
      title: "Data-Driven Precision",
      desc: "If an ad metric cannot be measured accurately, it cannot be scaled safely. We build first-party server telemetry to eliminate blind spots in attribution."
    },
    {
      icon: TrendingUp,
      title: "Unit Economics Over Vanity",
      desc: "Impressions and clicks do not pay bills. Every strategy is evaluated by contribution margin, blended acquisition cost, and cash-flow health."
    },
    {
      icon: Compass,
      title: "Disciplined Strategic Planning",
      desc: "We avoid erratic campaign testing. Each step follows a systematic validation roadmap that protects ad account health and long-term brand equity."
    },
    {
      icon: Shield,
      title: "Radical Transparency",
      desc: "Complete ownership of all ad accounts, custom audiences, and creative assets. Direct communication with strategic consultants without intermediary layers."
    }
  ];

  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Dark/Purple Subtle Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-brand-green-whiz/8 blur-[130px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm border border-brand-green-whiz/30">
            <Sparkles className="w-3.5 h-3.5 text-brand-green-400" />
            <span>MISSION & PHILOSOPHY</span>
          </div>
          <h2 className="fluid-heading-lg font-extrabold tracking-tight text-white mb-6">
            A Data-First Approach to <br className="hidden sm:inline" />
            <span className="text-gradient-whiz">Sustainable Business Growth</span>
          </h2>
          <p className="fluid-lead text-slate-300 max-w-2xl mx-auto">
            Our mission is simple: eliminate wasted advertising spend by combining deep technical tracking architecture with high-converting customer acquisition strategies.
          </p>
        </div>

        {/* Dynamic Statistics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20">
          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-green-whiz/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-400 font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.experienceText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Consulting Experience
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Active Industry Track Record
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-purple-500/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.projectsText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Campaigns & Projects Scaled
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Multi-Channel Portfolio
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
              Realistic Quality Standard
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-6 text-center group hover:border-brand-green-whiz/40 transition-all duration-300">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-green-emerald font-mono mb-2 group-hover:scale-105 transition-transform">
              {stats.avgRoasText}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              Average Blended ROAS
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Verified Across Niches
            </div>
          </div>
        </div>

        {/* 4 Core Philosophies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {philosophies.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="liquid-glass rounded-3xl p-8 hover:border-purple-500/40 transition-all duration-300 group flex gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-brand-green-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-green-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit CTA Box */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 border border-brand-green-whiz/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Ready to Evaluate Your Current Acquisition Channels?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              We provide an objective diagnosis of your current ad spend, tracking integrity, and conversion bottlenecks.
            </p>
          </div>
          <button
            onClick={onBookAudit}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-lg hover:shadow-brand-green-whiz/25 shrink-0 flex items-center gap-2"
          >
            <span>Request Growth Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
