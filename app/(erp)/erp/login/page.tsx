'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, Shield, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoginSuccess(false);

    // Phase 1: Authentication
    setStatusText('VERIFYING ACCOUNT SIGNATURE...');
    await new Promise((r) => setTimeout(r, 600));

    // Phase 2: Decrypting / Validating credentials
    setStatusText('COMPARING CRYPTOGRAPHIC CHECKSUMS...');
    await new Promise((r) => setTimeout(r, 600));

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
      } else {
        // Phase 3: Successful login handshake
        setLoginSuccess(true);
        setStatusText('ACCESS GRANTED. INITIALIZING ERP SHELL...');
        await new Promise((r) => setTimeout(r, 850));
        router.push('/erp');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F100F] text-[#F2F0E9] flex flex-col items-center justify-center p-6 relative select-none overflow-hidden">
      
      {/* Dynamic Background Grid and Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1C1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1C1A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#CC5833]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#2E4036]/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-[430px] bg-[#141514]/90 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 font-body">
        
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
          <h1 className="font-heading font-extrabold text-xl tracking-tight text-center text-[#F2F0E9]">
            ERP SECURITY GATEWAY
          </h1>
          <p className="text-[10px] text-[#2E4036] font-mono tracking-[0.25em] uppercase mt-1 font-bold">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email field */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold font-mono tracking-widest text-[#F2F0E9]/50 uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2E4036]" />
              <span>Identity Email</span>
            </label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., admin@izzey.de"
              className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#CC5833] focus:ring-1 focus:ring-[#CC5833]/30 transition-all placeholder:text-white/20 font-mono disabled:opacity-50"
            />
          </div>

          {/* Passcode / Password field */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold font-mono tracking-widest text-[#F2F0E9]/50 uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2E4036]" />
              <span>Access Code / Password</span>
            </label>
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#CC5833] focus:ring-1 focus:ring-[#CC5833]/30 transition-all placeholder:text-white/20 font-mono disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-xs font-semibold text-center font-mono animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-3.5 text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              loginSuccess
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-[#CC5833] hover:bg-[#CC5833]/90 text-white shadow-lg shadow-[#CC5833]/15'
            } disabled:opacity-95 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                {loginSuccess ? (
                  <ShieldCheck className="w-4 h-4 animate-bounce" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span className="text-[11px] animate-pulse">{statusText}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Initialize Secure Link</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-[10px] font-mono text-[#F2F0E9]/30 space-y-1 text-center">
          <p>Passcode auth: enter info@izzey.de + passcode</p>
          <p>User auth: enter account credentials</p>
        </div>

      </div>
    </div>
  );
}
