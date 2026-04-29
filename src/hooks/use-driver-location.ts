import { useAuth } from '@clerk/expo';
import { useCallback } from 'react';

import { apiRequest } from '@/lib/api';

interface DriverLocation {
  latitude: number;
  longitude: number;
}

export function useUpdateDriverLocation() {
  const { getToken } = useAuth();

  return useCallback(
    async (location: DriverLocation) => {
      const token = await getToken();
      await apiRequest<void>({
        method: 'PATCH',
        path: '/driver/location/',
        token,
        data: location,
      });
    },
    [getToken],
  );
}
