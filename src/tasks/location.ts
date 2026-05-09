import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

import type { LocationObject } from "expo-location";

export const LOCATION_TASK_NAME = "background-location-task";
export const TOKEN_STORE_KEY = "boomerang_location_token";

const API_BASE = "https://boomerang-staging-bd7685105325.herokuapp.com/api";

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

        const token = await SecureStore.getItemAsync(TOKEN_STORE_KEY);
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
