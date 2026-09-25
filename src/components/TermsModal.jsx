import React from 'react';
import { X, ShieldCheck, Scale, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto liquid-glass rounded-3xl p-6 sm:p-9 border border-brand-green-whiz/40 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          aria-label="Close Terms modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-green-950 border border-brand-green-500 text-brand-green-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Terms of Service & Engagement Policy
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Whiz Studio International Governance • Strict 60-20-20 Payment Rule
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Milestone Payment Terms Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-brand-green-950/70 border border-brand-green-500/40 space-y-3">
            <div className="flex items-center gap-2 text-brand-green-400 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Strict Milestone Payment Structure (60-20-20 Rule)</span>
            </div>
            <p className="text-xs text-slate-200">
              All bespoke platform management, media buying, and funnel engineering retainers operate under our binding 60-20-20 payment schedule:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-brand-green-800/60 text-center">
                <div className="text-xl font-extrabold text-brand-green-400 font-mono">60%</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Initial Onboarding</div>
                <div className="text-[10px] text-slate-400 mt-1">Due upfront upon contract execution & kickoff.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-brand-accent-orange/60 text-center">
                <div className="text-xl font-extrabold text-brand-accent-orange font-mono">20%</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Midpoint Milestone</div>
                <div className="text-[10px] text-slate-400 mt-1">Due upon funnel completion & tracking verification.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-brand-green-whiz/60 text-center">
                <div className="text-xl font-extrabold text-brand-green-whiz font-mono">20%</div>
                <div className="text-[11px] font-bold text-white mt-0.5">Final Handover</div>
                <div className="text-[10px] text-slate-400 mt-1">Due upon live deployment & strategy signoff.</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-green-400" />
              1. Intellectual Property & Asset Ownership
            </h4>
            <p>
              Upon 100% full settlement of all milestones under the 60-20-20 schedule, the Client retains full, unrestricted ownership of all customized advertising creatives, copy documents, custom audience segments, and server-side tracking assets created specifically for their accounts.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-brand-green-400" />
              2. Confidentiality & Data Security
            </h4>
            <p>
              Whiz Studio enforces rigorous non-disclosure protocols. All client customer telemetry, revenue data, internal margins, and ad account statistics are treated with utmost confidentiality and protected via enterprise cryptographic standards.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green-400" />
              3. Service Level Agreement & Scope Governance
            </h4>
            <p>
              Deliverables and scope parameters are locked prior to the initial 60% onboarding milestone. Any scope adjustments or new platform expansions requested during execution will be evaluated and billed via an authorized change order.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
