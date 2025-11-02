'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Provider do React Query para gerenciar cache e sincronização de dados
 *
 * Configurações:
 * - staleTime: 3000ms - Dados considerados frescos por 3 segundos
 * - refetchOnWindowFocus: true - Revalida ao retornar para a aba
 * - refetchOnReconnect: true - Revalida ao reconectar à internet
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados são considerados "frescos" por 3 segundos
            staleTime: 3000,
            // Revalida quando a janela volta ao foco
            refetchOnWindowFocus: true,
            // Revalida quando reconecta à internet
            refetchOnReconnect: true,
            // Não revalida ao montar se os dados ainda estão frescos
            refetchOnMount: false,
            // Retry em caso de erro
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
