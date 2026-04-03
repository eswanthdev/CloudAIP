'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111638',
            color: '#ffffff',
            border: '1px solid #1e2a5a',
          },
          success: {
            iconTheme: {
              primary: '#00d4ff',
              secondary: '#111638',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#111638',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
