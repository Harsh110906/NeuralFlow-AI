'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-8">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 max-w-2xl text-left w-full font-mono text-sm overflow-auto mb-6">
        <p className="text-red-400 font-semibold mb-2">{error.name}: {error.message}</p>
        {error.stack && <pre className="text-zinc-400 whitespace-pre-wrap">{error.stack}</pre>}
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
