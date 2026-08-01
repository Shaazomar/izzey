'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      } else {
        router.push('/erp');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F0E9] flex flex-col items-center justify-center p-6 relative select-none">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 font-body">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-auto mb-4 relative aspect-[3.1] flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Izzey Clean & Move" 
              fill
              sizes="96px"
              priority
              className="object-contain brightness-0 invert" 
            />
          </div>
          <h1 className="font-heading font-extrabold text-xl tracking-tight text-center">
            ERP GATEWAY
          </h1>
          <p className="text-xs text-[#F2F0E9]/50 font-mono tracking-widest uppercase mt-1">
            SECURE ACCESS ONLY
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold font-mono tracking-wider text-[#F2F0E9]/60 uppercase">
              ACCESS PASSCODE
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-accent transition-colors placeholder:text-white/20"
            />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="font-mono text-xs animate-pulse">VERIFYING ACCESS...</span>
            ) : (
              <span>INITIALIZE SESSION</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-[11px] font-mono text-[#F2F0E9]/40 space-y-1 text-center">
          <p>Please enter the master ERP access passcode.</p>
        </div>

      </div>
    </div>
  );
}
