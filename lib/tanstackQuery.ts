import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache data for 10 minutes (was cacheTime in v4)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Use cache on nav; data stays fresh via staleTime
      refetchOnReconnect: true, // Refetch on network reconnect
    },
  },
});
