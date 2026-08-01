'use server';

import { cookies } from 'next/headers';

export async function setAccountingMode(mode: 'OFFICIAL' | 'MANAGEMENT') {
  const cookieStore = await cookies();
  cookieStore.set('accounting_mode', mode, { maxAge: 365 * 24 * 60 * 60 });
}

export async function getAccountingMode(): Promise<'OFFICIAL' | 'MANAGEMENT'> {
  const cookieStore = await cookies();
  const value = cookieStore.get('accounting_mode')?.value;
  return (value === 'OFFICIAL' || value === 'MANAGEMENT') ? value : 'OFFICIAL';
}
