import React from 'react';
import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google';
import '../styles/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-heading',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['italic'],
  variable: '--font-drama',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://izzey.de'),
  title: 'Izzey clean & move | Professional Moving & Cleaning in Berlin',
  description:
    'Complete Moving, Cleaning & Property Services in Berlin. We specialize in safe relocations, hotel & office cleaning, waste disposal, and property handovers.',
  keywords:
    'Berlin moving company, Umzugsunternehmen Berlin, cleaning services, Reinigung Berlin, hotel cleaning, office cleaning, transport service, relocation, Bauendreinigung, Glasreinigung, Izzey clean & move',
  authors: [{ name: 'Izz & Hameed Dienstleistung, (haftungsbeschränkt)' }],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Izzey clean & move | Moving & Cleaning Berlin',
    description:
      'One team handles everything efficiently and professionally. Moving, cleaning, furniture setup, and property support in Berlin.',
    type: 'website',
    url: 'https://izzey.de/',
    images: [
      {
        url: '/hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Izzey clean & move Cover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Izzey clean & move | Moving & Cleaning Berlin',
    description:
      'One team handles everything efficiently and professionally. Moving, cleaning, furniture setup, and property support in Berlin.',
    images: ['/hero-bg.png'],
  },
  alternates: {
    canonical: 'https://izzey.de/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable} scroll-smooth bg-[#F2F0E9] text-[#1A1A1A]`}
    >
      <body className="antialiased font-body">
        {/* Global CSS Noise Overlay */}
        <svg className="no-print pointer-events-none fixed inset-0 z-50 h-full w-full opacity-5 mix-blend-overlay">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        {children}
      </body>
    </html>
  );
}
