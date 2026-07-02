'use client';

import React, { createContext, useContext, useState } from 'react';
import { useStore } from '@xyflow/react';

type DensityMode = 'compact' | 'expanded';

interface DensityContextType {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
}

const DensityContext = createContext<DensityContextType>({
  density: 'expanded',
  setDensity: () => {},
});

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensity] = useState<DensityMode>('expanded');
  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = () => useContext(DensityContext);

export const useSemanticZoom = () => {
  return useStore((s) => s.transform[2]);
};
