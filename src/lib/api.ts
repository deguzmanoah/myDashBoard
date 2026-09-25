import { getAuthToken } from './actions/auth-actions';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an authenticated API request to a specified base URL
 */
async function makeAuthenticatedFetch(
  baseUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Make an authenticated API request and return parsed JSON response
 */
async function makeAuthenticatedRequest<T = unknown>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await makeAuthenticatedFetch(baseUrl, endpoint, options);

    if (response.status === 500) {
      return {
        error: 'Internal Server Error',
        status: response.status,
      };
    }

    if (response.status === 401) {
      return {
        error: 'Unauthorized',
        status: response.status,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;

      if (typeof data?.detail === 'string') {
        message = data.detail;
      }

      return {
        error: message,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {

    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 0,
    };
  }
}

/**
 * Make an authenticated API request to the third-party API (WEB_URL) and return parsed JSON response
 */
export async function authenticatedRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeAuthenticatedRequest<T>(process.env.THIRD_PARTY_API_WEB_URL!, endpoint, options);
}

/**
 * Make an authenticated API request to the root API (ROOT_URL) and return parsed JSON response
 */
export async function authenticatedRootRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeAuthenticatedRequest<T>(process.env.THIRD_PARTY_API_ROOT_URL!, endpoint, options);
}

/**
 * Make a public (unauthenticated) API request and return parsed JSON response
 */
export async function publicRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${process.env.THIRD_PARTY_API_ROOT_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: T | undefined;
    const text = await response.text();
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // If JSON parsing fails, return text as data
        data = text as T;
      }
    }

    if (!response.ok) {
      const message = typeof data === 'object' && data && 'message' in data 
        ? (data.message as string)
        : typeof data === 'string' 
        ? data 
        : `HTTP error! status: ${response.status}`;

      return {
        error: message,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 0,
    };
  }
}
