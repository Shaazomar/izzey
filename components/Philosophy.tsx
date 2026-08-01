'use client';

import React, { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';
import { Check, Users, ShieldAlert, Star, Award } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Philosophy() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.why-anim-item', 
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 95%',
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out'
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const whyList = [
    t('whyCheck1'),
    t('whyCheck2'),
    t('whyCheck3'),
    t('whyCheck4'),
    t('whyCheck5')
  ];

  return (
    <section 
      id="why-choose-us" 
      ref={containerRef} 
      className="py-24 md:py-32 px-4 md:px-12 lg:px-20 xl:px-32 bg-white text-slate-800 relative z-10 overflow-hidden"
    >
      {/* Target anchor for About links */}
      <div id="about" className="absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Column: Why Choose Us Info */}
        <div className="lg:col-span-6 flex flex-col gap-6 text-left why-anim-item">
          
          {/* Badge */}
          <div className="inline-flex items-center self-start bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full shadow-sm">
            <span className="font-body font-bold text-xs uppercase tracking-wider text-brandBlue">
              {t('whyBadge')}
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-body font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
            {t('whyTitleRedesign')}
          </h2>

          {/* Description */}
          <p className="font-body font-medium text-slate-600 text-base md:text-lg leading-relaxed">
            {t('whySubRedesign')}
          </p>

          {/* Checklist */}
          <div className="flex flex-col gap-4 my-2">
            {whyList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-brandBlueLight flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-body font-bold text-slate-800 text-[15px] md:text-base">{item}</span>
              </div>
            ))}
          </div>

          {/* About Us Link */}
          <a 
            href="#book"
            className="magnetic-btn self-start bg-brandBlue hover:bg-brandBlueDark text-white px-8 py-4 rounded-full text-base font-extrabold shadow-lg shadow-brandBlue/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            {t('whyBtnAbout')} &rarr;
          </a>

        </div>

        {/* Right Column: Image with floating metrics badges */}
        <div className="lg:col-span-6 relative flex justify-center why-anim-item mt-12 lg:mt-0">
          
          {/* Standing Crew Image Container */}
          <div className="relative w-full max-w-[480px] lg:max-w-full aspect-[4/3] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[1.1] rounded-[2.5rem] bg-gradient-to-br from-blue-50/75 to-blue-100/30 p-4 border border-blue-100 shadow-sm overflow-hidden flex items-end justify-center">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />

            <div className="relative w-full h-[85%] sm:h-[90%] md:h-[95%] lg:h-[95%]">
              <Image 
                src="/web1.png" 
                alt="Izzey Service Team" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-bottom transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Badge 1: Happy Customers */}
          <div className="absolute top-6 left-[-10px] sm:left-4 md:left-8 bg-white border border-slate-100/80 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3.5 hover:-translate-y-1 transition-transform duration-300 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brandBlueLight flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-body font-black text-lg text-brandBlue leading-tight">500+</span>
              <span className="font-body text-xs font-bold text-slate-500">{t('whyStatsCustomers')}</span>
            </div>
          </div>

          {/* Badge 2: Years of Experience */}
          <div className="absolute bottom-6 right-[-10px] sm:right-4 md:right-8 bg-white border border-slate-100/80 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3.5 hover:-translate-y-1 transition-transform duration-300 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brandBlueLight flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-body font-black text-lg text-brandBlue leading-tight">5+</span>
              <span className="font-body text-xs font-bold text-slate-500">{t('whyStatsExp')}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
