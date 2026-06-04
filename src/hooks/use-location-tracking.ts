import { useCallback, useEffect } from "react";

import { useAuth } from "@clerk/expo";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

import { LOCATION_TASK_NAME, stopLocationUpdates, TOKEN_STORE_KEY } from "@/tasks/location";

export function useLocationTracking() {
    const { getToken, isSignedIn } = useAuth();

    const syncToken = useCallback(async () => {
        const token = await getToken();
        if (token) {
            await SecureStore.setItemAsync(TOKEN_STORE_KEY, token, {
                keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
            });
        }
    }, [getToken]);

    const startTracking = useCallback(async () => {
        const { status: fg } = await Location.requestForegroundPermissionsAsync();
        if (fg !== "granted") return;

        const { status: bg } = await Location.requestBackgroundPermissionsAsync();
        if (bg !== "granted") return;

        await syncToken();

        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!running) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.High,
                timeInterval: 5_000,
                distanceInterval: 0,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: "Boomerang",
                    notificationBody: "Compartiendo tu ubicación...",
                    notificationColor: "#34c64c",
                },
            });
        }
    }, [syncToken]);

    const stopTracking = useCallback(stopLocationUpdates, []);

    useEffect(() => {
        if (!isSignedIn) return;

        startTracking();

        // Refresh token every 55 min — Clerk JWTs expire at 1hr
        const tokenRefresh = setInterval(syncToken, 55 * 60 * 1000);

        return () => {
            clearInterval(tokenRefresh);
            stopTracking();
        };
    }, [isSignedIn, startTracking, stopTracking, syncToken]);
}
