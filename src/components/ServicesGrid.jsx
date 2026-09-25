import React, { useState } from 'react';
import { servicesData } from '../data/servicesData';
import { Sparkles, Layers, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';

export default function ServicesGrid({ onBookService }) {
  // State for expanded service card descriptions
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section id="services" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Glow background accents */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-brand-green-whiz/10 via-purple-600/10 to-brand-accent-orange/10 blur-[140px] rounded-full" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-green-whiz" />
          <span>Core Growth Services</span>
        </div>
        <h2 className="fluid-heading-lg font-extrabold text-white tracking-tight">
          Engineered for Performance & <br className="hidden sm:inline" />
          <span className="text-gradient-whiz">Sustainable Scalability</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Four foundational disciplines engineered to capture demand, eliminate tracking leakage, and protect business profitability.
        </p>
      </div>

      {/* 4 Core Services Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
        {servicesData.map((service) => {
          const isExpanded = expandedId === service.id;
          return (
            <div
              key={service.id}
              className="liquid-glass rounded-3xl p-7 sm:p-9 border border-slate-800/80 hover:border-brand-green-whiz/50 transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden"
            >
              <div>
                {/* Header & Icon */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${service.iconColor}15`,
                        color: service.iconColor,
                        border: `1px solid ${service.iconColor}35`
                      }}
                    >
                      <ServiceIcon id={service.id} className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        {service.category}
                      </span>
                      <div className="text-xs font-semibold text-brand-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green-400 animate-pulse" />
                        {service.badge}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(service.id)}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-brand-green-whiz/40 transition-colors flex items-center gap-1 text-xs font-medium"
                    aria-label={`Toggle description for ${service.name}`}
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Title & Tagline */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-green-400 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {service.tagline}
                </p>

                {/* Metrics Highlight Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/60 mb-6 text-center">
                  {service.metrics.map((m, mIdx) => (
                    <div key={mIdx}>
                      <div className="text-sm font-bold font-mono text-white group-hover:text-brand-green-400 transition-colors">
                        {m.value}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight truncate">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expanded Detailed Value Proposition Description */}
                {isExpanded && (
                  <div className="mb-6 p-4 rounded-2xl bg-slate-950/70 border border-brand-green-whiz/30 space-y-3 animate-fadeIn">
                    <div className="text-xs font-bold text-brand-green-400 uppercase tracking-wider font-mono">
                      Strategic Value Proposition
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="text-xs text-slate-400 pt-1">
                      <strong>Best Suited For:</strong> {service.idealFor}
                    </div>
                  </div>
                )}

                {/* Key Execution Deliverables */}
                <div className="space-y-2 mb-6 pt-2 border-t border-slate-800/80">
                  {service.features.slice(0, 3).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onBookService(service.name)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-brand-green-whiz hover:text-slate-950 text-white font-bold text-xs border border-slate-800 hover:border-brand-green-whiz transition-all flex items-center justify-center gap-2"
                >
                  <span>Inquire About {service.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Integration Callout Banner */}
      <div className="mt-16 liquid-glass rounded-3xl p-6 sm:p-8 border border-brand-green-whiz/30 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-brand-green-whiz/40 flex items-center justify-center text-brand-green-whiz shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              Looking for a cohesive multi-channel consultation?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              We connect ad buying, tracking telemetry, and financial forecasting into a unified quarterly roadmap.
            </p>
          </div>
        </div>

        <button
          onClick={() => onBookService("Complete Growth Architecture")}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shrink-0 shadow-lg"
        >
          <span>Schedule Full Stack Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
