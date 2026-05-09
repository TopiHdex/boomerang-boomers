import { useCallback, useEffect } from "react";

import { useAuth } from "@clerk/expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiRequest } from "@/lib/api";

async function registerAndroidChannel() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("default", {
        name: "Boomerang",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#34c64c",
    });
}

export function usePushNotifications() {
    const { getToken, isSignedIn } = useAuth();

    const register = useCallback(async () => {
        if (!Device.isDevice) return;

        await registerAndroidChannel();

        const { status: existing } = await Notifications.getPermissionsAsync();
        const { status } =
            existing === "granted"
                ? { status: existing }
                : await Notifications.requestPermissionsAsync();

        if (status !== "granted") return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        if (!projectId) return;

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

        const authToken = await getToken();
        if (!authToken) return;

        await apiRequest({
            method: "POST",
            path: "/push/expo-token/",
            token: authToken,
            data: { token: expoPushToken },
        });
    }, [getToken]);

    useEffect(() => {
        if (!isSignedIn) return;
        register();
    }, [isSignedIn, register]);
}
