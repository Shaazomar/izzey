'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { Phone, Mail, MapPin, MessageSquare } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#051126] text-white pt-24 pb-12 px-6 md:px-12 mt-12 relative z-50 border-t border-blue-950">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">

        {/* Top Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 font-body">

          {/* Column 1: Brand & Socials */}
          <div className="lg:col-span-4 flex flex-col gap-6 text-left">
            <Link href="#home" className="inline-block">
              <Image 
                src="/logo.png" 
                alt={t('brandName')} 
                width={140} 
                height={42} 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-blue-100/60 leading-relaxed text-sm max-w-sm">
              {t('footDescRedesign')}
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 items-center mt-2">
              <a href="https://www.facebook.com/profile.php?id=61564135116273" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-200 hover:bg-brandBlueLight hover:text-white transition-all duration-300" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/izzey.de/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-200 hover:bg-brandBlueLight hover:text-white transition-all duration-300" aria-label="Instagram">
                <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://wa.me/4917621709991" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-200 hover:bg-brandBlueLight hover:text-white transition-all duration-300" aria-label="WhatsApp">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2.5 flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-brandBlueLight">{t('footQuickLinks')}</h3>
            <div className="flex flex-col gap-3 font-semibold text-sm text-blue-100/70">
              <a href="#home" className="hover:text-white transition-colors duration-200">{t('navHome')}</a>
              <a href="#services" className="hover:text-white transition-colors duration-200">{t('navServices')}</a>
              <a href="#about" className="hover:text-white transition-colors duration-200">{t('navAbout')}</a>
              <a href="#why-choose-us" className="hover:text-white transition-colors duration-200">{t('navWhyChooseUs')}</a>
              <a href="#book" className="hover:text-white transition-colors duration-200">{t('navContact')}</a>
            </div>
          </div>

          {/* Column 3: Services */}
          <div className="lg:col-span-2.5 flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-brandBlueLight">{t('footServices')}</h3>
            <div className="flex flex-col gap-3 font-semibold text-sm text-blue-100/70">
              <a href="#services" className="hover:text-white transition-colors duration-200">{t('srv1TitleRedesign')}</a>
              <a href="#services" className="hover:text-white transition-colors duration-200">{t('srv2TitleRedesign')}</a>
              <a href="#services" className="hover:text-white transition-colors duration-200">{t('srv3TitleRedesign')}</a>
              <a href="#services" className="hover:text-white transition-colors duration-200">{t('srv4TitleRedesign')}</a>
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:col-span-3 flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-brandBlueLight">{t('footContactUs')}</h3>
            <div className="flex flex-col gap-4 font-semibold text-sm text-blue-100/70">
              <a href="tel:+4917621709991" className="flex items-center gap-3 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-brandBlueLight" />
                </div>
                <span>+49 176 2170 9991</span>
              </a>
              <a href="mailto:info@izzey.de" className="flex items-center gap-3 hover:text-white transition-colors duration-200 truncate">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-brandBlueLight" />
                </div>
                <span>info@izzey.de</span>
              </a>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-brandBlueLight" />
                </div>
                <span className="leading-relaxed">Alt-Moabit 58, 10555 Berlin, Germany</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/10 w-full pt-10 flex flex-col md:flex-row items-center justify-between gap-6 font-body text-xs text-blue-100/40">
          <span>&copy; {new Date().getFullYear()} {t('brandName')}. {t('footRights')}</span>
          <div className="flex gap-6 flex-wrap justify-center md:justify-end font-semibold">
            <Link href="/impressum" className="hover:text-white transition-colors duration-200">{t('footImpressum')}</Link>
            <span className="opacity-30">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors duration-200">{t('footPrivacy')}</Link>
            <span className="opacity-30">|</span>
            <Link href="/terms" className="hover:text-white transition-colors duration-200">{t('footTerms')}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
