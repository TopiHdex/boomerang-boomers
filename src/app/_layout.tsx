import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Slot, useSegments } from 'expo-router';
import PostHog, { PostHogProvider } from 'posthog-react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
});

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  if (!isLoaded) return null;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isSignedIn && !inAuthGroup) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isSignedIn && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PostHogProvider client={posthog}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <InitialLayout />
        </ThemeProvider>
      </ClerkProvider>
    </PostHogProvider>
  );
}
