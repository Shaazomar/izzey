'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

export default function CookieBanner() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('izzey_cookie_consent');
    if (!cookieChoice) {
      // Delay slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('izzey_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleRejectOptional = () => {
    localStorage.setItem('izzey_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-[#111111] text-[#F2F0E9] p-6 md:p-8 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto flex flex-col md:flex-row items-center gap-6 md:gap-12 animate-slide-up">
        <div className="flex-1">
          <p className="font-body text-sm leading-relaxed text-[#F2F0E9]/80">
            {t('cookieText')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
          <button 
            onClick={handleRejectOptional}
            className="px-6 py-3 rounded-full text-xs font-bold font-mono tracking-widest border border-white/20 hover:bg-white/5 transition-colors text-center"
          >
            {t('cookieReject')}
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-6 py-3 rounded-full text-xs font-bold font-mono tracking-widest bg-[#CC5833] hover:bg-[#CC5833]/90 text-white transition-colors text-center"
          >
            {t('cookieAcceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
