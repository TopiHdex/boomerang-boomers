import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@clerk/expo";

import { apiRequest } from "@/lib/api";

interface DriverAvailability {
    is_available: boolean;
}

export function useDriverAvailability() {
    const { getToken } = useAuth();
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    const fetchAvailability = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const data = await apiRequest<DriverAvailability>({
                method: "GET",
                path: "/driver/availability/",
                token,
            });
            setIsAvailable(data.is_available);
        } catch {
            // silently fail on initial fetch
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    const toggleAvailability = useCallback(
        async (available: boolean) => {
            setIsToggling(true);
            try {
                const token = await getToken();
                if (!token) return;
                const data = await apiRequest<DriverAvailability>({
                    method: "PATCH",
                    path: "/driver/availability/",
                    token,
                    data: { is_available: available },
                });
                setIsAvailable(data.is_available);
            } finally {
                setIsToggling(false);
            }
        },
        [getToken],
    );

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    return { isAvailable, isLoading, isToggling, toggleAvailability };
}
