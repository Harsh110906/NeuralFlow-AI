"use client";

import React, { useState, useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

const snippets = {
  cURL: `curl -X POST https://api.neuralflow.ai/v1/agents/trigger \\
  -H "Authorization: Bearer nf_live_***" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "ag_98f21j",
    "context": {
      "data_source": "aws_s3_prod",
      "action": "extract_and_reason"
    },
    "routing_preference": "latency_optimized"
  }'`,
  Python: `import neuralflow

client = neuralflow.Client(api_key="nf_live_***")

response = client.agents.trigger(
    agent_id="ag_98f21j",
    context={
        "data_source": "aws_s3_prod",
        "action": "extract_and_reason"
    },
    routing_preference="latency_optimized"
)

print(response.id)`,
  "Node.js": `import { NeuralFlow } from '@neuralflow/sdk';

const nf = new NeuralFlow(process.env.NF_API_KEY);

const run = await nf.agents.trigger({
  agentId: "ag_98f21j",
  context: {
    dataSource: "aws_s3_prod",
    action: "extract_and_reason"
  },
  routingPreference: "latencyOptimized"
});

console.log(run.status);`
};

export const DeveloperAPI = React.memo(() => {
  const [activeLang, setActiveLang] = useState<keyof typeof snippets>('cURL');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    pricingStore.trackRender('developerAPI');
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-32 relative z-10 overflow-hidden" aria-labelledby="developer-api-title">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)] -z-10 border-y border-[var(--color-border)]"></div>
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2 uppercase">
              <img src="/svgs/cog-8-tooth.svg" className="w-4 h-4 invert opacity-50" /> Developer First
            </div>
            <h2 id="developer-api-title" className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tighter">
              Build logic at scale with a single API call.
            </h2>
            <p className="text-lg text-[var(--color-muted-foreground)] mb-8 font-light">
              Integrate with the world&apos;s most powerful neural engines. Seamlessly connect your custom data to GPT-4, Claude 3, and proprietary models for unmatched precision. Build agents that don&apos;t just process, they understand.
            </p>
            
            <ul className="space-y-4 font-mono text-sm text-[var(--color-muted-foreground)] mb-10">
              <li className="flex items-center gap-3"><span className="text-primary">✓</span> End-to-End Encryption</li>
              <li className="flex items-center gap-3"><span className="text-primary">✓</span> SDKs for Python, Node, and Go</li>
              <li className="flex items-center gap-3"><span className="text-primary">✓</span> Automated Fallback Routing</li>
            </ul>
            
            <a href="#" className="font-mono font-bold text-white flex items-center gap-2 hover:text-primary transition-micro w-fit">
              Read Documentation <span className="text-primary">&gt;</span>
            </a>
          </div>

          <div className="glass-panel border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-transparent"></div>
            
            <div className="flex justify-between items-center bg-[var(--color-background)]/80 px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex gap-4">
                {(Object.keys(snippets) as Array<keyof typeof snippets>).map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`font-mono text-xs font-bold transition-micro ${activeLang === lang ? 'text-primary' : 'text-[var(--color-muted-foreground)] hover:text-white'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleCopy}
                className="text-xs font-mono text-[var(--color-muted-foreground)] hover:text-white transition-micro"
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <pre className="font-mono text-sm text-white leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: snippets[activeLang]
                  .replace(/(\".*?\")/g, '<span class="text-secondary">$1</span>')
                  .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-primary">$1</span>')
                  .replace(/(curl|-X|-H|-d|import|const|let|await|new|print|console\.log)/g, '<span class="text-white font-bold opacity-70">$1</span>')
                }} />
              </pre>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
});
DeveloperAPI.displayName = 'DeveloperAPI';
