'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      })
  );
  return (
    <QueryClientProvider client={qc}>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 14 } }} />
      {children}
    </QueryClientProvider>
  );
}
