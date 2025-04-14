const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Use Node environment for backend tests
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], // Standard Jest test file pattern
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Optional: Setup file for global setup/teardown (e.g., seeding DB)
  // globalSetup: './jest.globalSetup.js',
  // globalTeardown: './jest.globalTeardown.js',
  // Optional: Setup file run before each test file
  setupFilesAfterEnv: ['./jest.setup.js'],
  // Increase timeout if Cognito auth or API calls are slow
  testTimeout: 30000, // 30 seconds
  // Pass compiler options to ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Ensure JSON modules can be imported
          resolveJsonModule: true,
          // Keep esModuleInterop consistent if needed
          esModuleInterop: true,
        },
      },
    ],
  },
};
