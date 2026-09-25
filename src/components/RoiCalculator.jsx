import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Calculator, TrendingUp, DollarSign, Users, Target, ArrowRight, Check, Sparkles, Sliders } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function RoiCalculator({ onClaimProjection }) {
  const { currency, formatAmount, exchangeRate } = useCurrency();
  
  // Daily budget state normalized to USD base ($1/day minimum equivalent)
  const [dailyBudgetUSD, setDailyBudgetUSD] = useState(10); // $10/day default
  const [selectedService, setSelectedService] = useState('facebook-advertising');

  const servicesROI = [
    { id: 'facebook-advertising', name: 'Facebook Advertising', baseRoas: 4.4, cpmUSD: 5.20, ctr: 0.026, cvr: 0.034 },
    { id: 'social-media-marketing', name: 'Social Media Marketing', baseRoas: 3.8, cpmUSD: 4.20, ctr: 0.031, cvr: 0.028 },
    { id: 'platform-optimization', name: 'Platform Optimization', baseRoas: 5.1, cpmUSD: 6.80, ctr: 0.024, cvr: 0.042 },
    { id: 'business-growth-planning', name: 'Business Growth Planning', baseRoas: 5.6, cpmUSD: 8.50, ctr: 0.022, cvr: 0.048 },
  ];

  const currentService = servicesROI.find(s => s.id === selectedService) || servicesROI[0];

  // Dynamic slider bounds based on currency
  const minDaily = currency === 'BDT' ? 120 : 1;      // $1/day or ৳120/day minimum baseline
  const maxDaily = currency === 'BDT' ? 30000 : 250;  // $250/day or ৳30,000/day
  const stepDaily = currency === 'BDT' ? 120 : 1;

  // Active daily value in current currency
  const displayDailyValue = currency === 'BDT' ? Math.round(dailyBudgetUSD * exchangeRate) : dailyBudgetUSD;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    if (currency === 'BDT') {
      setDailyBudgetUSD(val / exchangeRate);
    } else {
      setDailyBudgetUSD(val);
    }
  };

  // Realistic Digital Marketing Mathematical Model
  const calculated = useMemo(() => {
    const monthlyBudgetUSD = dailyBudgetUSD * 30;
    
    // CPM in USD
    const cpm = currentService.cpmUSD;
    const estimatedMonthlyReach = Math.round((monthlyBudgetUSD / cpm) * 1000);
    const estimatedMonthlyClicks = Math.round(estimatedMonthlyReach * currentService.ctr);
    const estimatedMonthlyLeads = Math.max(1, Math.round(estimatedMonthlyClicks * currentService.cvr));
    const projectedRevenueUSD = Math.round(monthlyBudgetUSD * currentService.baseRoas);

    return {
      monthlyBudgetUSD,
      estimatedMonthlyReach,
      estimatedMonthlyClicks,
      estimatedMonthlyLeads,
      projectedRevenueUSD,
      roas: currentService.baseRoas
    };
  }, [dailyBudgetUSD, currentService]);

  const handleClaim = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00A86B', '#8B5CF6', '#FF5E1E', '#10B981'],
    });

    if (onClaimProjection) {
      onClaimProjection({
        monthlyBudget: formatAmount(calculated.monthlyBudgetUSD),
        projectedRevenue: formatAmount(calculated.projectedRevenueUSD),
        roas: `${calculated.roas}x`,
        service: currentService.name,
      });
    }
  };

  return (
    <section id="roi-calculator" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute top-1/4 right-0 w-[550px] h-[550px] bg-brand-green-whiz/5 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 w-[550px] h-[550px] bg-purple-600/5 blur-[150px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
            <Calculator className="w-3.5 h-3.5 text-brand-green-400" />
            <span>REALISTIC PERFORMANCE SIMULATOR</span>
          </div>
          <h2 className="fluid-heading-lg font-extrabold tracking-tight text-white mb-6">
            Project Your Monthly Reach & <br className="hidden sm:inline" />
            <span className="text-gradient-whiz">Acquisition Returns</span>
          </h2>
          <p className="fluid-lead text-slate-300 max-w-2xl mx-auto">
            Test daily marketing budgets starting from standard low-tier testing levels ($1–$5/day / ৳120–৳600/day). Projections are grounded in industry benchmark CPM and conversion rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Daily Budget Range Slider */}
            <div className="liquid-glass rounded-3xl p-7 sm:p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-green-400" />
                    <span>Daily Ad Investment Budget ({currency})</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    {currency === 'BDT' ? `৳${displayDailyValue.toLocaleString()}` : `$${displayDailyValue.toLocaleString()}`}
                    <span className="text-xs text-slate-400 font-sans font-normal ml-1">/ day</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Monthly Projected Spend
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-brand-green-400 font-mono">
                    {formatAmount(calculated.monthlyBudgetUSD)}
                    <span className="text-xs text-slate-400 font-sans font-normal ml-1">/ mo</span>
                  </div>
                </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={minDaily}
                  max={maxDaily}
                  step={stepDaily}
                  value={displayDailyValue}
                  onChange={handleSliderChange}
                  className="w-full h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-green-whiz focus:outline-none"
                  aria-label="Ad Budget Slider"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{currency === 'BDT' ? '৳120/day (Baseline)' : '$1/day (Baseline)'}</span>
                  <span>{currency === 'BDT' ? '৳6,000/day (Mid-Tier)' : '$50/day (Mid-Tier)'}</span>
                  <span>{currency === 'BDT' ? '৳30,000/day (Scale)' : '$250/day (Scale)'}</span>
                </div>
              </div>
            </div>

            {/* 2. Service Strategy Selector */}
            <div className="liquid-glass rounded-3xl p-7 sm:p-8 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Select Consulting Discipline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {servicesROI.map((serv) => (
                  <button
                    key={serv.id}
                    onClick={() => setSelectedService(serv.id)}
                    className={`p-4 rounded-2xl text-xs font-semibold text-left transition-all duration-200 border ${
                      selectedService === serv.id
                        ? 'bg-slate-900 border-brand-green-whiz text-white shadow-md'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-slate-200 mb-1">{serv.name}</div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-brand-green-400">
                      <span>Benchmark ROAS: {serv.baseRoas}x</span>
                      <span>~{(serv.cvr * 100).toFixed(1)}% CVR</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="liquid-glass rounded-3xl p-7 sm:p-9 border border-brand-green-whiz/40 space-y-6 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Estimated Monthly Pipeline / Revenue
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-gradient-whiz font-mono tracking-tight">
                  {formatAmount(calculated.projectedRevenueUSD)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Realistic Blended ROAS
                  </div>
                  <div className="text-2xl font-extrabold text-brand-green-400 font-mono mt-1">
                    {calculated.roas}x
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Verified performance model
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Est. Conversions / Leads
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {calculated.estimatedMonthlyLeads.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Qualified customer actions
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Estimated High-Intent Clicks
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {calculated.estimatedMonthlyClicks.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Targeted traffic
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Estimated Monthly Reach
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {calculated.estimatedMonthlyReach.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Optimized impressions
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleClaim}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-emerald text-slate-950 font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-brand-green-whiz/30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lock In This Strategic Projection</span>
                </button>
                <div className="text-[11px] text-center text-slate-400">
                  *Projections are calculated from verified conversion benchmarks and actual media costs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
