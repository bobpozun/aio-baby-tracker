import { Amplify, Auth } from 'aws-amplify';
import axios from 'axios';

const testUserEmail = process.env.TEST_USER_EMAIL;
const testUserPassword = process.env.TEST_USER_PASSWORD;

const apiName = process.env.API_NAME;
const apiEndpoint = process.env.API_ENDPOINT;
const apiRegion = process.env.API_REGION;
const userPoolId = process.env.USER_POOL_ID;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID;
const cognitoRegion = process.env.COGNITO_REGION;

if (
  !apiName ||
  !apiEndpoint ||
  !apiRegion ||
  !userPoolId ||
  !userPoolClientId ||
  !cognitoRegion
) {
  throw new Error(
    'Missing required configuration. Please check your .env.local file.'
  );
}

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
        authorizationType: 'AMAZON_COGNITO_USER_POOLS',
      },
    ],
  },
};

let isAmplifyConfigured = false;
let isUserAuthenticated = false;

async function ensureAuthenticated(): Promise<void> {
  if (!isAmplifyConfigured) {
    try {
      Amplify.configure(amplifyConfig);
      console.log(
        'Amplify configured successfully inside ensureAuthenticated.'
      );
      isAmplifyConfigured = true;
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes('Amplify has already been configured')
      ) {
        console.log(
          'Amplify already configured (detected inside ensureAuthenticated).'
        );
        isAmplifyConfigured = true;
      } else {
        console.error(
          'Error configuring Amplify inside ensureAuthenticated:',
          error
        );

        throw new Error(
          `Failed to configure Amplify: ${error.message || error}`
        );
      }
    }
  }

  if (isUserAuthenticated) {
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    throw new Error(
      'TEST_USER_EMAIL or TEST_USER_PASSWORD is not defined in environment variables.'
    );
  }

  console.log('Authenticating test user with Amplify Auth...');
  try {
    await Auth.signIn(testUserEmail, testUserPassword);
    console.log('Amplify Auth.signIn successful.');

    await Auth.currentSession();
    console.log('Amplify Auth.currentSession successful after signIn.');
    isUserAuthenticated = true;
  } catch (err: any) {
    console.error('Amplify authentication or session fetch failed:', err);
    if (err && typeof err === 'object') {
      console.error(
        'Full error object:',
        JSON.stringify(err, Object.getOwnPropertyNames(err))
      );
    }
    isUserAuthenticated = false;

    throw new Error(`Amplify authentication failed: ${err.message || err}`);
  }
}

async function makeRequest(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  data?: any
) {
  await ensureAuthenticated();

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
    throw new Error(
      `Failed to get authentication token: ${
        sessionError.message || sessionError
      }`
    );
  }

  const url = `${apiEndpoint}${path}`;

  const axiosConfig: import('axios').AxiosRequestConfig = {
    method: method,
    url: url,
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  };

  if (data && (method === 'post' || method === 'put')) {
    axiosConfig.headers!['Content-Type'] = 'application/json';
    axiosConfig.data = data;
  }

  try {
    console.log(`Making Axios request: ${method.toUpperCase()} ${url}`);
    const response = await axios(axiosConfig);
    console.log(
      `Axios request successful: ${method.toUpperCase()} ${url} - Status: ${
        response.status
      }`
    );
    return response.data;
  } catch (error: any) {
    console.error(`Axios request error (${method.toUpperCase()} ${url}):`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error(
        'Headers:',
        JSON.stringify(error.response.headers, null, 2)
      );
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request:', JSON.stringify(error.request, null, 2));
      console.error('Error: No response received from server.');
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Axios Config:', JSON.stringify(error.config, null, 2));

    const statusCode = error?.response?.status || 'N/A';

    throw new Error(
      `Axios API request failed for ${method.toUpperCase()} ${path} with status ${statusCode}: ${
        error.response?.data?.message || error.message || error
      }`
    );
  }
}

export const apiGet = (path: string) => makeRequest('get', path);
export const apiPost = (path: string, data: any) =>
  makeRequest('post', path, data);
export const apiPut = (path: string, data: any) =>
  makeRequest('put', path, data);
export const apiDelete = (path: string) => makeRequest('delete', path);

export const signOutAndClearAuth = async () => {
  try {
    await Auth.signOut();
    console.log('Amplify sign out successful.');
  } catch (error) {
    console.error('Error during Amplify sign out:', error);
  } finally {
    console.log('Clearing authentication status flag.');
    isUserAuthenticated = false;
  }
};

export const clearAuthToken = () => {
  console.warn(
    'clearAuthToken called. Consider using signOutAndClearAuth for complete cleanup.'
  );
  console.log('Clearing authentication status flag.');
  isUserAuthenticated = false;
};

export const resetAuthStatus = signOutAndClearAuth;
