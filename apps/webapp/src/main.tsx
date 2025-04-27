import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';

import { Amplify, ResourcesConfig } from 'aws-amplify';

const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOLS_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOLS_WEB_CLIENT_ID,
      // identityPoolId: `${import.meta.env.VITE_AWS_COGNITO_REGION}:dummy-id-placeholder`, // Removed placeholder
    },
  },

  API: {
    REST: {
      AioApi: {
        endpoint: import.meta.env.VITE_API_AIOAPI_ENDPOINT,
        region: import.meta.env.VITE_API_AIOAPI_REGION,
      },
    },
  },

  Storage: {
    S3: {
      bucket: import.meta.env.VITE_AWS_STORAGE_BUCKET,
      region: import.meta.env.VITE_AWS_STORAGE_REGION,
    },
  },
};

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
} else {
  Amplify.configure(config as any);
  console.log(
    'Amplify configured directly from environment variables (v6+ style).'
  );
}

import App from './app/app';
import { ProfileProvider } from './app/context/ProfileContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        {' '}
        {}
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>
);
