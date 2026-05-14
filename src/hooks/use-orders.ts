import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@clerk/expo";

import { apiRequest } from "@/lib/api";
import type { Order } from "@/types/order";

export function useOrders(enabled: boolean) {
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getTokenRef.current();
            if (!token) return;
            const [active, history] = await Promise.all([
                apiRequest<Order[]>({ method: "GET", path: "/driver/orders/active/", token }),
                apiRequest<Order[]>({ method: "GET", path: "/driver/orders/history/", token }),
            ]);
            setActiveOrders(Array.isArray(active) ? active : []);
            setOrderHistory(Array.isArray(history) ? history : []);
        } catch {
            setError("Error al cargar pedidos.");
        } finally {
            setIsLoading(false);
        }
    }, []); // stable — getToken accessed via ref

    useEffect(() => {
        if (!enabled) return;
        fetchOrders();
    }, [enabled, fetchOrders]);

    return { activeOrders, orderHistory, isLoading, error, refetch: fetchOrders };
}
