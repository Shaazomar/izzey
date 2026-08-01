'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const { t, lang, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -20',
        end: 99999,
        onEnter: () => {
          gsap.to(navRef.current, {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            borderColor: 'rgba(226, 232, 240, 0.8)',
            duration: 0.3
          });
        },
        onLeaveBack: () => {
          gsap.to(navRef.current, {
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)',
            borderColor: 'rgba(226, 232, 240, 0.4)',
            duration: 0.3
          });
        }
      });
    }, navRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed top-3 md:top-4 left-0 right-0 z-[100] flex justify-center px-4 md:px-8 pointer-events-none">
      <nav 
        ref={navRef}
        className="pointer-events-auto flex items-center justify-between px-5 py-2 md:py-2.5 rounded-[1.5rem] w-full max-w-6xl transition-all duration-300 bg-white/85 backdrop-blur-md border border-slate-200/40 shadow-sm text-slate-800 font-medium"
      >
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 magnetic-link">
          <Image 
            src="/logo.png" 
            alt="Izzey Clean & Move" 
            width={280} 
            height={84} 
            className="h-10 md:h-12 w-auto object-contain"
            priority
          />
        </a>
        
        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-body font-semibold text-[14px] xl:text-[15px] text-slate-700">
          <a href="#home" className="hover:text-brandBlueLight transition-colors duration-200">{t('navHome')}</a>
          <a href="#services" className="hover:text-brandBlueLight transition-colors duration-200">{t('navServices')}</a>
          <a href="#about" className="hover:text-brandBlueLight transition-colors duration-200">{t('navAbout')}</a>
          <a href="#why-choose-us" className="hover:text-brandBlueLight transition-colors duration-200">{t('navWhyChooseUs')}</a>
          <a href="#book" className="hover:text-brandBlueLight transition-colors duration-200">{t('navContact')}</a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="font-mono text-xs font-extrabold tracking-widest text-slate-500 hover:text-brandBlue transition-colors flex items-center gap-1 px-2 py-1 rounded"
          >
            <span className={lang === 'en' ? 'text-brandBlue font-black' : ''}>EN</span>
            <span className="opacity-30">|</span>
            <span className={lang === 'de' ? 'text-brandBlue font-black' : ''}>DE</span>
          </button>
          
          {/* CTA Button */}
          <a 
            href="#book" 
            className="magnetic-btn bg-brandBlue hover:bg-brandBlueDark text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold tracking-wide hidden md:flex items-center gap-2 group shadow-sm hover:shadow-md transition-all duration-300"
          >
            <span>{t('ctaBtn')}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-brandBlue transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[68px] bg-white z-[99] lg:hidden flex flex-col px-6 py-8 pointer-events-auto border-t border-slate-100 shadow-xl animate-fade-in">
          <div className="flex flex-col gap-6 font-body font-bold text-lg text-slate-800">
            <a 
              href="#home" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brandBlueLight py-2 border-b border-slate-50"
            >
              {t('navHome')}
            </a>
            <a 
              href="#services" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brandBlueLight py-2 border-b border-slate-50"
            >
              {t('navServices')}
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brandBlueLight py-2 border-b border-slate-50"
            >
              {t('navAbout')}
            </a>
            <a 
              href="#why-choose-us" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brandBlueLight py-2 border-b border-slate-50"
            >
              {t('navWhyChooseUs')}
            </a>
            <a 
              href="#book" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brandBlueLight py-2 border-b border-slate-50"
            >
              {t('navContact')}
            </a>
          </div>

          <a 
            href="#book" 
            onClick={() => setMobileMenuOpen(false)}
            className="w-full bg-brandBlue text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 mt-8 text-center"
          >
            <span>{t('ctaBtn')}</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      )}
    </div>
  );
}
