import React from 'react';
import { getInvoices } from '@/app/actions/invoices';
import { getCustomers } from '@/app/actions/customers';
import InvoicesClient from './InvoicesClient';

export default async function InvoicesPage() {
  const [invRes, custRes] = await Promise.all([
    getInvoices(),
    getCustomers(),
  ]);

  const invoices = invRes.success && invRes.data ? JSON.parse(JSON.stringify(invRes.data)) : [];
  const customers = custRes.success && custRes.data ? JSON.parse(JSON.stringify(custRes.data)) : [];

  return (
    <InvoicesClient 
      initialInvoices={invoices} 
      customers={customers} 
    />
  );
}
