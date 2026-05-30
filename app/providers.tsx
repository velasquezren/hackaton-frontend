"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Proveedor global de React Query para gestión y caché de llamadas HTTP
 * del backend en todos los componentes del cliente.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // El estado de los datos climáticos se considera fresco por 10 minutos
            staleTime: 10 * 60 * 1000,
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false, // Evita refetch molesto al cambiar de pestaña
            retry: 1, // Reintento único en caso de error de red
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
