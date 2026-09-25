import React, { useState } from 'react';
import { caseStudiesData } from '../data/servicesData';
import { TrendingUp, Award, ArrowUpRight, CheckCircle2, Quote } from 'lucide-react';

export default function CaseStudies({ onBookAudit }) {
  const [selectedCase, setSelectedCase] = useState(caseStudiesData[0]);

  return (
    <section id="case-studies" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Glow */}
      <div className="pointer-events-none absolute right-10 top-1/3 w-80 h-80 bg-brand-green-whiz/10 blur-[120px] rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-whiz/10 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <Award className="w-3.5 h-3.5 text-brand-green-whiz" />
          Verified Proof of ROI
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Transformational <span className="text-gradient-whiz">Client Case Studies</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Explore how Whiz Studio deploys multi-channel paid ads and platform management to unlock breakout revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Case Study Picker */}
        <div className="lg:col-span-5 space-y-4">
          {caseStudiesData.map((item) => {
            const isSelected = selectedCase.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className={`p-6 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-brand-dark-900 border-brand-green-whiz shadow-xl shadow-brand-green-whiz/15'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-green-400">
                    {item.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-accent-orange">
                    {item.metrics[0].key}: {item.metrics[0].val}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.headline}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Case Spotlight */}
        <div className="lg:col-span-7 bg-brand-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-brand-green-400">
                {selectedCase.category} Featured Growth Breakdown
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {selectedCase.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCase.platforms.map((p, pIdx) => (
                <span key={pIdx} className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 text-[11px] font-mono border border-slate-800">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <h4 className="text-lg sm:text-xl font-bold text-white mb-6 leading-snug">
            "{selectedCase.headline}"
          </h4>

          {/* 3 Metric Pillars */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {selectedCase.metrics.map((m, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-2xl sm:text-3xl font-black font-mono text-brand-green-400">
                  {m.val}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">
                  {m.key}
                </div>
              </div>
            ))}
          </div>

          {/* Client Testimonial Quote */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 relative mb-8">
            <Quote className="w-8 h-8 text-brand-green-whiz/30 absolute top-4 right-4" />
            <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed mb-4">
              "{selectedCase.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green-whiz/20 border border-brand-green-whiz flex items-center justify-center font-bold text-brand-green-400 text-sm">
                {selectedCase.clientName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{selectedCase.clientName}</div>
                <div className="text-xs text-slate-400">{selectedCase.clientRole}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onBookAudit(`Replicate results for ${selectedCase.category}`)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-bold text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Achieve Similar Results For Your Brand</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
