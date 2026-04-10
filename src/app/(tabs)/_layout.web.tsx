import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';

import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const colors = useTheme();

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
            <SymbolView name={{ web: 'list' }} size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name={{ web: 'person' }} size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name={{ web: 'credit_card' }} size={size} tintColor={color} />
          ),
        }}
      />
    </Tabs>
  );
}
