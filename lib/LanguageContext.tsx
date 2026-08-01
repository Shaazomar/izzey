'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from './translations';

interface LanguageContextProps {
  lang: 'en' | 'de';
  toggleLanguage: () => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<'en' | 'de'>('en');

  const toggleLanguage = () => {
    setLang(prevLang => (prevLang === 'en' ? 'de' : 'en'));
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
