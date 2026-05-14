import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import PostHog, { PostHogProvider } from "posthog-react-native";
import React from "react";
import { useColorScheme } from "react-native";

import * as Notifications from "expo-notifications";

import { OrderOfferSheet } from "@/components/order-offer-sheet";
import { useDriverOfferWebSocket } from "@/hooks/use-driver-offer-websocket";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import "@/tasks/location";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const posthog = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
    ? new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
          host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      })
    : null;

function InitialLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    const { offer, dismissOffer } = useDriverOfferWebSocket();
    useLocationTracking();
    usePushNotifications();

    if (!isLoaded) return null;

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={!isSignedIn}>
                    <Stack.Screen name="(auth)/sign-in" />
                    <Stack.Screen
                        name="(auth)/sign-up"
                        options={{
                            headerBackButtonDisplayMode: "minimal",
                            headerShown: true,
                            headerTitle: "",
                            headerTransparent: true,
                        }}
                    />
                </Stack.Protected>
                <Stack.Protected guard={isSignedIn}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="pedido/[id]" options={{ headerShown: true, headerBackButtonDisplayMode: 'minimal' }} />
                    <Stack.Screen
                        name="pedido/report-problem"
                        options={{
                            presentation: "formSheet",
                            headerShown: true,
                            title: "Informar sobre un problema",
                            sheetAllowedDetents: [0.5, 0.75],
                            sheetGrabberVisible: true,
                        }}
                    />
                </Stack.Protected>
            </Stack>
            {offer && <OrderOfferSheet offer={offer} onResponded={dismissOffer} />}
        </>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <PostHogProvider client={posthog ?? undefined}>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <InitialLayout />
                </ThemeProvider>
            </ClerkProvider>
        </PostHogProvider>
    );
}
