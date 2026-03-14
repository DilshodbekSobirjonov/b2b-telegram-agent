// Removed js-cookie

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const fetcher = async (endpoint: string, options: RequestInit = {}) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const res = await fetch(url, { 
    ...options, 
    headers
  });

  if (!res.ok) {
    // If a token is present but the server rejects it, the session has expired — clear and redirect.
    if (res.status === 401 && typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_session')
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      window.location.href = '/login'
      throw new Error('Session expired. Please log in again.')
    }

    const info = await res.json().catch(() => ({}));
    console.error(`API Error [${res.status}]:`, info);
    const error: any = new Error(info.detail || 'API request failed');
    error.status = res.status;
    error.info = info;
    throw error;
  }

  return res.json();
};

export const api = {
  fetcher,

  get: (endpoint: string) =>
    fetcher(endpoint, { method: 'GET' }),

  post: (endpoint: string, body: unknown) =>
    fetcher(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  patch: (endpoint: string, body: unknown) =>
    fetcher(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (endpoint: string) =>
    fetcher(endpoint, { method: 'DELETE' }),
};
