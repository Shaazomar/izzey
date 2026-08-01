import React from 'react';
import AuthProvider from '@/components/AuthProvider';

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
