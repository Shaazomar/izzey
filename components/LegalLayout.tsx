'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const { lang } = useLanguage();
  
  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F0E9] pt-32 pb-24 px-6 md:px-12 relative z-10 selection:bg-accent/40 selection:text-dark">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#CC5833] hover:text-[#F2F0E9] transition-colors duration-300 font-mono text-sm tracking-wider uppercase mb-12"
        >
          <ArrowLeft size={16} />
          {lang === 'de' ? 'Zurück zur Startseite' : 'Back to Home'}
        </Link>
        
        <header className="mb-16 border-b border-white/10 pb-8">
          <h1 className="font-heading font-bold text-5xl md:text-7xl tracking-tight mb-4">{title}</h1>
          {lastUpdated && (
            <p className="font-mono text-sm text-[#F2F0E9]/50 tracking-widest uppercase">
              {lang === 'de' ? 'Zuletzt aktualisiert' : 'Last Updated'}: {lastUpdated}
            </p>
          )}
        </header>

        <div className="prose prose-invert prose-lg max-w-none font-body text-[#F2F0E9]/80 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
