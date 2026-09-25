import React, { useState } from 'react';
import { X, Lock, Key, ArrowRight, ShieldCheck, CheckCircle2, User, Eye, Sparkles, MessageCircle, BarChart2 } from 'lucide-react';

export default function ClientPortalModal({ isOpen, onClose }) {
  const [view, setView] = useState('demo'); // 'demo' or 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [activeApproval, setActiveApproval] = useState({
    1: 'approved',
    2: 'pending',
    3: 'approved'
  });

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginStatus('authenticating');
    setTimeout(() => {
      setLoginStatus('success');
      setTimeout(() => {
        setView('demo');
        setLoginStatus(null);
      }, 1000);
    }, 1200);
  };

  const toggleApproval = (id, status) => {
    setActiveApproval(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl rounded-3xl bg-brand-dark-900 border border-slate-700 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-brand-green-whiz/15 rounded-full blur-3xl" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Whiz Studio" className="h-8 w-auto" />
            <div className="border-l border-slate-700 pl-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Client Command Portal
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-brand-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 animate-pulse" />
                256-Bit Encrypted Platform Governance
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setView('demo')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  view === 'demo'
                    ? 'bg-brand-green-whiz text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Interactive Demo
              </button>
              <button
                onClick={() => setView('login')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  view === 'login'
                    ? 'bg-brand-green-whiz text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {view === 'demo' ? (
            <div className="space-y-6">
              {/* Client Welcome Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-brand-dark-850 to-slate-950 border border-slate-800 gap-4">
                <div>
                  <div className="text-xs font-mono text-brand-green-400">DEMO CLIENT ENVIRONMENT</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    Welcome back, Sterling & Co. Executive Team 👋
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Managed by Senior Whiz Strategist: <strong>Jordan Hayes (Growth Director)</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-brand-green-950 border border-brand-green-800/50 text-brand-green-400 text-xs font-mono font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    All 5 Channels Green
                  </span>
                </div>
              </div>

              {/* 3 Interactive Portal Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Pending Creative Asset Approvals */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-accent-orange" />
                      Pending Creative Approvals (Q4 Scaling)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">3 Variations</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 1, title: 'Reels Hook #4 - Problem Awareness (0:15)', format: 'Instagram / FB Reels', status: activeApproval[1] },
                      { id: 2, title: 'YouTube In-Stream 4K Founder Story (0:45)', format: 'YouTube Ads', status: activeApproval[2] },
                      { id: 3, title: 'WhatsApp Holiday VIP Catalog Broadcast', format: 'WhatsApp Cloud API', status: activeApproval[3] },
                    ].map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.format}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-brand-green-950 border border-brand-green-800/40 text-brand-green-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => toggleApproval(item.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-brand-green-whiz text-slate-950 font-bold text-[11px] hover:opacity-90 transition-opacity"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => toggleApproval(item.id, 'feedback')}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium text-[11px] hover:bg-slate-700"
                              >
                                Revise
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Direct Whiz Team Hotline */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-brand-green-400" />
                      Dedicated Strategist Channel
                    </h4>
                    
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-green-whiz/20 border border-brand-green-whiz/40 flex items-center justify-center text-brand-green-400 font-bold text-xs">
                          JH
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Jordan Hayes (Lead Growth Strategist)</div>
                          <div className="text-[10px] text-brand-green-400 font-mono">Online • Avg reply &lt; 8 mins</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        "Hey team! We scaled the Meta Advantage+ budget by +15% this morning after hitting 5.4x ROAS on the new UGC hooks. Ready to deploy the YouTube video ads next!"
                      </p>
                    </div>
                  </div>

                  <a
                    href="#contact"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center border border-slate-700 transition-colors block"
                  >
                    Open Dedicated WhatsApp & Slack Sync →
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto py-6 space-y-5">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-green-whiz/15 border border-brand-green-whiz/30 text-brand-green-whiz flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Client Portal Sign In</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access your real-time analytics, creative approvals, and campaign governance.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Client Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="cmo@yourbrand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-green-whiz pl-10"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Portal Key / Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-green-whiz pl-10"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginStatus === 'authenticating'}
                className="w-full py-3.5 rounded-xl bg-brand-green-whiz hover:bg-brand-green-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loginStatus === 'authenticating' ? (
                  <span>Authenticating via Whiz Auth...</span>
                ) : loginStatus === 'success' ? (
                  <span className="text-green-950 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Access Granted
                  </span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView('demo')}
                  className="text-xs text-brand-green-400 hover:underline"
                >
                  Don't have an active client account? Explore Live Demo Mode →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
