import React, { useState } from 'react';
import { BookOpen, ArrowRight, Clock, User, Tag, ChevronRight, Sparkles } from 'lucide-react';

export default function BlogSection() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filterTabs = [
    'All',
    'Facebook Advertising',
    'Social Media Marketing',
    'Platform Optimization',
    'Business Growth Planning'
  ];

  // 1 Realistic Blog Post Preview for each Core Service
  const blogPosts = [
    {
      id: 'fb-ads-creative-testing',
      service: 'Facebook Advertising',
      title: 'Advantage+ Creative Frameworks: How to Systematically Test Ad Concepts Without Burning Capital',
      excerpt: 'Discover why high-volume creative testing outperforms micro-targeting in 2026. A step-by-step breakdown of dynamic creative testing (DCT) and hook velocity.',
      readTime: '6 min read',
      date: 'September 2026',
      badge: 'Paid Acquisition',
      author: 'Performance Strategy Group',
      thumbnailBg: 'from-blue-600/30 via-slate-900 to-brand-dark-950',
      tagColor: 'text-blue-400'
    },
    {
      id: 'social-media-distribution',
      service: 'Social Media Marketing',
      title: 'Organic Reach vs. Paid Amplification: Crafting a Balanced Multi-Channel Distribution Model',
      excerpt: 'Learn how to transform organic short-form video engagement into profitable spark ads and whitelisted creator campaigns across Instagram, LinkedIn, and YouTube.',
      readTime: '7 min read',
      date: 'September 2026',
      badge: 'Social Strategy',
      author: 'Creative Direction Team',
      thumbnailBg: 'from-pink-600/30 via-slate-900 to-brand-dark-950',
      tagColor: 'text-pink-400'
    },
    {
      id: 'server-side-telemetry-cro',
      service: 'Platform Optimization',
      title: 'First-Party Attribution in 2026: Diagnosing and Fixing Server-Side Pixel Discrepancies',
      excerpt: 'A technical analysis of Meta CAPI, Google Enhanced Conversions, and Server GTM. Why browser cookies fail and how to reclaim accurate conversion signals.',
      readTime: '8 min read',
      date: 'August 2026',
      badge: 'Technical Telemetry',
      author: 'Data & Tracking Infrastructure',
      thumbnailBg: 'from-brand-green-whiz/30 via-slate-900 to-brand-dark-950',
      tagColor: 'text-brand-green-400'
    },
    {
      id: 'unit-economics-scaling',
      service: 'Business Growth Planning',
      title: 'The 3 Critical Metrics for Scaling: Aligning Contribution Margin, CAC, and LTV',
      excerpt: 'Why optimizing solely for in-platform ROAS leads to cash flow crunches. How to model blended marketing efficiency ratios (MER) for predictable enterprise scale.',
      readTime: '5 min read',
      date: 'August 2026',
      badge: 'Executive Advisory',
      author: 'Growth Planning Advisory',
      thumbnailBg: 'from-brand-accent-orange/30 via-slate-900 to-brand-dark-950',
      tagColor: 'text-brand-accent-orange'
    }
  ];

  const filteredPosts = activeFilter === 'All'
    ? blogPosts
    : blogPosts.filter(p => p.service === activeFilter);

  return (
    <section id="blog" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden">
      {/* Subtle Purple / Indigo Ambient Highlight */}
      <div className="pointer-events-none absolute top-1/4 right-0 w-96 h-96 bg-purple-600/10 blur-[130px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-brand-green-400" />
              <span>PRACTICAL MARKETING INTELLIGENCE</span>
            </div>
            <h2 className="fluid-heading-lg font-extrabold tracking-tight text-white">
              Strategic Insights & <br className="hidden sm:inline" />
              <span className="text-gradient-whiz">Execution Breakdowns</span>
            </h2>
          </div>

          {/* Service Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeFilter === tab
                    ? 'bg-brand-green-whiz text-slate-950 font-bold shadow-md shadow-brand-green-whiz/25'
                    : 'liquid-glass text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic 4-Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="liquid-glass rounded-3xl p-7 sm:p-8 hover:border-brand-green-whiz/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Thumbnail Placeholder with Graphic Mesh */}
              <div className={`w-full h-44 rounded-2xl bg-gradient-to-br ${post.thumbnailBg} border border-slate-800/80 mb-6 p-6 flex flex-col justify-between relative overflow-hidden group-hover:border-brand-green-whiz/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] font-mono font-semibold text-white">
                    {post.badge}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Tag className="w-3.5 h-3.5 text-brand-green-400" />
                  <span className={post.tagColor}>{post.service}</span>
                </div>
              </div>

              {/* Title & Excerpt */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-brand-green-400 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Author & Read Action */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-brand-green-400" />
                  </div>
                  <span className="font-medium text-slate-300">{post.author}</span>
                </div>

                <span className="flex items-center gap-1 font-semibold text-brand-green-400 group-hover:translate-x-1 transition-transform">
                  <span>Read Brief</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
