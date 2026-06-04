import { useCallback } from "react";

import { useAuth } from "@clerk/expo";
import { useQueries } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api";
import { queryKeys } from "@/lib/query-keys";
import type { Order } from "@/types/order";

export function useOrders() {
    const request = useApiClient();
    const { isSignedIn } = useAuth();

    const [active, history] = useQueries({
        queries: [
            {
                queryKey: queryKeys.orders.active,
                queryFn: () => request<Order[]>({ method: "GET", path: "/driver/orders/active/" }),
                enabled: !!isSignedIn,
            },
            {
                queryKey: queryKeys.orders.history,
                queryFn: () => request<Order[]>({ method: "GET", path: "/driver/orders/history/" }),
                enabled: !!isSignedIn,
            },
        ],
    });

    const activeRefetch = active.refetch;
    const historyRefetch = history.refetch;
    const refetch = useCallback(async () => {
        await Promise.all([activeRefetch(), historyRefetch()]);
    }, [activeRefetch, historyRefetch]);

    return {
        activeOrders: active.data ?? [],
        orderHistory: history.data ?? [],
        isLoading: active.isLoading || history.isLoading,
        error: active.isError || history.isError ? "Error al cargar pedidos." : null,
        refetch,
    };
}
