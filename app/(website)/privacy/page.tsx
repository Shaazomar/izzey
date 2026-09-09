import React from 'react';
import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | Izzey clean & move',
  description: 'Read the privacy policy of Izzey clean & move. Learn how we handle, collect, process, and protect your personal information in compliance with GDPR.',
  alternates: {
    canonical: 'https://izzey.de/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
