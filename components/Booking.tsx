'use client';

import React, { useLayoutEffect, useRef, useState, FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../lib/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── Rate-limit constants ───────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 60-second cooldown between submissions
const RATE_LIMIT_MAX = 3;            // max submissions within the window
const STORAGE_KEY = 'izzey_form_submissions';

function getSubmissionTimestamps(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function recordSubmission(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const recent = getSubmissionTimestamps().filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

function isRateLimited(): boolean {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  const recent = getSubmissionTimestamps().filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  return recent.length >= RATE_LIMIT_MAX;
}
// ───────────────────────────────────────────────────────────────────────────

export default function Booking() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ── Client-side rate limit check ─────────────────────────────────────
    if (isRateLimited()) {
      setStatus(t('msgRateLimit'));
      return;
    }

    setStatus(t('msgSubmitting'));

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Web3Forms is designed to be called directly from the client side.
    // The access key is safe to be exposed as it only routes to your registered email.
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 
                      process.env.VITE_WEB3FORMS_ACCESS_KEY || 
                      "YOUR_WEB3FORMS_KEY_HERE";
    formData.append('access_key', accessKey);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          recordSubmission();
          setStatus(t('msgSuccess'));
          form.reset();
        } else {
          setStatus('Error: ' + data.message);
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from Web3Forms:', text);
        setStatus(t('msgError'));
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setStatus(t('msgError'));
    }
  };

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.booking-elem', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="book" ref={containerRef} className="py-24 md:py-32 px-4 md:px-12 lg:px-20 xl:px-32 bg-brandBg min-h-screen flex items-center relative z-10">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* Left: Contact Info */}
        <div className="flex flex-col justify-center booking-elem text-slate-800">
          <p className="font-body font-bold text-xs tracking-widest text-brandBlue uppercase mb-4 booking-elem">{t('contactTitle')}</p>
          <h2 className="font-body font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 booking-elem" dangerouslySetInnerHTML={{ __html: t('bookTitle') }}></h2>
          <p className="font-body font-medium text-lg text-slate-600 mb-10 max-w-md booking-elem">
            {t('bookDesc')}
          </p>

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-8 font-body font-bold text-sm booking-elem">
            <div>
              <p className="text-slate-400 text-xs tracking-wider uppercase mb-1.5">{t('bookEmail')}</p>
              <a href="mailto:info@izzey.de" className="text-brandBlue hover:text-brandBlueLight text-base border-b border-brandBlue/10 hover:border-brandBlueLight/40 transition-colors truncate block">info@izzey.de</a>
            </div>
            <div>
              <p className="text-slate-400 text-xs tracking-wider uppercase mb-1.5">LOCATION</p>
              <span className="text-brandBlue text-base border-b border-brandBlue/10 transition-colors">Berlin, Germany</span>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-400 text-xs tracking-wider uppercase mb-1.5">WHATSAPP</p>
              <a href="https://wa.me/4917621709991" target="_blank" rel="noreferrer" className="text-brandBlue hover:text-brandBlueLight text-base border-b border-brandBlue/10 hover:border-brandBlueLight/40 transition-colors">+49 176 2170 9991</a>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-brandBlue/5 border border-slate-100 booking-elem flex flex-col justify-center">
          <form className="space-y-6 font-body" onSubmit={handleSubmit}>

            {/* Honey Pot */}
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblTitle')}</label>
                <input type="text" name="name" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 placeholder:text-slate-300 font-medium" placeholder={t('plName')} />
              </div>
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblEmail')}</label>
                <input type="email" name="email" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 placeholder:text-slate-300 font-medium" placeholder={t('plEmail')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblPhone')}</label>
                <input type="tel" name="phone" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 placeholder:text-slate-300 font-medium" placeholder="+49..." />
              </div>
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblAddress')}</label>
                <input type="text" name="address" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 placeholder:text-slate-300 font-medium" placeholder={t('plAddress')} />
              </div>
            </div>

            <div className="flex flex-col text-left">
              <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblService')}</label>
              <select name="services" required defaultValue="" className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 cursor-pointer font-medium">
                <option value="" disabled hidden>{t('optDefault')}</option>
                <option value="cleaning">{t('opt1')}</option>
                <option value="moving">{t('opt2')}</option>
                <option value="property">{t('opt3')}</option>
                <option value="mixed">{t('opt4')}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblDate')}</label>
                <input type="date" name="date" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 font-medium" />
              </div>
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">{t('lblTime')}</label>
                <input type="time" name="time" required className="bg-transparent border-b border-slate-200 py-3 focus:outline-none focus:border-brandBlueLight transition-colors w-full text-base text-slate-800 font-medium" />
              </div>
            </div>

            {status && (
              <div className={`text-sm font-bold text-center mt-4 ${status.includes('Error') || status.includes('Fehler')
                  ? 'text-red-500'
                  : status.includes('Success') || status.includes('Erfolg')
                    ? 'text-green-600'
                    : status.includes('many') || status.includes('viele')
                      ? 'text-orange-500'
                      : 'text-brandBlueLight'
                }`}>
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={status === t('msgSubmitting')}
              className="magnetic-btn w-full mt-10 bg-brandBlue hover:bg-brandBlueDark text-white py-6 md:py-7 rounded-full text-lg md:text-xl font-black uppercase tracking-wider group overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">{t('btnConfirm')}</span>
              <div className="absolute inset-0 bg-brandBlueLight translate-y-full transition-transform duration-300 ease-magnetic group-hover:translate-y-0 z-0"></div>
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
