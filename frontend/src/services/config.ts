/*
  apiCall
  - Simple centralized wrapper for API requests.
  - Automatically attaches `Authorization: Bearer <token>` header when a token
    is present in localStorage so all calls use the user's JWT.
  - Keeps `Content-Type: application/json` by default and preserves custom headers.
  - Note: if you migrate to httpOnly cookies, this wrapper can be simplified.
*/
export async function apiCall(endpoint: string, options?: RequestInit) {
  const url = `/api${endpoint}`;
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(Object.entries(options?.headers || {}).map(([key, value]) => [key, String(value)])),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
