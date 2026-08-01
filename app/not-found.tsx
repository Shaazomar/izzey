import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F0E9] flex flex-col items-center justify-center p-6 relative z-10 selection:bg-accent/40 selection:text-dark">
      <div className="text-center max-w-xl space-y-8">
        <h1 className="font-heading font-extrabold text-7xl md:text-9xl text-accent tracking-tighter">
          404
        </h1>
        <h2 className="font-drama italic text-3xl md:text-5xl leading-tight">
          Protocol Out of Range
        </h2>
        <p className="font-body text-[#F2F0E9]/70 text-lg md:text-xl max-w-md mx-auto">
          The requested coordinate or sector does not exist on our servers. Verify the URL path or return to base parameter coordinates.
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="magnetic-btn bg-accent text-background px-10 py-4 rounded-full text-base font-bold inline-flex items-center gap-2 hover:bg-[#D96640] transition-colors shadow-xl"
          >
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}
