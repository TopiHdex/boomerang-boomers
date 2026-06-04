import { useCallback, useRef } from "react";

import { useAuth } from "@clerk/expo";

import { apiRequest } from "@/lib/api";

type RequestOptions = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    data?: unknown;
};

/**
 * Returns a stable request function that injects the current Clerk token into
 * every call. Use it as the `queryFn` / `mutationFn` body for TanStack Query.
 */
export function useApiClient() {
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    return useCallback(async <T>({ method, path, data }: RequestOptions): Promise<T> => {
        const token = await getTokenRef.current();
        if (!token) throw new Error("No auth token available");
        return apiRequest<T>({ method, path, token, data });
    }, []);
}
