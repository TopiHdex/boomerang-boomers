# Navigation Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat app structure + custom AppTabs component with a standard expo-router `(tabs)` route group containing three placeholder screens: Pedidos, Perfil, Pagos.

**Architecture:** The root `_layout.tsx` becomes a thin wrapper (ThemeProvider + AnimatedSplashOverlay + Slot). All tab logic moves into `src/app/(tabs)/_layout.tsx` using expo-router's `Tabs` component. Three placeholder screens live inside `(tabs)/`. Old files (explore.tsx, app-tabs.tsx, app-tabs.web.tsx) are deleted.

**Tech Stack:** Expo SDK 55, expo-router ~55.0.11, expo-symbols (for tab icons), react-native-safe-area-context, @react-navigation/native

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/app/_layout.tsx` | ThemeProvider + AnimatedSplashOverlay + Slot only |
| Create | `src/app/(tabs)/_layout.tsx` | Tab navigator: Pedidos / Perfil / Pagos |
| Create | `src/app/(tabs)/index.tsx` | Placeholder: Administrador de pedidos |
| Create | `src/app/(tabs)/perfil.tsx` | Placeholder: Perfil del boomer |
| Create | `src/app/(tabs)/pagos.tsx` | Placeholder: Pagos pendientes |
| Delete | `src/app/index.tsx` | Replaced by (tabs)/index.tsx |
| Delete | `src/app/explore.tsx` | No longer needed |
| Delete | `src/components/app-tabs.tsx` | Replaced by (tabs)/_layout.tsx |
| Delete | `src/components/app-tabs.web.tsx` | Replaced by (tabs)/_layout.tsx |

---

## Task 1: Update root layout

**Files:**
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Replace contents of `src/app/_layout.tsx`**

Replace the entire file with:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "refactor: slim down root layout to ThemeProvider + Slot"
```

---

## Task 2: Create the tab navigator layout

**Files:**
- Create: `src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `src/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'list' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'person', android: 'person', web: 'person' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(tabs)/_layout.tsx"
git commit -m "feat: add (tabs) layout with Pedidos, Perfil, Pagos tabs"
```

---

## Task 3: Create placeholder screens

**Files:**
- Create: `src/app/(tabs)/index.tsx`
- Create: `src/app/(tabs)/perfil.tsx`
- Create: `src/app/(tabs)/pagos.tsx`

- [ ] **Step 1: Create `src/app/(tabs)/index.tsx`**

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function PedidosScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <ThemedText type="title">Administrador de pedidos</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
```

- [ ] **Step 2: Create `src/app/(tabs)/perfil.tsx`**

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function PerfilScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <ThemedText type="title">Perfil del boomer</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
```

- [ ] **Step 3: Create `src/app/(tabs)/pagos.tsx`**

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function PagosScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <ThemedText type="title">Pagos pendientes</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/index.tsx" "src/app/(tabs)/perfil.tsx" "src/app/(tabs)/pagos.tsx"
git commit -m "feat: add placeholder screens for Pedidos, Perfil, Pagos"
```

---

## Task 4: Delete old files

**Files:**
- Delete: `src/app/index.tsx`
- Delete: `src/app/explore.tsx`
- Delete: `src/components/app-tabs.tsx`
- Delete: `src/components/app-tabs.web.tsx`

- [ ] **Step 1: Delete old screens and AppTabs components**

```bash
rm src/app/index.tsx src/app/explore.tsx
rm src/components/app-tabs.tsx src/components/app-tabs.web.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove old flat screens and AppTabs component"
```

---

## Task 5: Verify

- [ ] **Step 1: Start the app**

```bash
yarn start
```

- [ ] **Step 2: Check on iOS simulator or device**

Expected:
- App launches with splash animation
- Three tabs visible at the bottom: **Pedidos**, **Perfil**, **Pagos**
- Each tab shows its placeholder title centered on screen
- Tapping between tabs navigates correctly
- Dark/light mode respects theme colors on the tab bar

- [ ] **Step 3: Check on Android emulator or device**

Same expectations as iOS.
