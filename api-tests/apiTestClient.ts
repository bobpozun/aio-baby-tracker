import { Amplify, Auth } from 'aws-amplify'; // Remove API import
import axios from 'axios'; // Import axios

// --- Configuration ---
const testUserEmail = process.env.TEST_USER_EMAIL;
const testUserPassword = process.env.TEST_USER_PASSWORD;

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
        authorizationType: 'AMAZON_COGNITO_USER_POOLS' // Specify auth type for API calls
      },
    ],
  },
};

// Defer Amplify configuration until first authentication attempt
let isAmplifyConfigured = false;
let isUserAuthenticated = false; // Track auth status

/**
 * Configures Amplify (if not already done) and authenticates the test user.
 * Ensures it only runs once per test session.
 */
async function ensureAuthenticated(): Promise<void> {
  // Configure Amplify once
  if (!isAmplifyConfigured) {
    try {
      Amplify.configure(amplifyConfig);
      console.log('Amplify configured successfully inside ensureAuthenticated.');
      isAmplifyConfigured = true;
    } catch (error: any) {
       // Check if it's the specific "already configured" error
      if (error.message && error.message.includes('Amplify has already been configured')) {
        console.log('Amplify already configured (detected inside ensureAuthenticated).');
        isAmplifyConfigured = true; // Mark as configured even if caught here
      } else {
        console.error('Error configuring Amplify inside ensureAuthenticated:', error);
        // Rethrow critical configuration errors
        throw new Error(`Failed to configure Amplify: ${error.message || error}`);
      }
    }
  }

  // Proceed with authentication check
  if (isUserAuthenticated) {
    console.log('User already authenticated in this session (flag).');
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    throw new Error('TEST_USER_EMAIL or TEST_USER_PASSWORD is not defined in environment variables.');
  }

  console.log('Authenticating test user with Amplify Auth...');
  try {
    await Auth.signIn(testUserEmail, testUserPassword);
    console.log('Amplify Auth.signIn successful.');
    // Explicitly fetch the session to ensure tokens are loaded for API calls
    await Auth.currentSession();
    console.log('Amplify Auth.currentSession successful after signIn.');
    isUserAuthenticated = true;
  } catch (err: any) {
    console.error('Amplify authentication or session fetch failed:', err);
    isUserAuthenticated = false;
    // Rethrow the error to fail the test clearly
    throw new Error(`Amplify authentication failed: ${err.message || err}`);
  }
}

// Helper function to make authenticated requests using Axios
async function makeRequest(method: 'get' | 'post' | 'put' | 'delete', path: string, data?: any) { // Note: axios uses 'delete' not 'del'
  await ensureAuthenticated();

  // Get the ID token from the authenticated session
  let idToken;
  try {
    const session = await Auth.currentSession();
    idToken = session.getIdToken().getJwtToken();
    if (!idToken) {
      throw new Error('ID token not found in session.');
    }
    console.log('Successfully retrieved ID token.');
  } catch (sessionError: any) {
    console.error('Error getting current session or ID token:', sessionError);
    throw new Error(`Failed to get authentication token: ${sessionError.message || sessionError}`);
  }

  // Construct the full URL
  const url = `${apiEndpoint}${path}`; // apiEndpoint already includes /prod

  // Configure Axios request
  const axiosConfig: import('axios').AxiosRequestConfig = {
    method: method,
    url: url,
    headers: {
      // Axios automatically stringifies JSON data and sets Content-Type: application/json
      // We only need to ensure the Authorization header is set.
      'Authorization': idToken, // Send the raw token, API Gateway Cognito Authorizer expects this format
                                // (Alternatively, 'Bearer ' + idToken might work depending on exact authorizer config, but raw token is standard for Cognito Authorizer)
    },
    data: data, // Axios handles placing data in the body for POST/PUT etc.
  };


  try {
    console.log(`Making Axios request: ${method.toUpperCase()} ${url}`);
    const response = await axios(axiosConfig);
    console.log(`Axios request successful: ${method.toUpperCase()} ${url} - Status: ${response.status}`);
    return response.data; // Return the data part of the response
  } catch (error: any) {
    // Log detailed Axios error information
    console.error(`Axios request error (${method.toUpperCase()} ${url}):`);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request (made but no response):', error.request); // Log the request object itself
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message (request setup):', error.message);
    }
    // Log the config used for the failed request
    // Be cautious logging full config if it contains sensitive data not already obscured
    // console.error('Axios Config:', JSON.stringify(error.config, null, 2));

    const statusCode = error?.response?.status || 'N/A';
    // Try to get a more specific error message from the response data if available
    const responseErrorMessage = error?.response?.data?.message || error?.response?.data || error.message;

    // Rethrow a more informative error
    throw new Error(
      `Axios API request failed for ${method.toUpperCase()} ${path} with status ${statusCode}: ${responseErrorMessage}`
    );
  }
}

// Export functions for specific methods
export const apiGet = (path: string) => makeRequest('get', path);
export const apiPost = (path: string, data: any) => makeRequest('post', path, data);
export const apiPut = (path: string, data: any) => makeRequest('put', path, data);
export const apiDelete = (path: string) => makeRequest('delete', path); // Use 'delete' for axios

// Function to sign out and clear status
export const signOutAndClearAuth = async () => {
  try {
    await Auth.signOut();
    console.log('Amplify sign out successful.');
  } catch (error) {
    console.error('Error during Amplify sign out:', error);
    // Don't necessarily fail the test if sign out fails, but log it.
  } finally {
    console.log('Clearing authentication status flag.');
    isUserAuthenticated = false;
  }
};

// Keep clearAuthToken for compatibility if needed, but prefer signOutAndClearAuth
export const clearAuthToken = () => {
  console.warn('clearAuthToken called. Consider using signOutAndClearAuth for complete cleanup.');
  console.log('Clearing authentication status flag.');
  isUserAuthenticated = false;
};

export const resetAuthStatus = signOutAndClearAuth; // Point reset to the new function
