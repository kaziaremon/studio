import React from 'react';
import { ShieldCheck, Cpu, Flame, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

export default function ProcessSection({ onBookAudit }) {
  const steps = [
    {
      num: "01",
      title: "Platform Audit & Attribution Fortress",
      subtitle: "Day 1 to 5",
      desc: "We perform deep forensic audits on your pixels, Meta CAPI server events, Google Tag Manager, and past ad efficiency to eliminate tracking drop-offs and budget leaks.",
      points: [
        "100% Server-side Meta CAPI & GA4 verification",
        "Competitor keyword & creative reverse-engineering",
        "Ad account security & compliance hardening"
      ]
    },
    {
      num: "02",
      title: "Omnichannel Synergy & Funnel Architecture",
      subtitle: "Day 6 to 10",
      desc: "We engineer synchronized acquisition loops connecting Google Search high-intent capture, Meta visual discovery, YouTube hook videos, and automated WhatsApp CRM recovery.",
      points: [
        "Full-funnel TOFU/MOFU/BOFU campaign structure",
        "WhatsApp Cloud API automated abandoned checkout flow",
        "Audience exclusion matrices to stop redundant spend"
      ]
    },
    {
      num: "03",
      title: "High-Velocity Creative Testing (DCT)",
      subtitle: "Ongoing Iteration",
      desc: "We deploy weekly batches of high-converting hooks, motion graphics, UGC formats, and direct-response copy variations to consistently unlock winning ad sets.",
      points: [
        "3-second hook rate optimization",
        "Dynamic Creative Testing (DCT) frameworks",
        "High-CTR thumbnail & carousel designs"
      ]
    },
    {
      num: "04",
      title: "Exponential Scaling & 24/7 Governance",
      subtitle: "Continuous Growth",
      desc: "Once unit economics are locked in, we scale budgets aggressively while monitoring ad fatigue, platform health, and ROAS via our live Client Portal 24/7.",
      points: [
        "Target ROAS algorithm scaling without CPA spikes",
        "Live 24/7 cross-platform monitoring & instant alerts",
        "Dedicated Growth Director & Weekly Strategy Sprints"
      ]
    }
  ];

  return (
    <section id="process" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-whiz/10 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <Cpu className="w-3.5 h-3.5 text-brand-green-whiz" />
          The Whiz Scale Methodology
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          The 4-Phase <span className="text-gradient-whiz">Growth Architecture</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          How we systematically transform unpredictable marketing campaigns into a compounding, 24/7 client revenue engine.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="relative rounded-3xl bg-brand-dark-900/90 border border-slate-800/90 p-7 backdrop-blur-xl flex flex-col justify-between hover:border-brand-green-whiz/40 hover:-translate-y-1.5 transition-all duration-300 shadow-xl group"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black font-mono text-slate-700 group-hover:text-brand-green-whiz transition-colors">
                  {step.num}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-brand-accent-orange bg-brand-accent-orange/10 px-2.5 py-1 rounded-full border border-brand-accent-orange/30">
                  {step.subtitle}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-green-whiz transition-colors">
                {step.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                {step.desc}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              {step.points.map((pt, pIdx) => (
                <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-green-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Bottom Banner */}
      <div className="mt-16 text-center">
        <button
          onClick={() => onBookAudit()}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-black text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-xl shadow-brand-green-whiz/25"
        >
          <span>Initiate Phase 01: Free Platform Audit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
