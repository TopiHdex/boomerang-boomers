import { usePostHog } from 'posthog-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocationTracker } from '@/components/location-tracker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useDriverAvailability } from '@/hooks/use-driver-availability';
import { useTheme } from '@/hooks/use-theme';

export default function PedidosScreen() {
  const colors = useTheme();
  const posthog = usePostHog();
  const { isAvailable, isLoading, isUpdating, error, toggle } =
    useDriverAvailability();
  const {
    hasSentLocation,
    permissionStatus,
    backgroundPermissionStatus,
    error: locationError,
    requestPermission,
    enableBackgroundUpdates,
    disableBackgroundUpdates,
  } = useLocationTracker();

  const handlePress = useCallback(async () => {
    const next = !isAvailable;
    if (next && !hasSentLocation) {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Ubicación requerida',
            'Activa el permiso de ubicación para iniciar operaciones.',
          );
          return;
        }
      }
      Alert.alert(
        'Obteniendo ubicación',
        'Espera un momento mientras enviamos tu ubicación.',
      );
      return;
    }
    try {
      const result = await toggle(next);
      const newState = result?.is_available ?? next;
      if (newState) {
        posthog?.capture('operations_started');
        await enableBackgroundUpdates();
      } else {
        await disableBackgroundUpdates();
      }
      Alert.alert(
        newState ? '¡Operaciones iniciadas!' : '¡Operaciones detenidas!',
      );
    } catch {
      Alert.alert(
        'Error',
        'No se pudo actualizar la disponibilidad. Inténtelo nuevamente.',
      );
    }
  }, [
    disableBackgroundUpdates,
    enableBackgroundUpdates,
    hasSentLocation,
    isAvailable,
    permissionStatus,
    posthog,
    requestPermission,
    toggle,
  ]);

  void backgroundPermissionStatus;

  const needsLocation = !isAvailable && !hasSentLocation;
  const disabled = isLoading || isUpdating;
  const buttonLabel = isAvailable
    ? 'Detener Operaciones'
    : needsLocation && permissionStatus !== 'granted'
      ? 'Activar ubicación'
      : needsLocation
        ? 'Obteniendo ubicación…'
        : 'Iniciar Operaciones';
  const statusLabel = isAvailable ? '¡Estás conectado!' : '¡Estás desconectado!';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <ThemedText type="title">Administrador de pedidos</ThemedText>

        <ThemedView style={styles.actionContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled, busy: isUpdating }}
            onPress={handlePress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isAvailable
                  ? Colors.light.accentDark
                  : colors.accent,
                opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.buttonText}>{buttonLabel}</ThemedText>
            )}
          </Pressable>

          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <ThemedText style={styles.statusText}>{statusLabel}</ThemedText>
          )}
          {error && !isUpdating && !isLoading && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}
          {locationError && (
            <ThemedText style={styles.errorText}>{locationError}</ThemedText>
          )}
        </ThemedView>
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
    gap: Spacing.four,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
  },
  button: {
    minWidth: 220,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 12,
    textAlign: 'center',
  },
});
