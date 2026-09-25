import React from 'react';
import { trustMetrics } from '../data/servicesData';
import { TrendingUp, ShieldCheck, Zap, Award, Users } from 'lucide-react';

export default function LivePlatformTicker() {
  return (
    <section className="relative py-12 bg-slate-950 border-y border-slate-800/80 overflow-hidden">
      {/* Subtle Glow background */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-brand-green-whiz/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
          {trustMetrics.map((item, idx) => (
            <div key={idx} className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white tracking-tight group-hover:text-brand-green-whiz transition-colors">
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
