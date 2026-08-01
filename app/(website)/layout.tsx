import React from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <SmoothScrollProvider>
        <div className="w-full relative selection:bg-accent/40 selection:text-dark">
          <Navbar />
          {children}
          <Footer />
        </div>
        <CookieBanner />
      </SmoothScrollProvider>
    </LanguageProvider>
  );
}
