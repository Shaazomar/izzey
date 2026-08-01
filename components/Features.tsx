'use client';

import React, { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';
import { Sparkles, Truck, Package, Home, ArrowRight, Trash2, Wrench } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface RedesignedService {
  icon: React.ComponentType<any>;
  img: string;
  titleKey: string;
  descKey: string;
}

export default function Features() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.feature-anim-item', 
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 95%',
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out'
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const services: RedesignedService[] = [
    { 
      icon: Truck, 
      img: '/moving-boxes.png',
      titleKey: 'srv1Title', 
      descKey: 'srv1Desc' 
    },
    { 
      icon: Sparkles, 
      img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop',
      titleKey: 'srv2Title', 
      descKey: 'srv2Desc' 
    },
    { 
      icon: Package, 
      img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
      titleKey: 'srv3Title', 
      descKey: 'srv3Desc' 
    },
    { 
      icon: Trash2, 
      img: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=800&auto=format&fit=crop',
      titleKey: 'srv4Title', 
      descKey: 'srv4Desc' 
    },
    { 
      icon: Wrench, 
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
      titleKey: 'srv5Title', 
      descKey: 'srv5Desc' 
    },
    { 
      icon: Home, 
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop',
      titleKey: 'srv6Title', 
      descKey: 'srv6Desc' 
    },
  ];

  return (
    <section id="services" ref={sectionRef} className="py-24 md:py-32 px-4 md:px-12 lg:px-20 xl:px-32 max-w-7xl mx-auto w-full">
      
      {/* Header Info */}
      <div className="text-center mb-16 md:mb-20 flex flex-col items-center">
        {/* Badge */}
        <div className="feature-anim-item inline-flex items-center bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4 shadow-sm">
          <span className="font-body font-bold text-xs uppercase tracking-wider text-brandBlue">
            {t('navServices')}
          </span>
        </div>

        {/* Heading */}
        <h2 className="feature-anim-item font-body font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tight mb-4 max-w-3xl">
          {t('srvSubtitleRedesign')}
        </h2>

        {/* Description */}
        <p className="feature-anim-item font-body text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
          {t('srvDescRedesign')}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((srv, idx) => (
          <div 
            key={idx} 
            className="feature-anim-item group flex flex-col bg-white rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-brandBlue/5 transition-all duration-300 overflow-hidden p-6 text-left"
          >
            {/* Top Icon container */}
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brandBlueLight flex items-center justify-center mb-6 group-hover:bg-brandBlue group-hover:text-white transition-all duration-300">
              <srv.icon className="w-6 h-6" />
            </div>

            {/* Rounded Image */}
            <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-6">
              <Image 
                src={srv.img}
                alt={t(srv.titleKey)}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1">
              <h3 className="font-body font-extrabold text-xl text-slate-900 mb-3 leading-snug">
                {t(srv.titleKey)}
              </h3>
              <p className="font-body font-medium text-slate-500 leading-relaxed text-sm mb-6 flex-1">
                {t(srv.descKey)}
              </p>
              
              {/* Learn More Link */}
              <a 
                href="#book"
                className="inline-flex items-center gap-1.5 font-body font-extrabold text-sm text-brandBlueLight group-hover:text-brandBlueDark transition-colors duration-200"
              >
                <span>{t('srvLearnMore')}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
