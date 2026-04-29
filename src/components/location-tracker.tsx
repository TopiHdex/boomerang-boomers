import { useAuth } from '@clerk/expo';
import { useKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useUpdateDriverLocation } from '@/hooks/use-driver-location';
import {
  setBackgroundAuthToken,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '@/lib/location-task';

const SEND_INTERVAL_MS = 10_000;
const LOCATION_DISTANCE_INTERVAL_M = 10;
const LOCATION_TIME_INTERVAL_MS = 5_000;

export type LocationPermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'undetermined';

interface LocationContextValue {
  hasSentLocation: boolean;
  permissionStatus: LocationPermissionStatus;
  backgroundPermissionStatus: LocationPermissionStatus;
  error: string | null;
  lastPosition: { latitude: number; longitude: number } | null;
  requestPermission: () => Promise<boolean>;
  requestBackgroundPermission: () => Promise<boolean>;
  enableBackgroundUpdates: () => Promise<void>;
  disableBackgroundUpdates: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function useLocationTracker(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error(
      'useLocationTracker must be used within LocationTrackerProvider',
    );
  }
  return ctx;
}

interface ProviderProps {
  children: React.ReactNode;
}

const BG_TOKEN_REFRESH_MS = 60_000;

export function LocationTrackerProvider({ children }: ProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const updateLocation = useUpdateDriverLocation();
  useKeepAwake('boomerang-driver-location');

  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('idle');
  const [backgroundPermissionStatus, setBackgroundPermissionStatus] =
    useState<LocationPermissionStatus>('idle');
  const [hasSentLocation, setHasSentLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastPosition, setLastPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const latestPositionRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const hasInitialSendRef = useRef(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = useCallback(
    async (pos: { latitude: number; longitude: number }) => {
      try {
        await updateLocation(pos);
        setHasSentLocation(true);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [updateLocation],
  );

  const startWatching = useCallback(async () => {
    if (subscriptionRef.current) return;
    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          timeInterval: LOCATION_TIME_INTERVAL_MS,
        },
        (position) => {
          const pos = {
            latitude: parseFloat(position.coords.latitude.toFixed(7)),
            longitude: parseFloat(position.coords.longitude.toFixed(7)),
          };
          latestPositionRef.current = pos;
          setLastPosition(pos);
          if (!hasInitialSendRef.current) {
            hasInitialSendRef.current = true;
            void sendLocation(pos);
          }
        },
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [sendLocation]);

  const requestPermission = useCallback(async () => {
    setPermissionStatus('requesting');
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        await startWatching();
        return true;
      }
      setPermissionStatus(status === 'denied' ? 'denied' : 'undetermined');
      setError('Permiso de ubicación denegado.');
      return false;
    } catch (err) {
      setPermissionStatus('denied');
      setError((err as Error).message);
      return false;
    }
  }, [startWatching]);

  const requestBackgroundPermission = useCallback(async () => {
    setBackgroundPermissionStatus('requesting');
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setBackgroundPermissionStatus('denied');
          return false;
        }
      }
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        setBackgroundPermissionStatus('granted');
        return true;
      }
      setBackgroundPermissionStatus(
        status === 'denied' ? 'denied' : 'undetermined',
      );
      setError('Permiso de ubicación en segundo plano denegado.');
      return false;
    } catch (err) {
      setBackgroundPermissionStatus('denied');
      setError((err as Error).message);
      return false;
    }
  }, [requestPermission]);

  const refreshBackgroundToken = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) await setBackgroundAuthToken(token);
    } catch (err) {
      console.warn('Token refresh failed:', (err as Error).message);
    }
  }, [getToken]);

  const enableBackgroundUpdates = useCallback(async () => {
    const bg = await Location.getBackgroundPermissionsAsync();
    let granted = bg.status === 'granted';
    if (!granted) granted = await requestBackgroundPermission();
    if (!granted) return;

    await refreshBackgroundToken();
    await startBackgroundLocationUpdates();

    if (tokenRefreshRef.current) clearInterval(tokenRefreshRef.current);
    tokenRefreshRef.current = setInterval(() => {
      void refreshBackgroundToken();
    }, BG_TOKEN_REFRESH_MS);
  }, [refreshBackgroundToken, requestBackgroundPermission]);

  const disableBackgroundUpdates = useCallback(async () => {
    if (tokenRefreshRef.current) {
      clearInterval(tokenRefreshRef.current);
      tokenRefreshRef.current = null;
    }
    await stopBackgroundLocationUpdates();
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    (async () => {
      const fg = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (fg.status === 'granted') {
        setPermissionStatus('granted');
        await startWatching();
      } else {
        setPermissionStatus(fg.status === 'denied' ? 'denied' : 'undetermined');
      }
      const bg = await Location.getBackgroundPermissionsAsync().catch(
        () => null,
      );
      if (cancelled || !bg) return;
      setBackgroundPermissionStatus(
        bg.status === 'granted'
          ? 'granted'
          : bg.status === 'denied'
            ? 'denied'
            : 'undetermined',
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, startWatching]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshBackgroundToken();
    });
    return () => sub.remove();
  }, [refreshBackgroundToken]);

  useEffect(() => {
    if (permissionStatus !== 'granted') return;
    intervalRef.current = setInterval(() => {
      const pos = latestPositionRef.current;
      if (pos) void sendLocation(pos);
    }, SEND_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [permissionStatus, sendLocation]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tokenRefreshRef.current) clearInterval(tokenRefreshRef.current);
    };
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({
      hasSentLocation,
      permissionStatus,
      backgroundPermissionStatus,
      error,
      lastPosition,
      requestPermission,
      requestBackgroundPermission,
      enableBackgroundUpdates,
      disableBackgroundUpdates,
    }),
    [
      hasSentLocation,
      permissionStatus,
      backgroundPermissionStatus,
      error,
      lastPosition,
      requestPermission,
      requestBackgroundPermission,
      enableBackgroundUpdates,
      disableBackgroundUpdates,
    ],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
