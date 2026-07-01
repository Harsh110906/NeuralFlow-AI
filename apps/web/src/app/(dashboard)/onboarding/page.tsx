'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Bot, GitMerge, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleNext = () => setStep(s => s + 1);

  const handleDeploy = async () => {
    setIsDeploying(true);
    // Simulate template cloning delay
    setTimeout(() => {
      setIsDeploying(false);
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex h-2 w-full bg-zinc-900">
          <div className="bg-purple-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Rocket className="w-10 h-10 text-purple-400" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-center text-white">Welcome to NeuralFlow</h1>
              <p className="text-center text-zinc-400 text-lg max-w-xl mx-auto">
                Your enterprise AI operating system. Build safe, observable, and human-in-the-loop agent workflows.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
                  <Bot className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="font-bold text-white mb-2">Build Agents</h3>
                  <p className="text-sm text-zinc-500">Easily configure and evaluate specialized AI agents.</p>
                </div>
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
                  <GitMerge className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <h3 className="font-bold text-white mb-2">Orchestrate Workflows</h3>
                  <p className="text-sm text-zinc-500">Connect agents, tools, and human approvals into pipelines.</p>
                </div>
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
                  <ShieldCheck className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <h3 className="font-bold text-white mb-2">Enterprise Security</h3>
                  <p className="text-sm text-zinc-500">Role-based access, audit logs, and compliance built-in.</p>
                </div>
              </div>

              <div className="flex justify-center mt-10">
                <button onClick={handleNext} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-3xl font-bold text-white text-center">What is your primary goal?</h2>
              <p className="text-zinc-400 text-center mb-8">Select a starter template to fast-track your setup.</p>
              
              <div className="space-y-4">
                {[
                  { id: 'customer-support', name: 'Customer Support Triager', desc: 'Auto-categorize tickets and draft responses with a human approval loop.' },
                  { id: 'data-analyst', name: 'Data Analyst Swarm', desc: 'A team of agents that can query databases, analyze data, and generate reports.' },
                  { id: 'blank', name: 'Start from Scratch', desc: 'Build your own custom agent and workflow.' }
                ].map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedTemplate === t.id 
                        ? 'border-purple-500 bg-purple-900/20' 
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-white text-lg">{t.name}</h3>
                      <p className="text-zinc-400 text-sm mt-1">{t.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTemplate === t.id ? 'border-purple-500' : 'border-zinc-700'
                    }`}>
                      {selectedTemplate === t.id && <div className="w-3 h-3 bg-purple-500 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-10">
                <button onClick={() => setStep(1)} className="px-6 py-3 text-zinc-400 hover:text-white transition-colors">Back</button>
                <button 
                  onClick={handleNext} 
                  disabled={!selectedTemplate}
                  className="px-8 py-3 bg-purple-600 disabled:opacity-50 text-white font-bold rounded-full hover:bg-purple-500 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 py-10">
              <div className="flex justify-center">
                {isDeploying ? (
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
                    <Rocket className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white text-center">
                {isDeploying ? 'Deploying your template...' : 'Ready to launch!'}
              </h2>
              <p className="text-zinc-400 text-center">
                {isDeploying 
                  ? 'We are setting up your workspace, provisioning agents, and creating default evaluation datasets.' 
                  : 'Your workspace is fully configured.'}
              </p>

              {!isDeploying && (
                <div className="flex justify-center">
                  <button onClick={handleDeploy} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-full transition-colors flex items-center gap-2">
                    Enter Workspace
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
