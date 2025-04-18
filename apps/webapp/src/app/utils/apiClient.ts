import { fetchAuthSession } from 'aws-amplify/auth';
import { post, get, put, del } from 'aws-amplify/api'; // Use new v6 API module

const apiName = 'AioApi'; // Matches the name in amplifyconfiguration.json

// Helper to get the JWT token for authenticated requests
async function getAuthToken() {
  try {
    const { tokens } = await fetchAuthSession({ forceRefresh: false });
    // Use idToken for API Gateway Cognito authorizer (default), fallback to accessToken if needed
    return tokens?.idToken?.toString() || tokens?.accessToken?.toString();
  } catch (err) {
    console.error('Error fetching auth session:', err);
    return undefined;
  }
}

// Type for API options, including authorization
interface ApiOptions {
  headers?: Record<string, string>;
  body?: Record<string, any>;
  // Query params must be strings according to Amplify v6 types
  queryParams?: Record<string, string>;
}

// Generic function for making authenticated API requests
async function makeApiRequest<T>(
  method: 'get' | 'post' | 'put' | 'del',
  path: string,
  options?: ApiOptions
): Promise<T> {
  const authToken = await getAuthToken();
  const headers = {
    ...options?.headers,
    ...(authToken && { Authorization: `Bearer ${authToken}` }), // Add auth token as Bearer
  };

  const operationOptions = {
    apiName: apiName,
    path: path,
    options: {
      headers: headers,
      ...(options?.body && { body: options.body }),
      ...(options?.queryParams && { queryParams: options.queryParams }),
    },
  };

  console.log(
    `Making ${method.toUpperCase()} request to ${path}`,
    operationOptions
  ); // Debug log

  try {
    let operation;
    // Remove explicit casts, rely on object structure
    switch (method) {
      case 'get':
        operation = get(operationOptions);
        break;
      case 'post':
        operation = post(operationOptions);
        break;
      case 'put':
        operation = put(operationOptions);
        break;
      case 'del':
        operation = del(operationOptions);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // In Amplify v6, destructure body from the awaited response
    // Cast response to 'any' as a workaround for persistent type errors
    const response = (await operation.response) as any;
    console.log(
      `Raw API Response from ${method.toUpperCase()} ${path}:`,
      response
    ); // Debug log raw response

    const body = response.body;
    console.log(
      `Raw API Response Body from ${method.toUpperCase()} ${path}:`,
      body
    ); // Debug log raw body

    // Check if body exists and has a json method
    if (body && typeof body.json === 'function') {
      const data = await body.json(); // Call json() on the body
      console.log(
        `Parsed API Response Body from ${method.toUpperCase()} ${path}:`,
        data
      ); // Debug log parsed data
      return data as T;
    } else {
      console.warn(
        `No JSON body found or body is not JSON in response from ${method.toUpperCase()} ${path}`
      );
      // Handle cases where there might be no body (e.g., 204 No Content) or it's not JSON.
      // Returning an empty object might be suitable for some cases, null for others.
      // Adjust based on expected API behavior.
      return {} as T; // Or potentially null based on use case
    }
  } catch (error: any) {
    console.error(`API Error (${method.toUpperCase()} ${path}):`, error);
    let errorMessage = 'An API error occurred';

    // Simplified error message extraction - Rely primarily on error.message
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      // Fallback for unknown error types
      try {
        errorMessage = `Unknown error: ${JSON.stringify(error)}`;
      } catch {
        errorMessage = 'An unknown and non-serializable API error occurred.';
      }
    }

    // Re-throw a new error with the extracted message
    throw new Error(`API request failed: ${errorMessage}`);
  }
}

// Export specific methods for convenience
export const apiClient = {
  get: <T>(
    path: string,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
  ) => makeApiRequest<T>('get', path, { queryParams, headers }),
  post: <T>(
    path: string,
    body: Record<string, any>,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
  ) => makeApiRequest<T>('post', path, { body, queryParams, headers }),
  put: <T>(
    path: string,
    body: Record<string, any>,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
  ) => makeApiRequest<T>('put', path, { body, queryParams, headers }),
  del: <T>(
    path: string,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
  ) => makeApiRequest<T>('del', path, { queryParams, headers }),
};

// Example usage (replace with actual API calls later):
/*
interface Profile { id: string; name: string; }
async function fetchProfiles() {
  try {
    const profiles = await apiClient.get<Profile[]>('/profiles');
    console.log(profiles);
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
  }
}
*/
