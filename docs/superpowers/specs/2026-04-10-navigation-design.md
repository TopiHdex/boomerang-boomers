# Navigation Design — Boomerang Boomers (Native App)

**Date:** 2026-04-10  
**Scope:** Global bottom-tab navigation structure for the driver-facing native app.

---

## Context

The existing Next.js PWA (`boomerang-fe/src/app/boomers/inicio`) has three inner tabs (Administrador de pedidos, Perfil del boomer, Pagos pendientes) rendered with Radix UI Tabs inside a single page. The Expo app replaces those inner tabs with native bottom-tab navigation for a more platform-native feel and to unlock native APIs unavailable in PWAs.

Auth routing (registro, login, etc.) is out of scope for this spec and will be added later.

---

## File Structure

```
src/app/
  _layout.tsx              Root layout: ThemeProvider + AnimatedSplashOverlay + Slot
  (tabs)/
    _layout.tsx            Tab navigator (NativeTabs on native, expo-router Tabs on web)
    index.tsx              Administrador de pedidos (placeholder)
    perfil.tsx             Perfil del boomer (placeholder)
    pagos.tsx              Pagos pendientes (placeholder)
```

Files removed: `src/app/index.tsx`, `src/app/explore.tsx`  
Components removed: `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`

---

## Root Layout (`src/app/_layout.tsx`)

Wraps the app in `ThemeProvider` (light/dark mode) and renders `AnimatedSplashOverlay` plus a `<Slot />` for child routes. No tab logic here — that lives in `(tabs)/_layout.tsx`. Non-tab routes (auth screens, etc.) will be added as siblings to `(tabs)/` in the future.

---

## Tab Navigator (`src/app/(tabs)/_layout.tsx`)

Uses `NativeTabs` from `expo-router/unstable-native-tabs` on native (iOS/Android) and `Tabs` from `expo-router/ui` on web. Renders three tabs:

| Route | Label | expo-symbols icon |
|-------|-------|-------------------|
| `index` | Pedidos | `list.bullet` (iOS) / `format_list_bulleted` (Android) |
| `perfil` | Perfil | `person` (iOS) / `person` (Android) |
| `pagos` | Pagos | `creditcard` (iOS) / `credit_card` (Android) |

Tab bar colors follow the existing `Colors` theme (background, text, backgroundElement).

---

## Screens

Each screen is a placeholder for now — a full-screen view with a centered section title. Content will be implemented in follow-up work:

- **index.tsx** — "Administrador de pedidos": will show earnings card, active/history orders list, map, and availability toggle.
- **perfil.tsx** — "Perfil del boomer": driver profile information.
- **pagos.tsx** — "Pagos pendientes": pending payments list.

---

## What Is Not Changing

- `AnimatedSplashOverlay` and splash logic remain untouched.
- `Colors`, `Spacing`, `Fonts`, `BottomTabInset`, `MaxContentWidth` constants remain untouched.
- `ThemedText`, `ThemedView`, and other shared components remain untouched.
