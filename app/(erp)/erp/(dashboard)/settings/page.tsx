'use client';

import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      companyName: formData.get('companyName') as string,
      companyLogoUrl: formData.get('companyLogoUrl') as string || null,
      vatNumber: formData.get('vatNumber') as string || null,
      invoicePrefix: formData.get('invoicePrefix') as string,
      quotePrefix: formData.get('quotePrefix') as string,
      paymentTermsDays: Number(formData.get('paymentTermsDays')),
      currency: formData.get('currency') as string,
      language: formData.get('language') as string,
      emailTemplatesJson: settings?.emailTemplatesJson || null,
    };

    const res = await updateSettings(payload);
    if (res.success && res.data) {
      setSettings(res.data);
      setSuccess(true);
    } else {
      setError(res.error || 'Failed to update settings');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center font-mono text-xs text-dark/40 animate-pulse">
        LOADING CONFIGURATIONS...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-dark">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">SETTINGS</h1>
        <p className="text-sm text-dark/60">
          Configure default invoice prefixes, payment deadlines, local VAT registration, and currencies.
        </p>
      </div>

      <div className="max-w-2xl bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accent" />
          <h2 className="font-heading font-extrabold text-md uppercase">SYSTEM CONFIG PARAMETERS</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                name="companyName"
                required
                defaultValue={settings?.companyName}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">VAT Number (USt-IdNr.)</label>
              <input
                type="text"
                name="vatNumber"
                defaultValue={settings?.vatNumber || ''}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                placeholder="e.g. DE123456789"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                required
                defaultValue={settings?.invoicePrefix}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Quotation Prefix</label>
              <input
                type="text"
                name="quotePrefix"
                required
                defaultValue={settings?.quotePrefix}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Payment Terms (Days)</label>
              <input
                type="number"
                name="paymentTermsDays"
                required
                min="1"
                defaultValue={settings?.paymentTermsDays}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Currency Code</label>
              <input
                type="text"
                name="currency"
                required
                defaultValue={settings?.currency}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Default Language</label>
              <select
                name="language"
                required
                defaultValue={settings?.language}
                className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="de">German (Deutsch)</option>
                <option value="en">English (US/UK)</option>
              </select>
            </div>

          </div>

          <div className="flex flex-col space-y-1">
            <label className="font-mono font-bold text-[10px] text-dark/50 uppercase tracking-wider">Logo CDN URL</label>
            <input
              type="text"
              name="companyLogoUrl"
              defaultValue={settings?.companyLogoUrl || ''}
              className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
              placeholder="https://..."
            />
          </div>

          {error && <div className="text-red-500 text-xs font-mono text-center">{error}</div>}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-700 p-3 rounded-xl flex items-center justify-center gap-2 font-bold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>CONFIG PARAMETERS UPDATED SUCCESSFULLY</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3.5 text-xs font-bold tracking-widest uppercase transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'SAVING...' : 'SAVE SYSTEM CONFIG'}</span>
          </button>

        </form>
      </div>
    </div>
  );
}
