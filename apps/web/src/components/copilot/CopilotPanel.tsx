'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { chatWithCopilotStream, generateWorkflowFromText } from '@/lib/api/copilot-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function CopilotPanel({ 
  onClose, 
  onGenerateWorkflow,
  workspaceId,
  hideHeader,
  currentDagJson
}: { 
  onClose: () => void,
  onGenerateWorkflow: (dagJson: any) => void,
  workspaceId: string,
  hideHeader?: boolean,
  currentDagJson?: any
}) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! I am Neural Copilot. I can help you build workflows or answer questions. Try asking me to "Generate a customer support workflow with Zendesk".' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Detect generation intent
    const isGenerationIntent = text.toLowerCase().includes('generate') || text.toLowerCase().includes('build a workflow');

    try {
      const token = await getToken();
      
      if (isGenerationIntent) {
        // Generative Flow
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Generating workflow specification...' };
        setMessages(prev => [...prev, aiMsg]);
        
        try {
          const generated = await generateWorkflowFromText(text, workspaceId, token, currentDagJson);
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = 'Workflow generated successfully! Click "Apply" in the preview to save it.';
            return newMsgs;
          });
          onGenerateWorkflow(generated.dagJson);
        } catch (err) {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = 'Error generating workflow. Please try again.';
            return newMsgs;
          });
        }
      } else {
        // Chat Flow
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
        setMessages(prev => [...prev, aiMsg]);

        const stream = await chatWithCopilotStream(text, messages, token);
        if (!stream) throw new Error('No stream');

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr.trim() === '[DONE]') break;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.chunk) {
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      const last = newMsgs[newMsgs.length - 1];
                      last.content += data.chunk;
                      return newMsgs;
                    });
                  }
                } catch (e) {
                  // Ignore parse errors on incomplete chunks
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error connecting to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-full bg-white dark:bg-zinc-950 flex flex-col ${hideHeader ? 'w-full' : 'w-80 border-l border-gray-200 dark:border-gray-800 shadow-xl z-20 absolute right-0 top-0'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Neural Copilot
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === 'user' && (
           <div className="flex justify-start">
             <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-lg rounded-bl-none text-sm text-gray-500 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
             <button type="button" onClick={() => handleSend("Generate a customer support workflow with Zendesk")} className="shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full px-3 py-1 hover:bg-indigo-100 transition-colors whitespace-nowrap">
               Build Support Flow
             </button>
             <button type="button" onClick={() => handleSend("Generate a sales lead qualification workflow")} className="shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full px-3 py-1 hover:bg-indigo-100 transition-colors whitespace-nowrap">
               Build Sales Flow
             </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Copilot..."
              className="flex-1 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white rounded-lg px-3 py-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
