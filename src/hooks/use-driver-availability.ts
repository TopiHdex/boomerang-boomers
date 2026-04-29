import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { apiRequest } from '@/lib/api';

interface DriverAvailability {
  is_available: boolean;
}

interface UseDriverAvailabilityResult {
  isAvailable: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  toggle: (next: boolean) => Promise<DriverAvailability | null>;
  refresh: () => Promise<void>;
}

export function useDriverAvailability(): UseDriverAvailabilityResult {
  const { getToken, isSignedIn } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await apiRequest<DriverAvailability>({
        method: 'GET',
        path: '/driver/availability/',
        token,
        signal: controller.signal,
      });
      if (result) setIsAvailable(result.is_available);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    void fetchAvailability();
    return () => abortRef.current?.abort();
  }, [fetchAvailability]);

  const toggle = useCallback(
    async (next: boolean) => {
      setIsUpdating(true);
      setError(null);
      try {
        const token = await getToken();
        const result = await apiRequest<DriverAvailability>({
          method: 'PATCH',
          path: '/driver/availability/',
          token,
          data: { is_available: next },
        });
        if (result) setIsAvailable(result.is_available);
        return result ?? null;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [getToken],
  );

  return {
    isAvailable,
    isLoading,
    isUpdating,
    error,
    toggle,
    refresh: fetchAvailability,
  };
}
