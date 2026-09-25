import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Calculator, TrendingUp, DollarSign, Users, Target, ArrowRight, Check, Sparkles, Sliders } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';
import { useCurrency } from '../context/CurrencyContext';

export default function RoiCalculator({ onClaimProjection }) {
  const { currency, formatAmount, exchangeRate } = useCurrency();
  
  // Daily budget in USD base
  const [dailyBudgetUSD, setDailyBudgetUSD] = useState(25); // Default $25/day ($750/mo)
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    'facebook-marketing',
    'instagram-marketing',
    'google-ads',
    'whatsapp-marketing',
  ]);
  const [industry, setIndustry] = useState('ecommerce');

  const industries = [
    { id: 'ecommerce', name: 'E-Commerce / DTC', baseRoas: 4.6, cpcUSD: 0.65, cvr: 3.4, cpmUSD: 5.50 },
    { id: 'saas', name: 'B2B SaaS / Tech', baseRoas: 5.2, cpcUSD: 1.80, cvr: 4.2, cpmUSD: 8.50 },
    { id: 'highticket', name: 'High-Ticket Services', baseRoas: 5.8, cpcUSD: 2.20, cvr: 4.8, cpmUSD: 9.00 },
    { id: 'realestate', name: 'Real Estate & Luxury', baseRoas: 6.4, cpcUSD: 1.60, cvr: 3.0, cpmUSD: 7.20 },
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

  // Realistic Digital Marketing Algorithm
  const calculated = useMemo(() => {
    const monthlyBudgetUSD = dailyBudgetUSD * 30;
    
    // Multi-channel attribution synergy boost (more channels = higher retention)
    const synergyMultiplier = 1 + (selectedPlatforms.length - 1) * 0.07;
    const effectiveRoas = (currentIndustry.baseRoas * synergyMultiplier).toFixed(2);
    
    const projectedRevenueUSD = Math.round(monthlyBudgetUSD * effectiveRoas);
    const estimatedReach = Math.round((monthlyBudgetUSD / currentIndustry.cpmUSD) * 1000);
    const estimatedClicks = Math.round(monthlyBudgetUSD / currentIndustry.cpcUSD);
    const estimatedConversions = Math.max(1, Math.round((estimatedClicks * currentIndustry.cvr) / 100));

    return {
      monthlyBudgetUSD,
      effectiveRoas,
      projectedRevenueUSD,
      estimatedClicks,
      estimatedConversions,
      estimatedReach,
    };
  }, [dailyBudgetUSD, selectedPlatforms, currentIndustry]);

  const handleConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00A86B', '#10B981', '#FF5E1E', '#F97316'],
    });
    if (onClaimProjection) {
      onClaimProjection({
        monthlyBudget: formatAmount(calculated.monthlyBudgetUSD),
        projectedRevenue: formatAmount(calculated.projectedRevenueUSD),
        roas: `${calculated.effectiveRoas}x`,
        platforms: selectedPlatforms.join(', '),
        industry: currentIndustry.name,
      });
    }
  };

  const platformsList = [
    { id: 'facebook-marketing', name: 'Facebook Ads', icon: 'facebook-marketing', color: '#1877F2' },
    { id: 'instagram-marketing', name: 'Instagram Ads', icon: 'instagram-marketing', color: '#E1306C' },
    { id: 'google-ads', name: 'Google Ads & PMax', icon: 'google-ads', color: '#4285F4' },
    { id: 'whatsapp-marketing', name: 'WhatsApp CRM', icon: 'whatsapp-marketing', color: '#25D366' },
    { id: 'youtube-ads', name: 'YouTube Video Ads', icon: 'youtube-ads', color: '#FF0000' },
    { id: 'linkedin-marketing', name: 'LinkedIn B2B', icon: 'linkedin-marketing', color: '#0A66C2' },
    { id: 'pinterest-marketing', name: 'Pinterest Visual', icon: 'pinterest-marketing', color: '#E60023' },
  ];

  return (
    <section id="roi-calculator" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute top-1/4 right-0 w-[600px] h-[600px] bg-brand-green-whiz/5 blur-[160px] rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-brand-accent-orange/5 blur-[160px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
            <Calculator className="w-3.5 h-3.5 text-brand-green-400" />
            <span>REALISTIC MEDIA PROJECTION SIMULATOR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            Calculate Your Multi-Channel <br className="hidden sm:inline" />
            <span className="text-gradient-whiz">Acquisition ROI & Scale</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Test custom daily ad spend budgets from early testing stages ($5/day / ৳600/day) up to high-velocity scale. Algorithms reflect verified digital marketing benchmark metrics.
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
                    <span>Daily Ad Spend Budget</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    {formatAmount(dailyBudgetUSD)} <span className="text-xs text-slate-400 font-sans font-normal">/ day</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Monthly Projected Spend
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-brand-green-400 font-mono">
                    {formatAmount(calculated.monthlyBudgetUSD)} <span className="text-xs text-slate-400 font-sans font-normal">/ mo</span>
                  </div>
                </div>
              </div>

              {/* Slider (Input type: range) */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={dailyBudgetUSD}
                  onChange={(e) => setDailyBudgetUSD(Number(e.target.value))}
                  className="w-full h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-brand-green-whiz focus:outline-none"
                  aria-label="Daily Ad Spend Range Slider"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatAmount(5)}/day (Testing Tier)</span>
                  <span>{formatAmount(100)}/day (Growth Tier)</span>
                  <span>{formatAmount(500)}/day (Scale Tier)</span>
                </div>
              </div>
            </div>

            {/* 2. Industry Model Selector */}
            <div className="liquid-glass rounded-3xl p-7 sm:p-8 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Select Your Business Model
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setIndustry(ind.id)}
                    className={`p-3.5 rounded-2xl text-xs font-bold text-left transition-all duration-200 ${
                      industry === ind.id
                        ? 'bg-brand-green-whiz/15 border border-brand-green-whiz text-white shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <div className="text-slate-200 font-semibold mb-1">{ind.name}</div>
                    <div className="text-[11px] font-mono text-brand-green-400">
                      Base ROAS: {ind.baseRoas}x
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Multi-Channel Platform Selection */}
            <div className="liquid-glass rounded-3xl p-7 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Target Advertising Channels
                </div>
                <div className="text-[11px] font-mono text-brand-accent-orange">
                  {selectedPlatforms.length} Ecosystems Active (+{((selectedPlatforms.length - 1) * 7)}% Synergy)
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {platformsList.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
                        isSelected
                          ? 'bg-slate-900 border-brand-green-whiz/50 text-white shadow-sm'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ServiceIcon id={platform.icon} className="w-4 h-4" />
                        <span className="truncate">{platform.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-brand-green-whiz shrink-0" />
                      )}
                    </button>
                  );
                })}
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
                    Effective Blended ROAS
                  </div>
                  <div className="text-2xl font-extrabold text-brand-green-400 font-mono mt-1">
                    {calculated.effectiveRoas}x
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Channel synergy included
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Estimated Conversions / Leads
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {calculated.estimatedConversions.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    ~{currentIndustry.cvr}% Conversion Rate
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Estimated High-Intent Clicks
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {calculated.estimatedClicks.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Qualified traffic
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    Estimated Monthly Reach
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {calculated.estimatedReach.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Targeted impressions
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleConfetti}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-emerald text-slate-950 font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-brand-green-whiz/30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Claim This Growth Projection</span>
                </button>
                <div className="text-[11px] text-center text-slate-400">
                  *Projections are mathematical estimates based on verified industry benchmarks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
