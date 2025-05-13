require('dotenv').config({ path: '.env' });

const requiredEnvVars = [
  'USER_POOL_ID',
  'USER_POOL_CLIENT_ID',
  'API_NAME',
  'API_ENDPOINT',
  'API_REGION',
  'COGNITO_REGION',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('Environment variables loaded successfully');
