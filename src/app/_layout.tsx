import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import PostHog, { PostHogProvider } from "posthog-react-native";
import React from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { OrderOfferSheet } from "@/components/order-offer-sheet";
import { useDriverOfferWebSocket } from "@/hooks/use-driver-offer-websocket";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import "@/tasks/location";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const posthog = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
    ? new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
          host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      })
    : null;

function InitialLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    useLocationTracking();
    const { offer, dismissOffer } = useDriverOfferWebSocket();

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
                    <AnimatedSplashOverlay />
                    <InitialLayout />
                </ThemeProvider>
            </ClerkProvider>
        </PostHogProvider>
    );
}
