import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUsers } from '@/app/actions/users';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/erp/login');
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    redirect('/erp');
  }

  const res = await getUsers();
  const users = res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">TEAM</h1>
        <p className="text-sm text-dark/60">
          Manage employee logins and role-based access to the ERP.
        </p>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
