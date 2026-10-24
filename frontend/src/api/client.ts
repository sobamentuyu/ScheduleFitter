import { ApiError, readErrorMessage } from "@/api/errors.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const message = await readErrorMessage(
      res,
      `Request failed (${res.status})`,
    );
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

/** JSON 以外（FormData など）向け。Content-Type を付けない。 */
export async function requestRaw(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
  });
}
