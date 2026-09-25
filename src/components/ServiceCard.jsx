import React, { useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { ServiceIcon } from './ServiceIcons';

export default function ServiceCard({ service, onSelectService }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // max 10deg
    const rotateY = ((x - centerX) / centerX) * 10;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.15 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
    setGlarePosition({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectService(service)}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(${isHovered ? '-8px' : '0px'})`,
        transition: isHovered ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'transform 0.5s ease-out, box-shadow 0.5s ease',
      }}
      className="group relative cursor-pointer rounded-2xl bg-brand-dark-900/90 border border-slate-800/80 p-7 sm:p-8 backdrop-blur-xl shadow-xl hover:border-brand-green-whiz/50 hover:shadow-2xl hover:shadow-brand-green-whiz/15 flex flex-col justify-between overflow-hidden"
    >
      {/* Specular Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}), transparent 60%)`,
        }}
      />

      {/* Subtle Background Glow Mesh */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl transition-opacity duration-500 opacity-20 group-hover:opacity-60"
        style={{ backgroundColor: service.iconColor }}
      />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-13 h-13 p-3 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
              style={{
                backgroundColor: `${service.iconColor}15`,
                color: service.iconColor,
                border: `1px solid ${service.iconColor}30`,
              }}
            >
              <ServiceIcon id={service.id} className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                {service.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-green-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-brand-green-400">
                  {service.badge}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-brand-green-whiz group-hover:border-brand-green-whiz/40 group-hover:bg-brand-green-whiz/10 transition-all duration-300"
            aria-label={`View ${service.name} details`}
          >
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Title & Tagline */}
        <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-brand-green-whiz transition-colors duration-200 mb-2">
          {service.name}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          {service.tagline}
        </p>

        {/* Top 3 Features Pill */}
        <div className="space-y-2 mb-6 border-t border-slate-800/80 pt-4">
          {service.features.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-500 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Row & CTA Footer */}
      <div className="pt-4 border-t border-slate-800/80 mt-auto">
        <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
          {service.metrics.map((m, idx) => (
            <div key={idx} className="text-center">
              <div className="text-xs font-mono font-bold text-white group-hover:text-brand-green-400 transition-colors">
                {m.value}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-tight line-clamp-1">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-brand-accent-orange transition-colors">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent-orange" />
            Explore Strategy Blueprint
          </span>
          <span className="font-mono text-[11px] text-slate-300 group-hover:text-white">
            Learn More →
          </span>
        </div>
      </div>
    </div>
  );
}
