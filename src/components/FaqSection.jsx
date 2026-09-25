import React, { useState } from 'react';
import { faqsData } from '../data/servicesData';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-whiz/10 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <HelpCircle className="w-3.5 h-3.5 text-brand-green-whiz" />
          Transparency & Onboarding
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Frequently Answered <span className="text-gradient-whiz">Questions</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Everything you need to know about our platform management SLA, ad spend requirements, and performance guarantees.
        </p>
      </div>

      <div className="space-y-4">
        {faqsData.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-brand-dark-900 border-brand-green-whiz/50 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="text-base sm:text-lg font-bold text-white">
                  {faq.q}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen
                      ? 'rotate-180 bg-brand-green-whiz text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-slate-800/60 animate-fadeIn">
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
