import { config } from '../constants/config';
import { ApiResponse } from '../types';
import { tokenStorage } from './tokenStorage';

/**
 * Reusable API client for communicating with the Plaso backend.
 *
 * Architecture notes:
 * - Centralized base URL from config
 * - Consistent error handling
 * - Easy to extend with JWT auth headers in Phase 2
 */

class ApiClient {
  private getBaseUrl(): string {
    return config.api.baseUrl;
  }

  /**
   * Build request headers.
   * Automatically attaches JWT auth token if available.
   */
  private async getHeaders(isFormData: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prevent aggressive caching on mobile devices
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';

    const token = await tokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make an HTTP request to the backend API.
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const controller = new AbortController();
    const isFormData = body instanceof FormData || (body && typeof (body as any).append === 'function');
    
    // Give file uploads a much longer timeout (60s vs 15s)
    const requestTimeout = isFormData ? 60000 : config.api.timeout;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    if (__DEV__) {
      console.log(`[PLASO API] ${method} ${url}`);
    }

    try {
      const headers = await this.getHeaders(isFormData as boolean);

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal as AbortSignal,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = isFormData ? (body as FormData) : JSON.stringify(body);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      clearTimeout(timeoutId);

      if (__DEV__) {
        console.log(`[PLASO API] Response: ${response.status} (${endTime - startTime}ms)`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        return {
          success: response.ok,
          message: response.statusText || 'Invalid response from server',
        };
      }

      return data as ApiResponse<T>;
    } catch (error) {
      const isAbortError =
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof Error && error.message.includes('Fetch request has been canceled'));

      if (isAbortError) {
        if (__DEV__) {
          console.log(`[PLASO API] Timeout (${requestTimeout}ms) or canceled: ${url}`);
        }
        return {
          success: false,
          message: `Request timed out connecting to ${url}. Check your connection or server.`,
        };
      }

      if (__DEV__) {
        console.log(`[PLASO API] Network error on ${url}:`, error instanceof Error ? error.message : error);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** HTTP GET */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /** HTTP POST */
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /** HTTP PUT */
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /** HTTP PATCH */
  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  }

  /** HTTP DELETE */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
}

/** Singleton API client instance */
const api = new ApiClient();
export default api;
