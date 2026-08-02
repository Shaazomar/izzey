'use client';

import React, { useState } from 'react';
import { X, UserPlus, Building, Mail, Phone, MapPin } from 'lucide-react';
import { createCustomer } from '@/app/actions/customers';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: any) => void;
}

export default function CustomerModal({ isOpen, onClose, onSuccess }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      companyName: (data.companyName as string) || undefined,
      notes: (data.notes as string) || undefined,
      address: (data.address as string) || 'Boxhagener Str. 119',
      city: (data.city as string) || 'Berlin',
      country: (data.country as string) || 'Germany',
      properties: [
        {
          address: (data.address as string) || 'Boxhagener Str. 119',
          city: (data.city as string) || 'Berlin',
          postalCode: (data.postalCode as string) || '10245',
          country: (data.country as string) || 'Germany',
        },
      ],
    };

    const res = await createCustomer(payload);
    setLoading(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to create customer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-body">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative space-y-6 text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2E4036] text-white flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight text-slate-900">Create New Customer</h3>
            <p className="text-xs text-slate-500 font-mono">Add a client and return immediately to your document.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-500 font-bold uppercase mb-1">Full Name *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Thomas Müller"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="thomas@example.de"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Phone *</label>
              <input
                name="phone"
                type="text"
                required
                placeholder="+49 176 1234 5678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase mb-1">Company Name (Optional)</label>
            <input
              name="companyName"
              type="text"
              placeholder="Müller Immobilien GmbH"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase mb-1">Street Address *</label>
            <input
              name="address"
              type="text"
              required
              defaultValue="Boxhagener Str. 119"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">City</label>
              <input
                name="city"
                type="text"
                defaultValue="Berlin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">PLZ</label>
              <input
                name="postalCode"
                type="text"
                defaultValue="10245"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Country</label>
              <input
                name="country"
                type="text"
                defaultValue="Germany"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036] font-bold transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 font-body">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2E4036] hover:bg-[#1E2E25] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save & Select Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
