import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LivePlatformTicker from './components/LivePlatformTicker';
import AboutSection from './components/AboutSection';
import ServicesGrid from './components/ServicesGrid';
import PlatformManagement from './components/PlatformManagement';
import RoiCalculator from './components/RoiCalculator';
import ProcessSection from './components/ProcessSection';
import CaseStudies from './components/CaseStudies';
import TestimonialsSection from './components/TestimonialsSection';
import BlogSection from './components/BlogSection';
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

      <main className="flex-grow">
        {/* 1. Immersive Hero Section */}
        <Hero
          onBookAudit={() => scrollToContact()}
          onOpenPortal={() => setIsPortalOpen(true)}
        />

        {/* 2. Live Platform Ticker */}
        <LivePlatformTicker />

        {/* 3. About Us & Dynamic Statistics Engine */}
        <AboutSection
          onBookAudit={() => scrollToContact()}
        />

        {/* 4. Advanced 3D Tilt Services Grid */}
        <ServicesGrid
          onBookService={handleBookService}
        />

        {/* 5. Enterprise Platform Management & Command Center */}
        <PlatformManagement
          onOpenPortal={() => setIsPortalOpen(true)}
        />

        {/* 6. Interactive ROI & Media Spend Simulator */}
        <RoiCalculator
          onClaimProjection={handleClaimProjection}
        />

        {/* 7. The 4-Phase Scale Methodology */}
        <ProcessSection
          onBookAudit={() => scrollToContact()}
        />

        {/* 8. Verified Client Case Studies & Proof of ROAS */}
        <CaseStudies
          onBookAudit={(context) => {
            if (context) setPrefilledService(context);
            scrollToContact();
          }}
        />

        {/* 9. Verified Testimonials Marquee & Discord Review Submission */}
        <TestimonialsSection />

        {/* 10. Strategic Knowledge Base & Blog */}
        <BlogSection />

        {/* 11. Frequently Answered Questions */}
        <FaqSection />

        {/* 12. Interactive Growth Audit & Contact Form */}
        <ContactSection
          prefilledService={prefilledService}
          prefilledData={prefilledData}
        />
      </main>

      {/* 13. Sophisticated Footer */}
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
