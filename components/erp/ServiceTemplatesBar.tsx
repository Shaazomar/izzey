'use client';

import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

export interface ServiceTemplate {
  name: string;
  items: Array<{
    serviceName: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    vatPercent: number;
  }>;
}

export const PRESET_SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    name: 'Deep Cleaning',
    items: [
      {
        serviceName: 'Grundreinigung / Deep Cleaning',
        description: 'Intensivreinigung aller Oberflächen, Fensterbänke, Türen und Sanitäreinrichtungen.',
        quantity: 8,
        unit: 'Std.',
        unitPrice: 35,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Move-Out Cleaning',
    items: [
      {
        serviceName: 'Endreinigung mit Übergabegarantie',
        description: 'Vollständige Umzugs-Endreinigung inkl. Abnahme-Garantie für den Vermieter.',
        quantity: 12,
        unit: 'Std.',
        unitPrice: 38,
        discount: 5,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Kitchen Cleaning',
    items: [
      {
        serviceName: 'Küchen-Intensivreinigung',
        description: 'Entfettung von Abzugshauben, Backöfen, Schränken und Industriefliesen.',
        quantity: 4,
        unit: 'Std.',
        unitPrice: 40,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Office Cleaning',
    items: [
      {
        serviceName: 'Büroreinigung & Desinfektion',
        description: 'Unterhaltsreinigung von Schreibtischen, Sanitärräumen und Müllentsorgung.',
        quantity: 6,
        unit: 'Std.',
        unitPrice: 32,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Moving Service',
    items: [
      {
        serviceName: 'Umzugsservice mit LKW (2 Werker)',
        description: 'Fachgerechter Demontage-, Transport- und Montageservice für Möbel und Kartons.',
        quantity: 5,
        unit: 'Std.',
        unitPrice: 90,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
];

interface ServiceTemplatesBarProps {
  onApplyTemplate: (template: ServiceTemplate) => void;
}

export default function ServiceTemplatesBar({ onApplyTemplate }: ServiceTemplatesBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="flex items-center gap-1.5 text-[#102B6A] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#CC5833]" />
          <span>Quick Service Templates</span>
        </span>
        <span className="text-dark/40">Click to insert line item</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_SERVICE_TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onApplyTemplate(tmpl)}
            className="bg-white border border-black/10 hover:border-[#102B6A] hover:bg-[#102B6A]/5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-dark/80 hover:text-[#102B6A] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Zap className="w-3 h-3 text-[#CC5833]" />
            <span>{tmpl.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
