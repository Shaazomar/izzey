import React from 'react';
import { getQuotes } from '@/app/actions/quotes';
import { getCustomers } from '@/app/actions/customers';
import QuotesClient from './QuotesClient';

export default async function QuotesPage() {
  const [quotesRes, customersRes] = await Promise.all([
    getQuotes(),
    getCustomers(),
  ]);

  const quotes = quotesRes.success && quotesRes.data ? JSON.parse(JSON.stringify(quotesRes.data)) : [];
  const customers = customersRes.success && customersRes.data ? JSON.parse(JSON.stringify(customersRes.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">QUOTATIONS</h1>
        <p className="text-sm text-dark/60">
          Build detailed cleaning offers, manage validity parameters, and convert proposals to invoices.
        </p>
      </div>
      <QuotesClient initialQuotes={quotes} customers={customers} />
    </div>
  );
}
