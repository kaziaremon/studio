import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import ServicesGrid from './components/ServicesGrid';
import BlogSection from './components/BlogSection';
import RoiCalculator from './components/RoiCalculator';
import TestimonialsSection from './components/TestimonialsSection';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ClientPortalModal from './components/ClientPortalModal';
import { CurrencyProvider } from './context/CurrencyContext';

function MainApp() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('whiz_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('whiz_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookService = (serviceName) => {
    setPrefilledService(serviceName);
    scrollToContact();
  };

  const handleClaimProjection = (calcData) => {
    setPrefilledData(calcData);
    scrollToContact();
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-brand-dark-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-brand-green-whiz selection:text-black transition-colors duration-300`}>
      {/* Navigation Header */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPortal={() => setIsPortalOpen(true)}
        onBookAudit={() => scrollToContact()}
      />

      <main className="flex-grow space-y-12 sm:space-y-16 lg:space-y-24">
        {/* 1. Hero / Home Section */}
        <Hero
          onBookAudit={() => scrollToContact()}
          onOpenPortal={() => setIsPortalOpen(true)}
        />

        {/* 2. About Us */}
        <AboutSection
          onBookAudit={() => scrollToContact()}
        />

        {/* 3. Services (Core 4: Facebook Ads, Social Media, Platform Optimization, Growth Planning) */}
        <ServicesGrid
          onBookService={handleBookService}
        />

        {/* 4. Strategic Blog (1 preview per core service) */}
        <BlogSection />

        {/* 5. ROI Simulator / Calculator (Synced with Universal Currency Toggle) */}
        <RoiCalculator
          onClaimProjection={handleClaimProjection}
        />

        {/* 6. Dynamic Testimonial Engine (Discord Webhook Integration) */}
        <TestimonialsSection />

        {/* 7. FAQ Section (Accordion with 4-5 fundamental questions) */}
        <FaqSection />

        {/* 8. Book Growth Audit Form (Lead Gen to Discord Webhook) */}
        <ContactSection
          prefilledService={prefilledService}
          prefilledData={prefilledData}
        />
      </main>

      {/* 9. Footer & Terms of Service */}
      <Footer
        onOpenPortal={() => setIsPortalOpen(true)}
      />

      {/* Client Command Portal Modal */}
      <ClientPortalModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <MainApp />
    </CurrencyProvider>
  );
}
