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
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Build request headers.
   * Automatically attaches JWT auth token if available.
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

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
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    if (__DEV__) {
      console.log(`[PLASO API] ${method} ${url}`);
    }

    try {
      const headers = await this.getHeaders();
      
      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal as AbortSignal,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      
      if (__DEV__) {
        console.log(`[PLASO API] Response: ${response.status} (${endTime - startTime}ms)`);
      }

      const data = await response.json();

      return data as ApiResponse<T>;
    } catch (error) {
      const isAbortError = 
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof Error && error.message.includes('Fetch request has been canceled'));

      if (isAbortError) {
        if (__DEV__) {
          console.log(`[PLASO API] Timeout (${this.timeout}ms) or canceled: ${url}`);
        }
        return {
          success: false,
          message: 'Request timed out or was canceled',
        };
      }

      if (__DEV__) {
        console.log(`[PLASO API] Network error:`, error instanceof Error ? error.message : error);
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
