"use client";
import { useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

// Custom hook to synchronize Bento Grid state with Accordion state based on breakpoints.
export function useResponsiveFeatureSync(initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Expose an updater that works seamlessly across both layouts
  const syncActiveIndex = (index: number) => {
    setActiveIndex(index);
  };

  return {
    activeIndex,
    syncActiveIndex,
    isMobile
  };
}
