'use client';

import React, { useState } from 'react';
import { createUser } from '@/app/actions/users';
import { Plus, X, UserCog, Mail, ShieldCheck } from 'lucide-react';
import { Role } from '@prisma/client';

interface UsersClientProps {
  initialUsers: any[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = Object.values(Role);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await createUser(data);
    setLoading(false);

    if (res.success && res.data) {
      setUsers([res.data, ...users]);
      setModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(res.error || 'Failed to create employee login');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <p className="text-xs font-mono text-dark/50">
          {users.length} {users.length === 1 ? 'account' : 'accounts'} registered
        </p>
        <button
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#CC5833]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-4 text-dark">
        <h2 className="font-heading font-extrabold text-lg">TEAM MEMBERS</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono select-none">
            <thead>
              <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                <th className="pb-3">NAME</th>
                <th className="pb-3">EMAIL</th>
                <th className="pb-3">ROLE</th>
                <th className="pb-3">JOINED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-black/5 transition-colors">
                  <td className="py-3.5 pr-2 font-bold font-body text-sm text-dark">{u.name}</td>
                  <td className="py-3.5 pr-2">{u.email}</td>
                  <td className="py-3.5 pr-2">
                    <span className="bg-black/5 text-dark/70 px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[10px]">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-dark/50">
                    {new Date(u.createdAt).toLocaleDateString('de-DE')}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-dark/40">
                    NO TEAM MEMBERS REGISTERED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#2E4036] text-white flex items-center justify-center">
                <UserCog className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-xl leading-tight">Add Employee Login</h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">Full Name</label>
                <input type="text" name="name" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Jane Doe" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">Email Address</label>
                <input type="email" name="email" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="jane@izzey.de" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">Temporary Password</label>
                <input type="password" name="password" required minLength={6} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="At least 6 characters" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">Role</label>
                <select name="role" required defaultValue="EMPLOYEE" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer">
                  {roles.map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors disabled:opacity-60">
                {loading ? 'CREATING...' : 'CREATE LOGIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
