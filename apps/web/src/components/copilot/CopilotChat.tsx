'use client';

import { useState, useRef, useEffect } from 'react';

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:3001/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') {
              setIsTyping(false);
              break;
            }
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.chunk) {
                  assistantMessage += data.chunk;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = assistantMessage;
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="font-bold">Neural Copilot</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-purple-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 mt-8">
                <p>Hello! I&apos;m your Neural Copilot.</p>
                <p className="text-sm mt-2">Ask me anything about your workflows or agents.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${m.role === 'user' ? 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-500 flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Copilot..."
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-purple-600 text-white rounded-md px-3 py-2 disabled:opacity-50 hover:bg-purple-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
