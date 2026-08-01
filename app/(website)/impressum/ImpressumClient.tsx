'use client';

import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import { useLanguage } from '@/lib/LanguageContext';

export default function ImpressumClient() {
  const { t } = useLanguage();

  return (
    <LegalLayout title={t('impressumTitle')}>
      <div className="space-y-8">
        <div className="space-y-2 whitespace-pre-wrap">
          {t('impressumContent')}
        </div>
      </div>
    </LegalLayout>
  );
}
