/**
 * API Client untuk SI-KPSPAMS Kuajang
 * Menangani Bearer Token Sanctum, Context Scoping Header, dan penanganan format JSON seragam.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('pages.dev') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost'))
        ? process.env.NEXT_PUBLIC_API_URL
        : '/api/v1';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message: string;
  data: T;
  meta?: {
    timestamp?: string;
    api_version?: string;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  errors?: Record<string, string[]>;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const contextId = typeof window !== 'undefined' ? localStorage.getItem('kpspams_context_id') : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (contextId) {
    headers['X-KPSPAMS-Context'] = contextId;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw data;
  }

  return data;
}
