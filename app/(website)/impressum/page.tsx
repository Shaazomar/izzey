import React from 'react';
import type { Metadata } from 'next';
import ImpressumClient from './ImpressumClient';

export const metadata: Metadata = {
  title: 'Impressum | Izzey clean & move',
  description: 'Legal disclosure and contact information for Izz & Hameed Dienstleistung, (haftungsbeschränkt), operating the Izzey clean & move services in Berlin.',
  alternates: {
    canonical: 'https://izzey.de/impressum',
  },
};

export default function ImpressumPage() {
  return <ImpressumClient />;
}
