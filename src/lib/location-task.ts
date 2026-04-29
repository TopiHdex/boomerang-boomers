import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import { API_BASE_URL } from './api';

export const BACKGROUND_LOCATION_TASK = 'boomerang-background-location';
const TOKEN_KEY = 'boomerang.driverApiToken';

export async function setBackgroundAuthToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  }
}

async function getBackgroundAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

interface BackgroundLocationData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task error:', error.message);
    return;
  }
  if (!data) return;

  const { locations } = data as BackgroundLocationData;
  const last = locations?.[locations.length - 1];
  if (!last) return;

  const token = await getBackgroundAuthToken();
  if (!token) return;

  const pos = {
    latitude: parseFloat(last.coords.latitude.toFixed(7)),
    longitude: parseFloat(last.coords.longitude.toFixed(7)),
  };

  try {
    await fetch(`${API_BASE_URL}/driver/location/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pos),
    });
  } catch (err) {
    console.warn('Background location post failed:', (err as Error).message);
  }
});

export async function startBackgroundLocationUpdates() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (hasStarted) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10_000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'Boomerang activo',
      notificationBody: 'Compartiendo tu ubicación para recibir pedidos.',
      notificationColor: '#34c64c',
    },
    activityType: Location.ActivityType.AutomotiveNavigation,
  });
}

export async function stopBackgroundLocationUpdates() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  await setBackgroundAuthToken(null);
}
