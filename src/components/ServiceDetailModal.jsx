import React from 'react';
import { X, CheckCircle2, TrendingUp, Zap, Shield, ArrowRight, Layers, Target } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';

export default function ServiceDetailModal({ service, onClose, onBookService }) {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-brand-dark-900 border border-slate-700/80 p-6 sm:p-10 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div 
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: service.iconColor }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center p-3.5 shadow-lg"
            style={{
              backgroundColor: `${service.iconColor}18`,
              color: service.iconColor,
              border: `1px solid ${service.iconColor}40`,
            }}
          >
            <ServiceIcon id={service.id} className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-green-400 bg-brand-green-950/60 px-2.5 py-0.5 rounded-full border border-brand-green-800/40">
                {service.category}
              </span>
              <span className="text-xs font-semibold text-brand-accent-orange">
                ✦ {service.badge}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {service.name}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
          {service.description}
        </p>

        {/* Performance Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 rounded-2xl bg-brand-dark-950 border border-slate-800 mb-8">
          {service.metrics.map((m, idx) => (
            <div key={idx} className="text-center p-2">
              <div className="text-xl sm:text-2xl font-mono font-black text-brand-green-400">
                {m.value}
              </div>
              <div className="text-xs font-medium text-slate-400 mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Two Columns: Core Capabilities & Deliverables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Column 1 */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand-green-400" />
              Strategic Capabilities
            </h4>
            <ul className="space-y-2.5">
              {service.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-green-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-brand-accent-orange" />
              Standard Agency Deliverables
            </h4>
            <ul className="space-y-2.5">
              {service.deliverables.map((deliv, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-orange shrink-0 mt-2" />
                  <span>{deliv}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                <strong className="text-white">Ideal Target: </strong> {service.idealFor}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-green-400" />
            <span>Includes 24/7 Platform Health & Server-side CAPI Governance</span>
          </div>

          <button
            onClick={() => {
              onClose();
              onBookService(service.name);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-bold text-sm hover:opacity-95 transition-all shadow-lg hover:shadow-brand-green-whiz/30 flex items-center justify-center gap-2"
          >
            <span>Deploy {service.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
