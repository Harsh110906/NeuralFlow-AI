"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useResponsiveFeatureSync } from '@/hooks/useResponsiveFeatureSync';
import { pricingStore } from '@/lib/store/pricingStore';

const features = [
  { title: "Agent Orchestration", desc: "Deploy swarms of specialized AI agents working in perfect harmony.", icon: "/svgs/cube-16-solid.svg" },
  { title: "Workflow Automation", desc: "Convert manual operations into self-healing, autonomous pipelines.", icon: "/svgs/arrow-path.svg" },
  { title: "Observability Engine", desc: "Real-time insights into LLM reasoning, token usage, and latency.", icon: "/svgs/chart-pie.svg" },
  { title: "Knowledge Graph", desc: "Dynamic, auto-updating vector memory connected to your enterprise data.", icon: "/svgs/link.svg" },
  { title: "Multi-Region Routing", desc: "Intelligent inference routing across Mumbai, Virginia, and Frankfurt.", icon: "/svgs/arrow-trending-up.svg" },
  { title: "Enterprise Security", desc: "SOC2 Type II compliant with zero-data-retention inference options.", icon: "/svgs/cog-8-tooth.svg" }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HoverCard({ feat, idx, isActive, isLarge, syncActiveIndex }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => syncActiveIndex(idx)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: -1000, y: -1000 })}
      className={`relative overflow-hidden rounded-2xl p-8 flex flex-col justify-between cursor-default transition-layout glass-panel
        ${isLarge ? 'col-span-2' : 'col-span-1'}
        ${isActive ? 'border border-primary' : 'border border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]'}
      `}
    >
      {/* Intense glow following mouse */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,200,1,0.08), transparent 40%)`,
          opacity: isActive ? 1 : 0
        }}
      />

      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none z-0">
        <img src={feat.icon} alt="" className="w-48 h-48 invert" />
      </div>
      
      <div className="relative z-10">
        <div className={`w-12 h-12 mb-6 flex items-center justify-center rounded bg-[var(--color-background)] border transition-micro ${isActive ? 'border-primary' : 'border-[var(--color-border)]'}`}>
          <img src={feat.icon} alt="" className={`w-6 h-6 invert transition-micro ${isActive ? 'opacity-100' : 'opacity-40'}`} />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">{feat.title}</h3>
      </div>
      
      <div className={`relative z-10 transition-layout ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'}`}>
        <p className="text-[var(--color-muted-foreground)] text-sm mb-6 leading-relaxed">{feat.desc}</p>
        <div className="flex items-center gap-3 text-xs font-mono text-primary bg-[var(--color-background)] w-fit px-3 py-1.5 rounded border border-[var(--color-border)]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          SYSTEM ACTIVE
        </div>
      </div>
    </div>
  );
}

export const BentoShowcase = React.memo(() => {
  const { activeIndex, syncActiveIndex, isMobile } = useResponsiveFeatureSync(0);

  useEffect(() => {
    pricingStore.trackRender('features');
  });

  return (
    <section id="features" className="py-32 relative z-10" aria-label="Feature Showcase">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter text-white">Unbounded Capabilities</h2>
          <p className="text-[var(--color-muted-foreground)] max-w-2xl mx-auto font-sans text-lg font-light">Everything you need to scale AI operations globally.</p>
        </div>

        {isMobile ? (
          // Mobile Accordion
          <div className="flex flex-col gap-4">
            {features.map((feat, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl transition-all duration-300 overflow-hidden glass-panel ${isActive ? 'border-primary' : 'border-[var(--color-border)]'}`}
                >
                  <button 
                    className="w-full text-left px-6 py-5 flex items-center justify-between"
                    onClick={() => syncActiveIndex(idx)}
                    aria-expanded={isActive}
                  >
                    <span className="font-bold flex items-center gap-4 text-white">
                      <img src={feat.icon} alt="" className="w-5 h-5 invert opacity-70" /> {feat.title}
                    </span>
                    <img src={isActive ? "/svgs/chevron-up.svg" : "/svgs/chevron-down.svg"} alt="" className={`w-4 h-4 invert transition-transform ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                  <div 
                    className={`px-6 accordion-content ${isActive ? 'max-h-48 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-[var(--color-muted-foreground)] text-sm leading-relaxed">{feat.desc}</p>
                    <div className="mt-6 h-[1px] w-full bg-[var(--color-border)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-primary w-2/3"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop Bento Grid
          <div className="grid grid-cols-3 gap-6 auto-rows-[300px]">
            {features.map((feat, idx) => (
              <HoverCard 
                key={idx} 
                feat={feat} 
                idx={idx} 
                isActive={activeIndex === idx} 
                isLarge={idx === 0 || idx === 3} 
                syncActiveIndex={syncActiveIndex} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
BentoShowcase.displayName = 'BentoShowcase';
