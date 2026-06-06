import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 30s before a background refetch is allowed.
            staleTime: 30_000,
            retry: 1,
            // React Native has no window focus; rely on explicit refetch/invalidate.
            refetchOnWindowFocus: false,
        },
    },
});
