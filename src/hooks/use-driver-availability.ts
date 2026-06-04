import { useAuth } from "@clerk/expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api";
import { queryKeys } from "@/lib/query-keys";

interface DriverAvailability {
    is_available: boolean;
}

export function useDriverAvailability() {
    const request = useApiClient();
    const queryClient = useQueryClient();
    const { isSignedIn } = useAuth();

    const query = useQuery({
        queryKey: queryKeys.availability,
        queryFn: () =>
            request<DriverAvailability>({ method: "GET", path: "/driver/availability/" }),
        enabled: !!isSignedIn,
    });

    const mutation = useMutation({
        mutationFn: (available: boolean) =>
            request<DriverAvailability>({
                method: "PATCH",
                path: "/driver/availability/",
                data: { is_available: available },
            }),
        onSuccess: (data) => queryClient.setQueryData(queryKeys.availability, data),
    });

    return {
        isAvailable: query.data?.is_available ?? false,
        isLoading: query.isLoading,
        isToggling: mutation.isPending,
        toggleAvailability: mutation.mutateAsync,
    };
}
