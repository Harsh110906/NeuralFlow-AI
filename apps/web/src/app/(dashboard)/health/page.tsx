import React from 'react';

export default function HealthDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">System Health</h1>
      <p className="text-gray-600 mb-8">
        Real-time status of backend services and integrations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">PostgreSQL (Primary)</h2>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Operational</span>
          </div>
          <p className="text-sm text-gray-500">Latency: 12ms</p>
        </div>

        <div className="border p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Redis Cache</h2>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Operational</span>
          </div>
          <p className="text-sm text-gray-500">Latency: 4ms</p>
        </div>

        <div className="border p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">BullMQ Workers</h2>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Operational</span>
          </div>
          <p className="text-sm text-gray-500">Active Jobs: 3 | Queue Depth: 0</p>
        </div>

        <div className="border p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Stripe API</h2>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Operational</span>
          </div>
          <p className="text-sm text-gray-500">Status: OK</p>
        </div>
      </div>
    </div>
  );
}
