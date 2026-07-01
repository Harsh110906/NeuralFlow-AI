"use client";

import React, { useEffect, useState } from 'react';

export const NeuralBackground = React.memo(() => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 30 - 15,
        y: (e.clientY / window.innerHeight) * 30 - 15
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 bg-[var(--color-background)]">
      {/* Intense Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 bg-[var(--color-primary)] rounded-[100%] blur-[120px] mix-blend-screen"></div>

      <div 
        className="absolute inset-0 opacity-20 transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)` }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="1.5" height="1.5" fill="var(--color-foreground)" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>
      
      {/* Fade masks */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-background)]/60 to-[var(--color-background)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_var(--color-background)_100%)]"></div>
    </div>
  );
});
NeuralBackground.displayName = 'NeuralBackground';
