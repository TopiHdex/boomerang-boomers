import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from "@expo-google-fonts/poppins";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import PostHog, { PostHogProvider } from "posthog-react-native";
import React, { useCallback, useEffect } from "react";
import { Text, TextInput, useColorScheme } from "react-native";
import * as Notifications from "expo-notifications";
import { Poppins } from "@/constants/theme";
import { OrderOfferSheet } from "@/components/order-offer-sheet";
import { useDriverOfferWebSocket } from "@/hooks/use-driver-offer-websocket";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import "@/tasks/location";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

// Default every Text/TextInput to Poppins. Explicit `style` on a component still
// wins, so weighted styles (Poppins.bold, etc.) override this base family.
const withDefaultFont = (Component: typeof Text | typeof TextInput) => {
    const c = Component as unknown as { defaultProps?: { style?: unknown } };
    c.defaultProps = c.defaultProps ?? {};
    c.defaultProps.style = [{ fontFamily: Poppins.regular }, c.defaultProps.style];
};
withDefaultFont(Text);
withDefaultFont(TextInput);

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
    const queryClient = useQueryClient();
    useLocationTracking();
    usePushNotifications();

    // Accepting an offer creates a new active order; invalidate the orders cache
    // so the tab screen reflects it immediately (the offer modal closing does not
    // re-focus the tab, so useFocusEffect alone would miss it).
    const handleResponded = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        dismissOffer();
    }, [queryClient, dismissOffer]);

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
                    <Stack.Screen
                        name="pedido/[id]"
                        options={{ headerShown: true, headerBackButtonDisplayMode: "minimal" }}
                    />
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
            {offer && <OrderOfferSheet offer={offer} onResponded={handleResponded} />}
        </>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [fontsLoaded, fontError] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Keep the splash up until fonts resolve so text never flashes in a fallback.
    if (!fontsLoaded && !fontError) return null;

    return (
        <PostHogProvider client={posthog ?? undefined}>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                        <InitialLayout />
                    </ThemeProvider>
                </QueryClientProvider>
            </ClerkProvider>
        </PostHogProvider>
    );
}
