import React from 'react';
import { getExpenses } from '@/app/actions/expenses';
import ExpensesClient from './ExpensesClient';

export default async function ExpensesPage() {
  const res = await getExpenses();
  const expenses = res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">EXPENSES</h1>
        <p className="text-sm text-dark/60">
          Track operating costs, fuel ledgers, employee payroll summaries, and internal cash disbursements.
        </p>
      </div>
      <ExpensesClient initialExpenses={expenses} />
    </div>
  );
}
