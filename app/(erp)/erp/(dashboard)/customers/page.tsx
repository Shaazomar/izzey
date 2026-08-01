import React from 'react';
import { getCustomers } from '@/app/actions/customers';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const res = await getCustomers();
  const customers = res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">CUSTOMERS</h1>
        <p className="text-sm text-dark/60">
          Manage client profiles, corporate VAT registry parameters, and physical properties.
        </p>
      </div>
      <CustomersClient initialCustomers={customers} />
    </div>
  );
}
