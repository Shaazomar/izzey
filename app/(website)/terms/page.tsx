import React from 'react';
import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms of Service | Izzey clean & move',
  description: 'Read the terms and conditions of Izzey clean & move. We outline our service standards, pricing principles, client responsibilities, and cancellation frameworks.',
  alternates: {
    canonical: 'https://izzey.de/terms',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
