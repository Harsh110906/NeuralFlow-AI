'use client';

import { useState, useEffect } from 'react';
import { Download, Star, Package, Layers, Bot, ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { getTemplateDetails, installTemplate, Template } from '@/lib/api/templates';
import Link from 'next/link';

import { use } from 'react';
export default function TemplateDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const id = params.id;

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const token = await getToken();
        const data = await getTemplateDetails(id, token);
        setTemplate(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [id, getToken]);

  const handleInstall = async () => {
    try {
      const token = await getToken();
      await installTemplate(id, 'test-org', token);
      alert('Template successfully installed into your workspace!');
    } catch (err) {
      alert('Failed to install template');
    }
  };

  if (loading) return <div className="text-zinc-500">Loading...</div>;
  if (!template) return <div className="text-zinc-500">Template not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              {template.type === 'WORKFLOW' ? <Layers className="w-8 h-8 text-blue-400" /> : 
               template.type === 'AGENT' ? <Bot className="w-8 h-8 text-purple-400" /> :
               <Package className="w-8 h-8 text-emerald-400" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{template.name}</h1>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="bg-zinc-800 px-2 py-1 rounded text-xs text-white">{template.category}</span>
                {template.isGlobal && (
                   <span className="flex items-center gap-1 text-yellow-500 font-mono text-xs">
                     <Star className="w-3 h-3" /> OFFICIAL TEMPLATE
                   </span>
                )}
                <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleInstall}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Install Template
          </button>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <h3 className="text-lg font-bold text-white mb-2">Description</h3>
          <p className="text-zinc-400 text-lg leading-relaxed">{template.description}</p>
        </div>
        
        <div className="mt-8 border-t border-zinc-800 pt-8">
          <h3 className="text-lg font-bold text-white mb-4">Version History</h3>
          <div className="space-y-4">
            {template.versions?.map(v => (
              <div key={v.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="text-white font-mono text-sm font-bold mb-1">Version {v.version} {v.id === template.activeVersionId ? '(Active)' : ''}</div>
                  <div className="text-zinc-500 text-xs">Published on {new Date(v.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
