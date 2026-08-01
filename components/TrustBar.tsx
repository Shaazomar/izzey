'use client';

import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Smile, ClipboardCheck, Users, Award } from 'lucide-react';

export default function TrustBar() {
  const { t } = useLanguage();

  const stats = [
    {
      icon: Smile,
      count: "500+",
      labelKey: "whyStatsCustomers"
    },
    {
      icon: ClipboardCheck,
      count: "1200+",
      labelKey: "statsCompleted"
    },
    {
      icon: Users,
      count: "15+",
      labelKey: "statsMembers"
    },
    {
      icon: Award,
      count: "100%",
      labelKey: "statsRate"
    }
  ];

  return (
    <div className="w-full bg-brandBlueDark border-y border-brandBlue/10 py-12 md:py-16 px-6 relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
        {stats.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center group">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 group-hover:bg-brandBlueLight group-hover:border-brandBlueLight transition-all duration-300">
              <item.icon className="w-6 h-6 text-brandBlueLight group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="font-body font-black text-3xl md:text-4xl lg:text-5xl text-white mb-2 tracking-tight">
              {item.count}
            </div>
            <div className="font-body font-bold text-xs uppercase tracking-widest text-blue-200/70 max-w-[150px] mx-auto leading-relaxed">
              {t(item.labelKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
