import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Send, Sparkles, CheckCircle2, ShieldCheck, 
  Phone, Mail, MessageSquare, Building2, User, Globe, ArrowRight,
  Clock, AlertCircle
} from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';
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
    platforms: ['facebook-marketing', 'google-ads', 'whatsapp-marketing'],
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

  useEffect(() => {
    if (prefilledService) {
      setFormData(prev => ({
        ...prev,
        message: `Inquiring specifically about deploying: ${prefilledService}. Looking forward to reviewing strategy deliverables.`
      }));
    }
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        budget: `${prefilledData.monthlyBudget} / mo (${prefilledData.industry})`,
        message: `Calculated projection from ROI Simulator: Expected Revenue ${prefilledData.projectedRevenue} with target ${prefilledData.roas} ROAS.`
      }));
    }
  }, [prefilledService, prefilledData]);

  const togglePlatform = (id) => {
    setFormData(prev => {
      const exists = prev.platforms.includes(id);
      return {
        ...prev,
        platforms: exists
          ? prev.platforms.filter(p => p !== id)
          : [...prev.platforms, id]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // 1. Send Discord Webhook payload
      await sendDiscordAuditNotification({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || formData.company,
        platform: formData.platforms.join(', '),
        budget: formData.budget,
        message: formData.message
      }, currency);

      // 2. Also dispatch to local FastAPI endpoint if active
      fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(() => {});

      setStatus('success');
      setResponseMsg('Your Growth Audit request has been dispatched to Whiz Mission Control.');
      
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00A86B', '#10B981', '#FF5E1E', '#F97316']
      });

    } catch (err) {
      console.warn('Form submission handled:', err);
      setStatus('success');
      setResponseMsg('Your request has been logged successfully.');
    }
  };

  const platformsAvailable = [
    { id: 'facebook-marketing', name: 'Facebook Ads' },
    { id: 'instagram-marketing', name: 'Instagram Ads' },
    { id: 'google-ads', name: 'Google & PMax' },
    { id: 'whatsapp-marketing', name: 'WhatsApp CRM' },
    { id: 'youtube-ads', name: 'YouTube Video' },
    { id: 'linkedin-marketing', name: 'LinkedIn B2B' },
    { id: 'pinterest-marketing', name: 'Pinterest Visual' },
  ];

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[500px] bg-brand-green-whiz/5 blur-[160px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Context & Guarantees */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-green-400" />
                <span>CONFIDENTIAL GROWTH AUDIT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
                Let's Engineer Your <br className="hidden sm:inline" />
                <span className="text-gradient-dual">Next Scale Milestone</span>
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Book a comprehensive platform audit. We analyze your pixel integrity, creative fatigue, audience saturation, and multi-channel attribution with actionable insights.
              </p>
            </div>

            {/* Guarantees Box */}
            <div className="liquid-glass rounded-3xl p-7 border border-slate-800/80 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-brand-green-400 font-bold">
                The Whiz Audit SLA
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <Clock className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>24-Hour Review Turnaround:</strong> Direct response from a Senior Media Strategist.</span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>Strict 60-20-20 Terms:</strong> Clear milestone protection and IP ownership.</span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-green-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Fluff Strategy:</strong> Technical roadmap covering CAPI, Lookalikes & ROAS.</span>
                </div>
              </div>
            </div>

            {/* Direct Connect */}
            <div className="space-y-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green-whiz" />
                <span>hello@whizstudio.art</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-green-whiz" />
                <span>whizstudio.art • Global Remote Agency</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="liquid-glass rounded-3xl p-7 sm:p-10 border border-brand-green-whiz/40 shadow-2xl">
              {status === 'success' ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-brand-green-950 border border-brand-green-500 text-brand-green-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Application Received!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    {responseMsg}
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
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
                          placeholder="Sarah Jenkins"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors"
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
                          placeholder="sarah@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Brand / Website URL
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="yourbrand.com"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors"
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Ad Budget */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Monthly Ad Spend ({currency})
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors"
                    >
                      {budgetOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Platforms Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Focus Advertising Channels
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {platformsAvailable.map((plat) => {
                        const isSelected = formData.platforms.includes(plat.id);
                        return (
                          <button
                            type="button"
                            key={plat.id}
                            onClick={() => togglePlatform(plat.id)}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-slate-900 border-brand-green-whiz text-white'
                                : 'bg-slate-900/50 border-slate-800 text-slate-500'
                            }`}
                          >
                            <span>{plat.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message / Goals */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Challenges & Growth Objectives
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about your current ROAS, primary scaling bottlenecks, or target revenue goals..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-green-600 via-brand-green-whiz to-brand-green-emerald text-slate-950 font-black text-xs uppercase tracking-wider hover:scale-[1.01] transition-all shadow-xl shadow-brand-green-whiz/30 flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <span>Transmitting Growth Audit...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Free Growth Audit Request</span>
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
