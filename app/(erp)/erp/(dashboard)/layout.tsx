import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getAccountingMode } from '@/app/actions/mode';
import DashboardLayout from './DashboardLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/erp/login');
  }

  const initialMode = await getAccountingMode();

  return (
    <DashboardLayout initialMode={initialMode}>
      {children}
    </DashboardLayout>
  );
}
