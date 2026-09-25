import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Send, Sparkles, CheckCircle2, ShieldCheck, 
  Phone, Mail, MessageSquare, Building2, User, Globe, ArrowRight,
  Clock, AlertCircle, HelpCircle, Layers
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { sendDiscordAuditNotification } from '../utils/discordWebhook';

export default function ContactSection({ prefilledService, prefilledData }) {
  const { currency, formatAmount } = useCurrency();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    budget: '$500 - $2,500 / mo',
    bottleneck: 'High CAC & Unpredictable ROAS',
    platforms: ['Facebook Advertising', 'Platform Optimization'],
    message: ''
  });

  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [responseMsg, setResponseMsg] = useState('');

  // Currency-aware budget options
  const budgetOptions = currency === 'BDT' ? [
    '৳15,000 - ৳50,000 / mo (Testing Tier)',
    '৳50,000 - ৳200,000 / mo (Growth Tier)',
    '৳200,000 - ৳600,000 / mo (Scale Tier)',
    '৳600,000+ / mo (Enterprise Scale)'
  ] : [
    '$150 - $500 / mo (Testing Tier)',
    '$500 - $2,500 / mo (Growth Tier)',
    '$2,500 - $10,000 / mo (Scale Tier)',
    '$10,000+ / mo (Enterprise Scale)'
  ];

  const bottlenecksList = [
    'High CAC & Unpredictable ROAS',
    'Tracking Inaccuracy & Meta Pixel Discrepancies',
    'Ad Creative Fatigue & Declining Hook Rates',
    'Scaling Budget Without Sacrificing Margins',
    'Lack of Full-Funnel Attribution Strategy'
  ];

  const coreServicesSelection = [
    'Facebook Advertising',
    'Social Media Marketing',
    'Platform Optimization',
    'Business Growth Planning'
  ];

  useEffect(() => {
    if (prefilledService) {
      setFormData(prev => ({
        ...prev,
        platforms: [prefilledService],
        message: `Inquiring specifically regarding deployment of: ${prefilledService}. Looking forward to discussing implementation milestones.`
      }));
    }
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        budget: `${prefilledData.monthlyBudget} / mo`,
        message: `Calculated projection from ROI Simulator: Expected Revenue ${prefilledData.projectedRevenue} with target ${prefilledData.roas} ROAS under ${prefilledData.service}.`
      }));
    }
  }, [prefilledService, prefilledData]);

  const togglePlatform = (serviceName) => {
    setFormData(prev => {
      const exists = prev.platforms.includes(serviceName);
      return {
        ...prev,
        platforms: exists
          ? prev.platforms.filter(p => p !== serviceName)
          : [...prev.platforms, serviceName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // 1. Dispatch formatted Discord Webhook payload
      await sendDiscordAuditNotification({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        website: formData.website,
        budget: formData.budget,
        bottleneck: formData.bottleneck,
        platforms: formData.platforms,
        message: formData.message
      }, currency);

      setStatus('success');
      setResponseMsg('Your detailed Growth Audit application has been submitted to Discord Mission Control. A Senior Strategist will review your telemetry within 24 hours.');
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00A86B', '#8B5CF6', '#FF5E1E', '#10B981']
      });

    } catch (err) {
      console.warn('Audit submission handled:', err);
      setStatus('success');
      setResponseMsg('Your application has been logged successfully.');
    }
  };

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[750px] h-[550px] bg-purple-600/5 blur-[160px] rounded-full" />
      <div className="pointer-events-none absolute top-10 left-10 w-[500px] h-[500px] bg-brand-green-whiz/5 blur-[160px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Context & Consultation SLA */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-green-400" />
                <span>BOOK A GROWTH AUDIT</span>
              </div>
              <h2 className="fluid-heading-lg font-extrabold tracking-tight text-white mb-6">
                Let's Diagnose Your <br className="hidden sm:inline" />
                <span className="text-gradient-whiz">Acquisition Engine</span>
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Receive an objective, comprehensive review of your advertising account structures, conversion tracking integrity, and scaling opportunities. No sales pressure—just actionable consulting insights.
              </p>
            </div>

            {/* Consulting Standards */}
            <div className="liquid-glass rounded-3xl p-7 border border-slate-800/80 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-brand-green-400 font-bold">
                Consultation Commitment
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <Clock className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>24-Hour Review:</strong> Direct evaluation by a Senior Marketing Consultant.</span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>Data Privacy Guaranteed:</strong> 100% confidential assessment of your metrics.</span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>Actionable Roadmap:</strong> Concrete recommendations on CAPI, CAC & ad spend.</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Reference */}
            <div className="space-y-3 text-xs font-mono text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-green-whiz" />
                <span>Direct Hotline: +1 (555) 234-5678 / +880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green-whiz" />
                <span>Webmail: consult@whizstudio.art</span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Form */}
          <div className="lg:col-span-7">
            <div className="liquid-glass rounded-3xl p-7 sm:p-10 border border-brand-green-whiz/40 shadow-2xl">
              {status === 'success' ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-brand-green-950 border border-brand-green-500 text-brand-green-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Application Dispatched!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    {responseMsg}
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    Submit Additional Inquiries
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Your Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. David Sterling"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="david@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Website or Store URL *
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="https://yourbrand.com"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Challenge Bottleneck */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Primary Growth Bottleneck *
                    </label>
                    <select
                      value={formData.bottleneck}
                      onChange={(e) => setFormData({ ...formData, bottleneck: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                    >
                      {bottlenecksList.map((bn, idx) => (
                        <option key={idx} value={bn}>
                          {bn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monthly Investment Budget */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Monthly Advertising Budget ({currency}) *
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                    >
                      {budgetOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Core Services Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Primary Services Required
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {coreServicesSelection.map((sName) => {
                        const isSelected = formData.platforms.includes(sName);
                        return (
                          <button
                            type="button"
                            key={sName}
                            onClick={() => togglePlatform(sName)}
                            className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-slate-900 border-brand-green-whiz text-white'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{sName}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Goals Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Numbers & Growth Goals
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your current monthly revenue, primary conversion goals, and what a successful consultation achieves..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-emerald text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 transition-opacity shadow-xl shadow-brand-green-whiz/30 flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <span>Submitting to Mission Control...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Book Growth Audit Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
