/**
 * API Client
 *
 * HTTP client with authentication, interceptors, and error handling
 */

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './endpoints';
import { ApiResponse, ApiError } from './types';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Initialize client by loading stored token
   */
  async initialize() {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  /**
   * Set authentication token
   */
  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  /**
   * Clear authentication token
   */
  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  /**
   * Build request headers
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: ApiError;

    try {
      const json = await response.json();
      errorData = {
        code: json.code || `HTTP_${response.status}`,
        message: json.message || json.error || response.statusText,
        details: json.details,
      };
    } catch {
      errorData = {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'An error occurred',
      };
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        await this.clearToken();
        // Could emit event here for app to handle logout
      }
    }

    throw errorData;
  }

  /**
   * Attempt to refresh authentication token
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      await this.setToken(data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      if ((error as any).code) {
        // Already an ApiError
        throw error;
      }

      // Network or other error
      throw {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Initialize on import
apiClient.initialize();
