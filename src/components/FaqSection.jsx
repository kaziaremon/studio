import React, { useState } from 'react';
import { faqsData } from '../data/servicesData';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/5 blur-[150px] rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <HelpCircle className="w-3.5 h-3.5 text-brand-green-whiz" />
          <span>TRANSPARENCY & METHODOLOGY</span>
        </div>
        <h2 className="fluid-heading-lg font-extrabold text-white tracking-tight">
          Frequently Answered <span className="text-gradient-whiz">Questions</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Direct, professional answers regarding our advertising management, social growth frameworks, telemetry tracking, and governance.
        </p>
      </div>

      <div className="space-y-4 relative z-10">
        {faqsData.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden liquid-glass ${
                isOpen
                  ? 'border-brand-green-whiz/50 shadow-2xl bg-brand-purple-900/40'
                  : 'border-slate-800/80 hover:border-brand-green-whiz/30'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer group"
                aria-expanded={isOpen}
              >
                <span className="text-base sm:text-lg font-bold text-white group-hover:text-brand-green-400 transition-colors">
                  {faq.q}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen
                      ? 'rotate-180 bg-brand-green-whiz text-slate-950 font-bold shadow-md shadow-brand-green-whiz/25'
                      : 'bg-slate-900/90 text-slate-400 border border-slate-800 group-hover:text-white'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-slate-800/60 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
