'use client';

import React, { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { useLanguage } from '../lib/LanguageContext';
import { ArrowRight, FileText, Shield, Leaf, Check, Phone } from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const elems = gsap.utils.toArray('.hero-anim');
      gsap.fromTo(elems, 
        { y: 30, opacity: 0 },
        { 
          y: 0, opacity: 1, stagger: 0.1, duration: 0.8, 
          ease: 'power3.out', delay: 0.1
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="home"
      ref={containerRef}
      className="relative min-h-[90vh] lg:min-h-screen w-full flex flex-col justify-center px-4 md:px-12 lg:px-20 xl:px-32 overflow-hidden bg-brandBg pt-28 md:pt-36 pb-16"
    >
      {/* Background Decorative Gradient Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brandBlueLight/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-brandBlue/5 blur-[80px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-16 items-center">
        
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* Badge */}
          <div className="hero-anim inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brandBlueLight animate-pulse"></span>
            <span className="font-body font-bold text-xs uppercase tracking-wider text-brandBlue">
              {t('heroBadge')}
            </span>
          </div>

          {/* Heading */}
          <h1 
            className="hero-anim font-body font-extrabold text-[2.75rem] md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight text-slate-900 mb-6"
            dangerouslySetInnerHTML={{ __html: t('heroTitleRedesign') }}
          />
          
          {/* Subtitle */}
          <p className="hero-anim font-body font-medium text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-8">
            {t('heroSubRedesign')}
          </p>

          {/* Actions */}
          <div className="hero-anim flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12">
            <a 
              href="#services" 
              className="magnetic-btn bg-brandBlue hover:bg-brandBlueDark text-white px-8 py-4 rounded-full text-base font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brandBlue/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>{t('heroBtnServices')}</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <a 
              href="#book" 
              className="magnetic-btn bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 px-8 py-4 rounded-full text-base font-extrabold flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <FileText className="w-5 h-5 text-brandBlueLight" />
              <span>{t('heroBtnQuote')}</span>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="hero-anim grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/60 pt-6 w-full max-w-2xl">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-brandBlueLight">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-body text-sm font-bold text-slate-800">{t('heroTrained')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-brandBlueLight">
                <Leaf className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-body text-sm font-bold text-slate-800">{t('heroEco')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-brandBlueLight">
                <Shield className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-body text-sm font-bold text-slate-800">{t('heroSatisfaction')}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Image Content */}
        <div className="lg:col-span-5 relative w-full flex justify-center hero-anim mt-8 lg:mt-0">
          
          {/* Main Rounded Image Container */}
          <div className="relative w-full max-w-[480px] lg:max-w-full aspect-[4/3] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[1.1] rounded-[2.5rem] bg-gradient-to-tr from-blue-50 to-blue-100/50 p-4 border border-blue-100 shadow-sm overflow-hidden flex items-end justify-center">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />

            <div className="relative w-full h-[85%] sm:h-[90%] md:h-[95%] lg:h-[95%]">
              <Image 
                src="/web2.png" 
                alt="Izzey Clean Crew" 
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-bottom transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Floating Call Badge */}
          <a
            href="tel:+4917621709991"
            className="absolute bottom-6 -right-2 sm:right-6 md:right-8 bg-white border border-slate-100 p-4 rounded-[1.75rem] shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 group z-20 pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-brandBlueLight flex items-center justify-center group-hover:bg-brandBlue group-hover:text-white transition-colors duration-300">
              <Phone className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-body text-xs font-bold text-slate-500 tracking-wide uppercase">
                {t('heroCallUs')}
              </span>
              <span className="font-body text-sm md:text-base font-black text-brandBlue">
                +49 176 2170 9991
              </span>
            </div>
          </a>

        </div>

      </div>

      {/* Modern Curved Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-[40px] md:h-[60px] text-brandBlue translate-y-[1px]"
        >
          <path 
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
