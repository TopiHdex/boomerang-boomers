import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api";
import { WS_BASE } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { OrderOffer } from "@/types/order";

enum MessageType {
    NewOffer = "new_offer",
    OfferCanceled = "offer_canceled",
}

interface NewOfferMessage {
    type: MessageType.NewOffer;
    offer: OrderOffer;
}

interface OfferCanceledMessage {
    type: MessageType.OfferCanceled;
    offer_id: number;
}

type DriverOfferMessage = NewOfferMessage | OfferCanceledMessage;

export function useDriverOfferWebSocket() {
    const { isSignedIn } = useAuth();
    const request = useApiClient();
    const [offer, setOffer] = useState<OrderOffer | null>(null);
    const [reconnectTick, setReconnectTick] = useState(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: me } = useQuery({
        queryKey: queryKeys.me,
        queryFn: () => request<{ user_id: number }>({ method: "GET", path: "/me/" }),
        enabled: !!isSignedIn,
    });
    const userId = me?.user_id ?? null;

    useEffect(() => {
        if (!userId) return;

        let active = true;

        const ws = new WebSocket(`${WS_BASE}/ws/drivers/${userId}/offers/`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const data = JSON.parse(event.data as string) as DriverOfferMessage;
                if (data.type === MessageType.NewOffer) {
                    setOffer(data.offer);
                } else if (data.type === MessageType.OfferCanceled) {
                    setOffer((cur) => (cur?.id === data.offer_id ? null : cur));
                }
            } catch {}
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
            if (!active) return;
            reconnectTimer.current = setTimeout(() => {
                if (active) setReconnectTick((t) => t + 1);
            }, 3000);
        };

        return () => {
            active = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.close();
        };
    }, [userId, reconnectTick]);

    const dismissOffer = useCallback(() => setOffer(null), []);

    return { offer, dismissOffer };
}
