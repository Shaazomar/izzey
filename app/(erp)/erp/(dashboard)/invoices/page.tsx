import React from 'react';
import { getInvoices } from '@/app/actions/invoices';
import { getCustomers } from '@/app/actions/customers';
import { getSettings } from '@/app/actions/settings';
import { resolveCompanyDefaults } from '@/lib/invoice';
import InvoicesClient from './InvoicesClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const [invRes, custRes, settingsRes] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getSettings(),
  ]);

  const invoices = invRes.success && invRes.data ? JSON.parse(JSON.stringify(invRes.data)) : [];
  const customers = custRes.success && custRes.data ? JSON.parse(JSON.stringify(custRes.data)) : [];
  const companyDefaults = resolveCompanyDefaults(settingsRes.success && settingsRes.data ? settingsRes.data : null);

  return (
    <InvoicesClient
      initialInvoices={invoices}
      customers={customers}
      companyDefaults={companyDefaults}
    />
  );
}
