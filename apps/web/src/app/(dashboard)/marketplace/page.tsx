'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Star, Package, Layers, Bot, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { getTemplates, installTemplate } from '@/lib/api/templates';
import Link from 'next/link';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const token = await getToken();
        // Just fetch all public/global templates for marketplace, and optionally workspace ones
        const data = await getTemplates(token, 'test-org', true);
        setTemplates(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchTemplates();
  }, [getToken]);

  const handleInstall = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await installTemplate(id, 'test-org', token);
      alert('Template successfully installed into your workspace!');
    } catch (err) {
      alert('Failed to install template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Community Marketplace</h1>
          <p className="text-zinc-400 text-sm mt-1">Discover, install, and share AI workflows and agents.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search templates..."
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Link href={`/marketplace/${template.id}`} key={template.id}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors h-full flex flex-col cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  {template.type === 'WORKFLOW' ? <Layers className="w-5 h-5 text-blue-400" /> : 
                   template.type === 'AGENT' ? <Bot className="w-5 h-5 text-purple-400" /> :
                   <Package className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {template.rating ? template.rating.toFixed(1) : 'New'}
                </div>
              </div>
              <h3 className="text-white font-medium mb-1">{template.name}</h3>
              <p className="text-zinc-500 text-sm line-clamp-2 mb-4 h-10">{template.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
                  {template.category}
                </span>
                <button 
                  onClick={(e) => handleInstall(template.id, e)}
                  className="flex items-center gap-2 text-xs bg-white text-black px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
                >
                  <Download className="w-3 h-3" />
                  Install {template.installs > 0 ? `(${template.installs})` : ''}
                </button>
              </div>
            </div>
          </Link>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No templates found. Be the first to publish one!
          </div>
        )}
      </div>
    </div>
  );
}
