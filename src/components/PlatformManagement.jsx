import React, { useState } from 'react';
import { 
  Activity, ShieldCheck, Cpu, Zap, RefreshCw, BarChart3, 
  MessageSquare, Layers, Lock, CheckCircle2, AlertTriangle, 
  ArrowUpRight, Sliders, Play, Eye
} from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';

export default function PlatformManagement({ onOpenPortal }) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [isSimulating, setIsSimulating] = useState(false);
  const [budgetAllocation, setBudgetAllocation] = useState({
    meta: 42,
    google: 33,
    whatsapp: 15,
    youtube: 10
  });

  const runRebalance = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setBudgetAllocation({
        meta: 38,
        google: 36,
        whatsapp: 16,
        youtube: 10
      });
      setIsSimulating(false);
    }, 900);
  };

  return (
    <section id="platform-management" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-0 w-96 h-96 bg-brand-accent-orange/10 blur-[130px] rounded-full -translate-y-1/2" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-brand-green-whiz/10 blur-[130px] rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-accent-orange/10 border border-brand-accent-orange/30 text-brand-accent-orange text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <Activity className="w-3.5 h-3.5 text-brand-accent-orange" />
          Enterprise Platform Governance
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Unified Digital Platform <span className="text-gradient-flame">Management</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Whiz Studio unifies your multi-channel ad spend, data telemetry, conversion tracking, and CRM funnels into a 24/7 automated command center.
        </p>
      </div>

      {/* Interactive Command Center Showcase */}
      <div className="rounded-3xl bg-brand-dark-900 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Mock OS Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-green-500 animate-ping" />
              WHIZ-OS Platform Hub v4.2 • Live Sync
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPortal}
              className="px-3.5 py-1.5 rounded-lg bg-brand-green-whiz/15 hover:bg-brand-green-whiz/25 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              Launch Client Portal Demo
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800 bg-brand-dark-950/50">
          {[
            { id: 'telemetry', label: 'Cross-Platform Telemetry', icon: BarChart3 },
            { id: 'security', label: 'CAPI & Health Security', icon: ShieldCheck },
            { id: 'crm', label: 'WhatsApp CRM Funnels', icon: MessageSquare },
            { id: 'rebalance', label: 'Smart Budget Rebalancer', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                  active
                    ? 'border-brand-green-whiz text-brand-green-400 bg-brand-green-whiz/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Viewport */}
        <div className="p-6 sm:p-8 bg-brand-dark-900/70">
          {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Active Monthly Spend</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">$148,290.00</div>
                  <div className="text-xs text-brand-green-400 flex items-center gap-1 mt-1 font-semibold">
                    <span>↑ +18.4% vs last mo</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Blended ROAS</div>
                  <div className="text-xl sm:text-2xl font-black text-brand-green-400 font-mono mt-1">4.82x</div>
                  <div className="text-xs text-brand-green-400 flex items-center gap-1 mt-1 font-semibold">
                    <span>↑ +0.6x target</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Tracked Revenue</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">$714,757.80</div>
                  <div className="text-xs text-brand-accent-orange flex items-center gap-1 mt-1 font-semibold">
                    <span>Verified CAPI / GA4</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Platform Status</div>
                  <div className="text-xl sm:text-2xl font-black text-brand-green-400 font-mono mt-1">100% OK</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <span>6/6 Accounts Guarded</span>
                  </div>
                </div>
              </div>

              {/* Multi-Channel Live Stream */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-green-whiz" />
                    Live Channel Performance Breakdown
                  </h4>
                  <span className="text-[11px] font-mono text-brand-green-400 bg-brand-green-950/60 px-2 py-0.5 rounded border border-brand-green-800/40">
                    Real-Time Webhook
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Meta Ads (FB & IG)', id: 'facebook-marketing', spend: '$62,400', revenue: '$324,480', roas: '5.2x', cpa: '$24.50', status: 'Optimal' },
                    { name: 'Google Ads & PMax', id: 'google-ads', spend: '$48,900', revenue: '$229,830', roas: '4.7x', cpa: '$31.20', status: 'Scaling' },
                    { name: 'WhatsApp Funnels', id: 'whatsapp-marketing', spend: '$8,200', revenue: '$89,400', roas: '10.9x', cpa: '$4.10', status: 'High Intent' },
                    { name: 'YouTube Video Ads', id: 'youtube-ads', spend: '$16,500', revenue: '$64,350', roas: '3.9x', cpa: '$28.90', status: 'Testing Hooks' },
                    { name: 'Pinterest Ads', id: 'pinterest-ads', spend: '$12,290', revenue: '$59,700', roas: '4.85x', cpa: '$18.40', status: 'Evergreen' },
                  ].map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 gap-3 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                          <ServiceIcon id={row.id} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{row.name}</div>
                          <div className="text-[11px] text-slate-400">Spend: {row.spend} • CPA: {row.cpa}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white">{row.revenue}</div>
                          <div className="text-[10px] text-slate-400">Revenue</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-brand-green-400">{row.roas}</div>
                          <div className="text-[10px] text-slate-400">ROAS</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-green-950 text-brand-green-400 border border-brand-green-800/40">
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <h4 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-brand-green-whiz" />
                    Meta CAPI & Server-Side Event Match Quality
                  </h4>
                  <div className="space-y-3">
                    {[
                      { event: 'Purchase', match: '9.3/10', rate: '99.9%', ping: '12ms' },
                      { event: 'InitiateCheckout', match: '9.1/10', rate: '99.8%', ping: '14ms' },
                      { event: 'AddToCart', match: '8.9/10', rate: '99.7%', ping: '11ms' },
                      { event: 'Lead / CRM Sync', match: '9.6/10', rate: '100%', ping: '9ms' },
                    ].map((e, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <div>
                          <div className="text-xs font-mono font-bold text-white">{e.event}</div>
                          <div className="text-[11px] text-slate-400">Latency: {e.ping}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-brand-green-400">{e.match}</div>
                            <div className="text-[10px] text-slate-400">Match Quality</div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-brand-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-brand-accent-orange" />
                      24/7 Account Safety & Policy Shield
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Whiz Studio continuously inspects copy, creative assets, domain DNS records, and ad account status against strict Meta & Google compliance policies.
                    </p>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-brand-green-950/40 border border-brand-green-800/30 flex items-center gap-2.5 text-xs text-brand-green-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0" />
                        <span>Domain Aggregated Event Measurement: Verified</span>
                      </div>
                      <div className="p-3 rounded-xl bg-brand-green-950/40 border border-brand-green-800/30 flex items-center gap-2.5 text-xs text-brand-green-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0" />
                        <span>Google Enhanced Conversions: Active & Syncing</span>
                      </div>
                      <div className="p-3 rounded-xl bg-brand-green-950/40 border border-brand-green-800/30 flex items-center gap-2.5 text-xs text-brand-green-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0" />
                        <span>Automated Ad Disapproval Alerts: Telegram & Slack Webhook</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Health Score: 99.8%</span>
                    <span className="text-brand-green-400 font-bold">Zero Flagged Ads</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Active WhatsApp Broadcasts</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">12 Flows</div>
                  <div className="text-xs text-brand-green-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official Cloud API Tier 2</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Avg Response Latency</div>
                  <div className="text-2xl font-black text-brand-green-400 font-mono mt-1">&lt; 1.2 sec</div>
                  <div className="text-xs text-slate-400 mt-2">Automated Chatbot Router</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Direct WhatsApp GMV</div>
                  <div className="text-2xl font-black text-brand-accent-orange font-mono mt-1">$89,400.00</div>
                  <div className="text-xs text-brand-accent-orange mt-2 font-semibold">10.9x Funnel ROAS</div>
                </div>
              </div>

              {/* Chat Simulation Preview */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-xl mx-auto">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green-whiz/20 border border-brand-green-whiz text-brand-green-whiz flex items-center justify-center font-bold text-xs">
                    WS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Whiz Studio Automated Sales Bot
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-slate-400">WhatsApp Official Business Account</div>
                  </div>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 max-w-[85%] text-slate-200">
                    👋 Hey Alex! Noticed you left your luxury leather tote in your cart. We held your reservation + added a priority complimentary 15% VIP code: <strong>WHIZ15</strong>.
                  </div>
                  <div className="bg-brand-green-950/80 border border-brand-green-800/40 p-3 rounded-2xl rounded-tr-none ml-auto max-w-[80%] text-brand-green-200">
                    Thanks! Can I complete checkout right here inside WhatsApp?
                  </div>
                  <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 max-w-[85%] text-slate-200">
                    ⚡ Absolutely! Tap below to finish order with 1-click Apple Pay / Credit Card.
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex gap-2">
                      <span className="px-3 py-1 rounded bg-brand-green-whiz text-slate-950 font-bold text-[11px]">
                        💳 Instant Checkout ($187.00)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rebalance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-brand-green-whiz" />
                      AI-Assisted Cross-Platform Budget Allocation
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Our system analyzes live ROAS and shifting audience fatigue to reallocate ad dollars dynamically.
                    </p>
                  </div>

                  <button
                    onClick={runRebalance}
                    disabled={isSimulating}
                    className="px-4 py-2 rounded-xl bg-brand-green-whiz hover:bg-brand-green-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? 'Optimizing Matrix...' : 'Run Auto-Rebalance'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono font-semibold mb-1.5">
                      <span className="text-slate-300">Meta Ads Portfolio</span>
                      <span className="text-brand-green-400">{budgetAllocation.meta}% ($59,350/mo)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-green-whiz transition-all duration-700" 
                        style={{ width: `${budgetAllocation.meta}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-semibold mb-1.5">
                      <span className="text-slate-300">Google Ads & Search Capture</span>
                      <span className="text-blue-400">{budgetAllocation.google}% ($53,380/mo)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-700" 
                        style={{ width: `${budgetAllocation.google}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-semibold mb-1.5">
                      <span className="text-slate-300">WhatsApp Commerce Retargeting</span>
                      <span className="text-brand-accent-orange">{budgetAllocation.whatsapp}% ($23,720/mo)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-accent-orange transition-all duration-700" 
                        style={{ width: `${budgetAllocation.whatsapp}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-semibold mb-1.5">
                      <span className="text-slate-300">YouTube Video Discovery</span>
                      <span className="text-red-400">{budgetAllocation.youtube}% ($14,830/mo)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-700" 
                        style={{ width: `${budgetAllocation.youtube}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
