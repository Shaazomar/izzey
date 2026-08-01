'use client';

import React, { useState } from 'react';
import { createExpense, deleteExpense } from '@/app/actions/expenses';
import { Plus, Search, Trash2, Calendar, CreditCard, Check, X, Filter } from 'lucide-react';
import { ExpenseCategory } from '@prisma/client';

interface ExpensesClientProps {
  initialExpenses: any[];
}

export default function ExpensesClient({ initialExpenses }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Categories list
  const categories = Object.values(ExpenseCategory);

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.vendor.toLowerCase().includes(search.toLowerCase()) || 
                          (exp.notes && exp.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    
    const payload = {
      vendor: rawData.vendor,
      category: rawData.category,
      amount: Number(rawData.amount),
      date: new Date(rawData.date as string),
      paymentMethod: rawData.paymentMethod,
      notes: rawData.notes,
      isOfficial: rawData.isOfficial === 'on',
    };

    const res = await createExpense(payload);
    if (res.success && res.data) {
      setExpenses([res.data, ...expenses]);
      setExpenseModalOpen(false);
    } else {
      setError(res.error || 'Failed to record expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    const res = await deleteExpense(id);
    if (res.success) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        
        {/* Left: Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-dark/40" />
            <input
              type="text"
              placeholder="Search expenses by vendor, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#EAE8E2] border border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#EAE8E2] border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">ALL CATEGORIES</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setError('');
            setExpenseModalOpen(true);
          }}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#CC5833]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Expenses Table Card */}
      <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-4 text-dark">
        <h2 className="font-heading font-extrabold text-lg">EXPENSES LEDGER</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono select-none">
            <thead>
              <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                <th className="pb-3">DATE</th>
                <th className="pb-3">VENDOR</th>
                <th className="pb-3">CATEGORY</th>
                <th className="pb-3">PAYMENT METHOD</th>
                <th className="pb-3">BOOKS VIEW</th>
                <th className="pb-3">AMOUNT</th>
                <th className="pb-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-black/5 transition-colors">
                  <td className="py-4 pr-2">{new Date(exp.date).toLocaleDateString('de-DE')}</td>
                  <td className="py-4 pr-2">
                    <div className="font-bold text-dark font-body text-xs">{exp.vendor}</div>
                    {exp.notes && <div className="text-[10px] text-dark/55 max-w-xs truncate">{exp.notes}</div>}
                  </td>
                  <td className="py-4 pr-2">
                    <span className="bg-black/5 text-dark/70 px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[10px]">
                      {exp.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 pr-2">{exp.paymentMethod}</td>
                  <td className="py-4 pr-2">
                    {exp.isOfficial ? (
                      <span className="text-green-700 font-bold text-[10px] bg-green-500/10 px-2.5 py-0.5 rounded-full">
                        OFFICIAL (TAX)
                      </span>
                    ) : (
                      <span className="text-[#CC5833] font-bold text-[10px] bg-[#CC5833]/10 px-2.5 py-0.5 rounded-full">
                        INTERNAL CASH
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-2 font-bold text-sm text-dark">
                    €{Number(exp.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500/60 hover:text-red-600 transition-all inline-flex items-center"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-dark/40">
                    NO EXPENSE RECORDS FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal Dialog */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Record Expense Outflow</h3>
            
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">VENDOR NAME</label>
                  <input type="text" name="vendor" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Aral, Bauhaus, etc." />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">OUTFLOW AMOUNT (€)</label>
                  <input type="number" name="amount" required min="0.01" step="any" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">EXPENSE DATE</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">EXPENSE CATEGORY</label>
                  <select name="category" required defaultValue="FUEL" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer">
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">PAYMENT METHOD</label>
                <input type="text" name="paymentMethod" required defaultValue="Bank Transfer" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none" placeholder="Cash, Card, Bank Transfer" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">EXPENSE NOTES</label>
                <textarea name="notes" rows={2} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none" placeholder="Description parameters..."></textarea>
              </div>

              {/* isOfficial Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-background border border-black/5 rounded-xl">
                <input 
                  type="checkbox" 
                  name="isOfficial" 
                  id="isOfficial" 
                  defaultChecked
                  className="w-4 h-4 accent-accent cursor-pointer rounded" 
                />
                <label htmlFor="isOfficial" className="text-xs font-bold text-dark/70 cursor-pointer select-none">
                  Official Financial Books (Tax-deductible)
                </label>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3.5 text-xs font-bold tracking-widest uppercase transition-colors shadow-md">
                RECORD EXPENSE
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
