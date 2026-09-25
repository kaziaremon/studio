import React, { useState } from 'react';
import { servicesData } from '../data/servicesData';
import ServiceCard from './ServiceCard';
import ServiceDetailModal from './ServiceDetailModal';
import { Sparkles, Layers, SlidersHorizontal, CheckCircle } from 'lucide-react';

export default function ServicesGrid({ onBookService }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeServiceModal, setActiveServiceModal] = useState(null);

  const categories = ['All', 'Meta Ecosystem', 'Search & Performance Max', 'Conversational Commerce', 'B2B Pipeline', 'Visual Search', 'Video Acquisition'];

  const filteredServices = selectedCategory === 'All'
    ? servicesData
    : servicesData.filter(s => s.category === selectedCategory || (selectedCategory === 'Meta Ecosystem' && (s.name.includes('Facebook') || s.name.includes('Instagram'))));

  return (
    <section id="services" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Glow background accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-green-whiz/10 blur-[120px] rounded-full" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-whiz/10 border border-brand-green-whiz/30 text-brand-green-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-brand-green-whiz" />
          Full-Stack Platform Mastery
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Precision Multi-Channel <span className="text-gradient-whiz">Marketing & Governance</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Explore our dedicated platform services. Engineered with surgical ad targeting, server-side data telemetry, and automated sales funnels.
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-brand-green-whiz text-slate-950 font-bold shadow-lg shadow-brand-green-whiz/25'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Tilt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelectService={(s) => setActiveServiceModal(s)}
          />
        ))}
      </div>

      {/* Grid Bottom Trust Callout */}
      <div className="mt-16 rounded-2xl bg-gradient-to-r from-brand-dark-900 via-slate-900 to-brand-dark-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green-whiz/10 border border-brand-green-whiz/30 flex items-center justify-center text-brand-green-whiz shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              Need a bespoke omnichannel combination?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              We engineer cross-platform sync combining Meta, Google Ads, YouTube, and automated WhatsApp CRM funnels.
            </p>
          </div>
        </div>

        <button
          onClick={() => onBookService("Custom Omnichannel Solution")}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>Request Custom Stack Audit</span>
          <span className="text-brand-green-whiz">→</span>
        </button>
      </div>

      {/* Modal View */}
      {activeServiceModal && (
        <ServiceDetailModal
          service={activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          onBookService={onBookService}
        />
      )}
    </section>
  );
}
