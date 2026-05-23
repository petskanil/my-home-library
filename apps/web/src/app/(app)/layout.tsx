'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Creating the client inside useState prevents it from recreating 
  // on every single layout re-render, keeping your cache stable.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Optional: Keeps data fresh for 5 mins
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppNav />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-28 sm:pb-10">
        {children}
      </main>
    </QueryClientProvider>
  );
}