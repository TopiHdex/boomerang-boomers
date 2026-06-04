import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

import type { LocationObject } from "expo-location";

import { API_BASE } from "@/lib/api";

export const LOCATION_TASK_NAME = "background-location-task";
export const TOKEN_STORE_KEY = "boomerang_location_token";

/**
 * Stops background location updates and clears the stored auth token so no
 * further updates can be sent. Safe to call when the task isn't running.
 */
export async function stopLocationUpdates() {
    try {
        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (running) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
    } catch {
        // Native task state may be ahead of JS context (hot reload, killed app).
        // Safe to ignore — OS will clean up the task on next cold start.
    }
    await SecureStore.deleteItemAsync(TOKEN_STORE_KEY);
}

TaskManager.defineTask(
    LOCATION_TASK_NAME,
    async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
        if (error) {
            console.warn("[LocationTask] Error:", error.message);
            return;
        }

        const { locations } = data as { locations: LocationObject[] };
        const location = locations[0];
        if (!location) return;

        const token = await SecureStore.getItemAsync(TOKEN_STORE_KEY, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        if (!token) return;

        const { latitude, longitude } = location.coords;
        console.log({ latitude, longitude });

        try {
            await fetch(`${API_BASE}/driver/location/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    latitude: parseFloat(latitude.toFixed(7)),
                    longitude: parseFloat(longitude.toFixed(7)),
                }),
            });
        } catch (err) {
            console.warn("[LocationTask] Failed to send location:", err);
        }
    },
);
