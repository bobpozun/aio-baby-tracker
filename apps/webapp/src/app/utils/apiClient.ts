import { fetchAuthSession } from 'aws-amplify/auth';
import { post, get, put, del } from 'aws-amplify/api'; 

const apiName = 'AioApi'; 


async function getAuthToken() {
  try {
    const { tokens } = await fetchAuthSession({ forceRefresh: false });
    
    return tokens?.idToken?.toString() || tokens?.accessToken?.toString();
  } catch (err) {
    console.error('Error fetching auth session:', err);
    return undefined;
  }
}


interface ApiOptions {
  headers?: Record<string, string>;
  body?: Record<string, any>;
  
  queryParams?: Record<string, string>;
}


async function makeApiRequest<T>(
  method: 'get' | 'post' | 'put' | 'del',
  path: string,
  options?: ApiOptions
): Promise<T> {
  const authToken = await getAuthToken();
  const headers = {
    ...options?.headers,
    ...(authToken && { Authorization: `Bearer ${authToken}` }), 
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
  ); 

  try {
    let operation;
    
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

    
    
    const response = (await operation.response) as any;
    console.log(
      `Raw API Response from ${method.toUpperCase()} ${path}:`,
      response
    ); 

    const body = response.body;
    console.log(
      `Raw API Response Body from ${method.toUpperCase()} ${path}:`,
      body
    ); 

    
    if (body && typeof body.json === 'function') {
      const data = await body.json(); 
      console.log(
        `Parsed API Response Body from ${method.toUpperCase()} ${path}:`,
        data
      ); 
      return data as T;
    } else {
      console.warn(
        `No JSON body found or body is not JSON in response from ${method.toUpperCase()} ${path}`
      );
      
      
      
      return {} as T; 
    }
  } catch (error: any) {
    console.error(`API Error (${method.toUpperCase()} ${path}):`, error);
    let errorMessage = 'An API error occurred';

    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      
      try {
        errorMessage = `Unknown error: ${JSON.stringify(error)}`;
      } catch {
        errorMessage = 'An unknown and non-serializable API error occurred.';
      }
    }

    
    throw new Error(`API request failed: ${errorMessage}`);
  }
}


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


