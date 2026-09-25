import React, { useState } from 'react';
import { BookOpen, ArrowRight, Clock, User, Tag, Sparkles, ChevronRight } from 'lucide-react';

export default function BlogSection() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Meta Ads', 'Tracking & CAPI', 'Ecosystem Strategy', 'Growth Planning'];

  const articles = [
    {
      id: 1,
      title: "Advantage+ Shopping Campaigns (ASC): The 2026 Creative & Dynamic Testing Playbook",
      summary: "How to engineer structured creative testing loops, eliminate ad fatigue, and systematically scale daily spend without algorithm volatility.",
      category: "Meta Ads",
      readTime: "6 min read",
      date: "September 2026",
      badge: "High Growth",
      author: "Whiz Strategy Group",
      gradient: "from-blue-600/20 to-brand-green-whiz/20"
    },
    {
      id: 2,
      title: "Server-Side Tracking & Meta CAPI: Eliminating 40% Attribution Leakage",
      summary: "A technical deep dive into zero-loss server telemetry. Why client-side pixels fail and how First-Party Gateway infrastructure protects ROAS.",
      category: "Tracking & CAPI",
      readTime: "8 min read",
      date: "September 2026",
      badge: "Technical",
      author: "Infrastructure Team",
      gradient: "from-brand-green-whiz/20 to-emerald-600/20"
    },
    {
      id: 3,
      title: "Omnichannel Funnel Design: Synchronizing Google Ads, YouTube, and WhatsApp CRM",
      summary: "Unifying high-intent Search traffic with visual YouTube storytelling and automated conversational closing on WhatsApp for B2B & DTC.",
      category: "Ecosystem Strategy",
      readTime: "7 min read",
      date: "August 2026",
      badge: "Omnichannel",
      author: "Media Architecture",
      gradient: "from-purple-600/20 to-brand-accent-orange/20"
    },
    {
      id: 4,
      title: "Unit Economics First: The 4-Pillar Growth Planning Framework for High-Ticket Brands",
      summary: "Stop optimizing for vanity ROAS. Learn how to align blended CAC, customer lifetime value (LTV), and cash flow cycles for sustainable scale.",
      category: "Growth Planning",
      readTime: "5 min read",
      date: "August 2026",
      badge: "Economics",
      author: "Growth Advisory",
      gradient: "from-brand-accent-orange/20 to-amber-500/20"
    }
  ];

  const filteredArticles = activeCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  return (
    <section id="blog" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Glow Mesh */}
      <div className="pointer-events-none absolute top-1/3 right-0 w-96 h-96 bg-brand-green-whiz/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-brand-green-400" />
              <span>THE WHIZ DISPATCH & KNOWLEDGE BASE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Platform Insights & <br className="hidden sm:inline" />
              <span className="text-gradient-whiz">Acquisition Strategies</span>
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-brand-green-whiz text-slate-950 font-bold shadow-md shadow-brand-green-whiz/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="liquid-glass rounded-3xl p-7 sm:p-8 hover:border-brand-green-whiz/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Card top banner */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-medium text-brand-green-400">
                    <Tag className="w-3 h-3" />
                    <span>{article.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{article.readTime}</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-brand-green-400 transition-colors mb-3 leading-snug">
                  {article.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {article.summary}
                </p>
              </div>

              {/* Card footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-green-950 border border-brand-green-800 flex items-center justify-center">
                    <User className="w-3 h-3 text-brand-green-400" />
                  </div>
                  <span className="font-medium text-slate-300">{article.author}</span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-brand-green-400 group-hover:translate-x-1 transition-transform">
                  <span>Read Blueprint</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
