import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Calculator, TrendingUp, DollarSign, Users, Target, ArrowRight, Check, Sparkles } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';

export default function RoiCalculator({ onClaimProjection }) {
  const [budget, setBudget] = useState(15000);
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    'facebook-marketing',
    'instagram-marketing',
    'google-ads',
    'whatsapp-marketing',
  ]);
  const [industry, setIndustry] = useState('ecommerce');

  const industries = [
    { id: 'ecommerce', name: 'E-Commerce / DTC', baseRoas: 4.8, cpc: 1.10, cvr: 3.8 },
    { id: 'saas', name: 'B2B SaaS / Tech', baseRoas: 5.4, cpc: 2.80, cvr: 4.5 },
    { id: 'highticket', name: 'High-Ticket Services', baseRoas: 6.2, cpc: 3.40, cvr: 5.2 },
    { id: 'realestate', name: 'Real Estate & Luxury', baseRoas: 7.1, cpc: 2.10, cvr: 3.2 },
  ];

  const currentIndustry = industries.find((i) => i.id === industry) || industries[0];

  const togglePlatform = (id) => {
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  // Calculations
  const calculated = useMemo(() => {
    // Multi-channel synergy bonus (more channels = higher attribution & retention)
    const synergyMultiplier = 1 + (selectedPlatforms.length - 1) * 0.08;
    const effectiveRoas = (currentIndustry.baseRoas * synergyMultiplier).toFixed(2);
    
    const projectedRevenue = Math.round(budget * effectiveRoas);
    const estimatedClicks = Math.round(budget / currentIndustry.cpc);
    const estimatedConversions = Math.round((estimatedClicks * currentIndustry.cvr) / 100);
    const estimatedReach = Math.round((budget / 10) * 1250);

    return {
      effectiveRoas,
      projectedRevenue,
      estimatedClicks,
      estimatedConversions,
      estimatedReach,
    };
  }, [budget, selectedPlatforms, currentIndustry]);

  const handleConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00A86B', '#10B981', '#FF5E1E', '#F97316'],
    });

    onClaimProjection({
      budget,
      selectedPlatforms,
      industry: currentIndustry.name,
      projectedRevenue: calculated.projectedRevenue,
      roas: calculated.effectiveRoas,
    });
  };

  const platformsList = [
    { id: 'facebook-marketing', name: 'Facebook' },
    { id: 'instagram-marketing', name: 'Instagram' },
    { id: 'google-ads', name: 'Google Ads' },
    { id: 'whatsapp-marketing', name: 'WhatsApp' },
    { id: 'youtube-ads', name: 'YouTube' },
    { id: 'pinterest-ads', name: 'Pinterest' },
    { id: 'linkedin-marketing', name: 'LinkedIn' },
  ];

  return (
    <section id="roi-calculator" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-whiz/10 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <Calculator className="w-3.5 h-3.5 text-brand-green-whiz" />
          Interactive Forecasting
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Ad Spend & Platform <span className="text-gradient-whiz">ROI Simulator</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Simulate your projected revenue and ROAS based on Whiz Studio’s real client benchmarks across paid and conversational channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 bg-brand-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Step 1: Monthly Budget Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-green-400" />
                Monthly Target Ad Spend
              </label>
              <span className="text-2xl font-mono font-extrabold text-brand-green-whiz">
                ${budget.toLocaleString()} / mo
              </span>
            </div>

            <input
              type="range"
              min="2000"
              max="100000"
              step="1000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-whiz"
            />

            <div className="flex justify-between text-xs font-mono text-slate-400 mt-2">
              <span>$2k/mo</span>
              <span>$25k/mo</span>
              <span>$50k/mo</span>
              <span>$100k+/mo</span>
            </div>
          </div>

          {/* Step 2: Industry Selector */}
          <div className="mb-8">
            <label className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-brand-accent-orange" />
              Select Industry Vertical
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`p-3 rounded-xl text-xs font-semibold text-center transition-all border ${
                    industry === ind.id
                      ? 'bg-brand-accent-orange/15 border-brand-accent-orange text-brand-accent-orange'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Platform Selection Pills */}
          <div>
            <label className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-brand-green-400" />
              Target Growth Channels
            </label>
            <div className="flex flex-wrap gap-2.5">
              {platformsList.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-brand-green-whiz/15 border-brand-green-whiz text-brand-green-300 shadow-md shadow-brand-green-whiz/10'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ServiceIcon id={p.id} className="w-3.5 h-3.5" />
                    <span>{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-green-400" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              *Multi-channel synergy adds up to +32% cross-device conversion lift.
            </p>
          </div>
        </div>

        {/* Right Output Projections Column */}
        <div className="lg:col-span-5 bg-gradient-to-b from-brand-dark-900 to-slate-950 border-2 border-brand-green-whiz/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-60 h-60 bg-brand-green-whiz/15 rounded-full blur-3xl" />

          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Simulated Forecast
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-400 bg-brand-green-950/80 px-2.5 py-1 rounded-full border border-brand-green-800/40">
              <Sparkles className="w-3 h-3" />
              High-Velocity Model
            </span>
          </div>

          {/* Big Number: Projected Revenue */}
          <div className="mb-6">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Estimated Monthly Revenue
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white mt-1 text-gradient-whiz">
              ${calculated.projectedRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Projected ROI Return: <strong className="text-brand-green-400 font-mono text-sm">{calculated.effectiveRoas}x ROAS</strong>
            </div>
          </div>

          {/* Breakdown KPI Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Estimated Reach</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {calculated.estimatedReach.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Target Traffic Clicks</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {calculated.estimatedClicks.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Qualified Orders / Leads</div>
              <div className="text-lg font-bold text-brand-accent-orange font-mono mt-0.5">
                {calculated.estimatedConversions.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Active Channels</div>
              <div className="text-lg font-bold text-brand-green-400 font-mono mt-0.5">
                {selectedPlatforms.length} Ecosystems
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleConfetti}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-400 text-slate-950 font-black text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-xl hover:shadow-brand-green-whiz/30 flex items-center justify-center gap-2 group"
          >
            <span>Lock In This Forecast & Book Audit</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <div className="text-center mt-3">
            <span className="text-[11px] text-slate-400">
              Includes 30-Day Platform Audit & CAPI Setup Guarantee
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
