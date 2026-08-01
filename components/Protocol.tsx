'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';
import { PhoneCall, ArrowRight } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Protocol() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.cta-anim-item', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="py-12 md:py-20 px-4 md:px-12 lg:px-20 xl:px-32 bg-white text-white relative z-10 w-full"
    >
      <div className="max-w-6xl mx-auto w-full cta-anim-item bg-gradient-to-r from-brandBlue to-brandBlueDark p-8 md:p-12 lg:p-16 rounded-[2.5rem] border border-blue-900/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        {/* Left Side: Icon & Copy */}
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20 hover:scale-110 transition-transform duration-300">
            <PhoneCall className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-body font-extrabold text-2xl md:text-3xl lg:text-4xl text-white tracking-tight leading-snug">
              {t('ctaTitleRedesign')}
            </h2>
            <p className="font-body font-medium text-blue-100 text-sm md:text-base leading-relaxed">
              {t('ctaSubRedesign')}
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div className="shrink-0 relative z-10 w-full md:w-auto flex justify-center">
          <a 
            href="#book"
            className="magnetic-btn w-full sm:w-auto bg-white hover:bg-slate-50 text-brandBlue px-8 py-4 rounded-full text-base font-extrabold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span>{t('ctaBtn')}</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

      </div>
    </section>
  );
}
