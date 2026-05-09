export const API_BASE = "https://boomerang-staging-bd7685105325.herokuapp.com/api";

export async function apiRequest<T>({
    method,
    path,
    token,
    data,
}: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    token: string;
    data?: unknown;
}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: data != null ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}
