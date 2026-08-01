'use client';

import React, { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Next.js Page Error boundary triggered:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F0E9] flex flex-col items-center justify-center p-6 relative z-10 selection:bg-accent/40 selection:text-dark">
      <div className="text-center max-w-xl space-y-8">
        <h1 className="font-heading font-extrabold text-7xl md:text-9xl text-accent tracking-tighter">
          500
        </h1>
        <h2 className="font-drama italic text-3xl md:text-5xl leading-tight">
          Execution Aborted
        </h2>
        <p className="font-body text-[#F2F0E9]/70 text-lg md:text-xl max-w-md mx-auto">
          A process runtime interrupt occurred. The parameter execution sequence failed to compile.
        </p>
        <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => reset()}
            className="magnetic-btn bg-accent text-background px-10 py-4 rounded-full text-base font-bold inline-flex items-center justify-center gap-2 hover:bg-[#D96640] transition-colors shadow-xl"
          >
            Reset Process
          </button>
          <a
            href="/"
            className="magnetic-btn border border-white/20 hover:bg-white/5 text-[#F2F0E9] px-10 py-4 rounded-full text-base font-bold inline-flex items-center justify-center transition-all shadow-sm"
          >
            Return to Base
          </a>
        </div>
      </div>
    </div>
  );
}
