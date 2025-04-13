import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css'; // Ensure global styles are imported

// --- Amplify Configuration ---
import { Amplify, ResourcesConfig } from 'aws-amplify';
// import baseAmplifyConfig from './amplifyconfiguration.json'; // No longer needed for v6 direct config

// Define the configuration directly using v6+ ResourcesConfig structure
const config: ResourcesConfig = {
  Auth: {
    // region: import.meta.env.VITE_AWS_COGNITO_REGION, // Removed region
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOLS_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOLS_WEB_CLIENT_ID,
      // identityPoolId: `${import.meta.env.VITE_AWS_COGNITO_REGION}:dummy-id-placeholder`, // Removed placeholder
    },
  },
  // Re-enable API configuration
  API: {
    REST: {
      AioApi: {
        endpoint: import.meta.env.VITE_API_AIOAPI_ENDPOINT,
        region: import.meta.env.VITE_API_AIOAPI_REGION,
      },
    },
  },
  // Re-enable Storage configuration
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_AWS_STORAGE_BUCKET,
      region: import.meta.env.VITE_AWS_STORAGE_REGION,
    },
  },
}; // Close main config object

// Validate essential config values from the environment variables
// Re-enable all validation checks
if (
  !config.Auth?.Cognito?.userPoolId ||
  !config.Auth?.Cognito?.userPoolClientId ||
  !config.API?.REST?.AioApi?.endpoint ||
  !config.Storage?.S3?.bucket ||
  !config.Storage?.S3?.region
) {
  console.error(
    'Essential Amplify configuration values are missing from environment variables! Check .env file (VITE_AWS_USER_POOLS_ID, VITE_AWS_USER_POOLS_WEB_CLIENT_ID, VITE_API_AIOAPI_ENDPOINT, VITE_AWS_STORAGE_BUCKET, VITE_AWS_STORAGE_REGION).'
  );
  // Optionally render an error message to the user, or throw an error
} else {
  // Use 'as any' assertion again to bypass potentially incorrect type errors
  Amplify.configure(config as any);
  console.log(
    'Amplify configured directly from environment variables (v6+ style).'
  );
}
// --- End Amplify Configuration ---

import App from './app/app';
import { ProfileProvider } from './app/context/ProfileContext'; // Import the provider

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        {' '}
        {/* Wrap App with Provider */}
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>
);
