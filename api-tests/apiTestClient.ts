import { Amplify, API } from 'aws-amplify';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  ICognitoUserPoolData,
  ICognitoUserData,
  IAuthenticationDetailsData,
} from 'amazon-cognito-identity-js';

// --- Configuration ---
const testUserEmail = 'robert.pozun@gmail.com';
const testUserPassword = 'v#3kmzT^V*iWlhVE8$I^';

// Get configuration from environment variables
const apiName = process.env.API_NAME;
const apiEndpoint = process.env.API_ENDPOINT;
const apiRegion = process.env.API_REGION;
const userPoolId = process.env.USER_POOL_ID;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID;
const cognitoRegion = process.env.COGNITO_REGION;

if (!apiName || !apiEndpoint || !apiRegion || !userPoolId || !userPoolClientId || !cognitoRegion) {
  throw new Error('Missing required configuration. Please check your .env.local file.');
}

// Configure Amplify with v5 config structure
const amplifyConfig = {
  Auth: {
    region: cognitoRegion,
    userPoolId: userPoolId,
    userPoolWebClientId: userPoolClientId,
  },
  API: {
    endpoints: [
      {
        name: apiName,
        endpoint: apiEndpoint,
        region: apiRegion,
      }
    ]
  }
};

// Configure Amplify
try {
  Amplify.configure(amplifyConfig);
  console.log("Amplify configured successfully.");
} catch (error: any) {
  if (error.message.includes("Amplify has already been configured")) {
    console.log("Amplify already configured.");
  } else {
    console.error("Error configuring Amplify:", error);
  }
}

// Manual Cognito authentication is still needed to establish the session
const userPoolData: ICognitoUserPoolData = {
  UserPoolId: amplifyConfig.Auth.userPoolId,
  ClientId: amplifyConfig.Auth.userPoolWebClientId,
};
const userPool = new CognitoUserPool(userPoolData);

let isUserAuthenticated = false; // Track auth status

/**
 * Authenticates the test user using Cognito. Ensures it only runs once per test session.
 */
async function ensureAuthenticated(): Promise<void> {
  if (isUserAuthenticated) {
    console.log('User already authenticated in this session (flag).');
    return;
  }

  console.log('Authenticating test user with Cognito for Amplify...');
  const authenticationData: IAuthenticationDetailsData = {
    Username: testUserEmail,
    Password: testUserPassword,
  };
  const authenticationDetails = new AuthenticationDetails(authenticationData);

  const userData: ICognitoUserData = {
    Username: testUserEmail,
    Pool: userPool,
  };
  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        console.log('Cognito authentication successful for Amplify.');
        isUserAuthenticated = true;
        resolve();
      },
      onFailure: (err) => {
        console.error('Cognito authentication failed:', err);
        isUserAuthenticated = false;
        reject(
          new Error(`Cognito authentication failed: ${err.message || err}`)
        );
      },
    });
  });
}

// Helper function to make authenticated requests using Amplify API
async function makeRequest(method: 'get' | 'post' | 'put' | 'del', path: string, data?: any) {
  await ensureAuthenticated();

  const apiOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...(data && { body: data }),
  };

  try {
    console.log(`Making Amplify API call: ${method.toUpperCase()} ${path}`);
    let response;
    switch (method) {
      case 'get':
        response = await API.get(apiName!, path, apiOptions);
        break;
      case 'post':
        response = await API.post(apiName!, path, apiOptions);
        break;
      case 'put':
        response = await API.put(apiName!, path, apiOptions);
        break;
      case 'del':
        response = await API.del(apiName!, path, apiOptions);
        break;
      default:
        throw new Error(`Unsupported API method: ${method}`);
    }

    console.log(`Amplify API call successful: ${method.toUpperCase()} ${path}`);
    return response;

  } catch (error: any) {
    console.error(`Amplify API request error (${method.toUpperCase()} ${path}):`, JSON.stringify(error, null, 2));
    // Attempt to extract status code if available in the error structure
    const statusCode = error?.response?.statusCode || error?.statusCode || 'N/A';
    console.error(`Error Status Code: ${statusCode}`);
    // Rethrow a more informative error if possible
    throw new Error(`Amplify API request failed for ${method.toUpperCase()} ${path} with status ${statusCode}: ${error.message || error}`);
  }
}

// Export functions for specific methods
export const apiGet = (path: string) => makeRequest('get', path);
export const apiPost = (path: string, data: any) => makeRequest('post', path, data);
export const apiPut = (path: string, data: any) => makeRequest('put', path, data);
export const apiDelete = (path: string) => makeRequest('del', path);

// Keep clearAuthToken for compatibility with existing tests
export const clearAuthToken = () => {
    console.log('Clearing authentication status flag.');
    isUserAuthenticated = false;
};

export const resetAuthStatus = clearAuthToken;
