type ApiCallOptions = RequestInit & {
  suppressUnauthorizedEvent?: boolean;
};

export async function apiCall(endpoint: string, options?: ApiCallOptions) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5254';
  const url = `${apiBaseUrl}/api${endpoint}`;
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = String(value);
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !options?.suppressUnauthorizedEvent) {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  return response;
}
