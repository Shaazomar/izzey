import React from 'react';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Features from '@/components/Features';
import Philosophy from '@/components/Philosophy';
import Protocol from '@/components/Protocol';
import Booking from '@/components/Booking';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Features />
      <Philosophy />
      <Protocol />
      <Booking />
    </>
  );
}
