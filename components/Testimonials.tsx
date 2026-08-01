'use client';

import React, { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';
import { Star, Quote } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialCard {
  textKey: string;
  authorKey: string;
  locKey: string;
  avatar: string;
}

export default function Testimonials() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.test-anim-item', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const reviews: TestimonialCard[] = [
    {
      textKey: 'test1Text',
      authorKey: 'test1Author',
      locKey: 'test1Loc',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
    },
    {
      textKey: 'test2Text',
      authorKey: 'test2Author',
      locKey: 'test2Loc',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
    },
    {
      textKey: 'test3Text',
      authorKey: 'test3Author',
      locKey: 'test3Loc',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop'
    }
  ];

  return (
    <section 
      id="testimonials" 
      ref={containerRef} 
      className="py-24 md:py-32 px-4 md:px-12 lg:px-20 xl:px-32 bg-brandBg text-slate-800 relative z-10 w-full"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Header Info */}
        <div className="text-center mb-16 md:mb-20 flex flex-col items-center">
          {/* Badge */}
          <div className="test-anim-item inline-flex items-center bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4 shadow-sm">
            <span className="font-body font-bold text-xs uppercase tracking-wider text-brandBlue">
              {t('testBadge')}
            </span>
          </div>

          {/* Heading */}
          <h2 className="test-anim-item font-body font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tight mb-4 max-w-3xl">
            {t('testTitleRedesign')}
          </h2>

          {/* Description */}
          <p className="test-anim-item font-body text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
            {t('testSubRedesign')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
          {reviews.map((rev, idx) => (
            <div 
              key={idx} 
              className="test-anim-item bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between relative hover:shadow-md hover:border-blue-100 transition-all duration-300 group"
            >
              {/* Quote Icon in corner */}
              <Quote className="absolute top-8 right-8 w-8 h-8 text-blue-50 stroke-[1.5] group-hover:text-blue-100/70 transition-colors duration-300" />
              
              <div>
                {/* 5 Stars */}
                <div className="flex gap-1 mb-6 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="font-body font-medium text-slate-600 leading-relaxed text-[15px] mb-8 italic">
                  "{t(rev.textKey)}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 border-t border-slate-100 pt-6 mt-auto">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                  <Image 
                    src={rev.avatar} 
                    alt={t(rev.authorKey)}
                    fill
                    sizes="48px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-body font-black text-slate-900 leading-none mb-1">
                    {t(rev.authorKey)}
                  </span>
                  <span className="font-body text-xs font-bold text-slate-400">
                    {t(rev.locKey)}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Dot Indicators */}
        <div className="test-anim-item flex gap-2 justify-center items-center mt-4">
          <button className="w-2.5 h-2.5 rounded-full bg-brandBlueLight" aria-label="Slide 1"></button>
          <button className="w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" aria-label="Slide 2"></button>
          <button className="w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" aria-label="Slide 3"></button>
        </div>

      </div>
    </section>
  );
}
