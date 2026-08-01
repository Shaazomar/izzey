import React from 'react';
import { getPayments } from '@/app/actions/payments';
import PaymentsClient from './PaymentsClient';

export default async function PaymentsPage() {
  const res = await getPayments();
  const payments = res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : [];

  return <PaymentsClient initialPayments={payments} />;
}
