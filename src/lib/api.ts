const DEFAULT_API_BASE_URL =
  'https://boomerang-staging-bd7685105325.herokuapp.com/api';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method: Method;
  path: string;
  token: string | null;
  data?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>({
  method,
  path,
  token,
  data,
  signal,
}: ApiRequestOptions): Promise<T | undefined> {
  if (!token) {
    throw new ApiError(401, 'Missing auth token');
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(
      response.status,
      `Request ${method} ${path} failed (${response.status})`,
      text,
    );
  }

  if (response.status === 204) return undefined;
  return (await response.json()) as T;
}
