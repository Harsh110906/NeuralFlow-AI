"use client";

import { useSyncExternalStore } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

export function PerformanceObservatory() {
  // Subscribe to the render counts without triggering normal UI updates for the user
  const state = useSyncExternalStore(pricingStore.subscribe, pricingStore.getState, pricingStore.getState);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-md border border-gray-800 p-4 rounded-xl text-xs font-mono shadow-2xl w-64 pointer-events-none">
      <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
        <span className="text-gray-400">PERFORMANCE OBSERVATORY</span>
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-300">Pricing Engine:</span>
          <span className="text-green-400 font-bold">{state.reRenderCounts.pricing || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Hero:</span>
          <span className="text-blue-400 font-bold">{state.reRenderCounts.hero || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Features:</span>
          <span className="text-blue-400 font-bold">{state.reRenderCounts.features || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Footer:</span>
          <span className="text-blue-400 font-bold">{state.reRenderCounts.footer || 0}</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500 text-center">
        Zero Global Reflows Enabled
      </div>
    </div>
  );
}
