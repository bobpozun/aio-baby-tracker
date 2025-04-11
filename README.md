# AIO Baby Tracker

All-In-One Baby Tracker application for web and mobile, designed to help parents track pregnancy progress and baby milestones, feedings, sleep, diapers, and more.

## Technology Stack

*   **Monorepo:** Nx (Integrated build system)
*   **Frontend (Web):** React, Vite, TypeScript, React Router, AWS Amplify UI
*   **Frontend (Mobile):** React Native, TypeScript, AWS Amplify UI (planned)
*   **Backend:** AWS CDK (TypeScript) for Infrastructure as Code
    *   **Authentication:** AWS Cognito
    *   **Database:** AWS DynamoDB
    *   **API:** AWS API Gateway + AWS Lambda (Node.js runtime)
    *   **Storage:** AWS S3 (for images)
    *   **Notifications:** AWS SNS (planned)
*   **Styling:** CSS (Global styles + potentially component-specific later)
*   **Package Manager:** Yarn

## Project Structure

This project uses an Nx monorepo structure:

*   `apps/`: Contains the deployable applications.
    *   `webapp/`: The React web application source code.
    *   `mobileapp/`: The React Native mobile application source code (placeholder structure).
*   `libs/`: Contains reusable libraries.
    *   `cdk-infra/`: AWS CDK code defining the backend infrastructure.
        *   `bin/`: CDK application entry point.
        *   `lib/`: CDK stack definitions (e.g., `aio-baby-tracker-stack.ts`).
        *   `lambda-handlers/`: Source code for Lambda functions.
    *   `shared-logic/`: (Placeholder) Intended for code shared between web and mobile apps (e.g., types, validation logic).

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url> aio-baby-tracker
    cd aio-baby-tracker
    ```
2.  **Install dependencies:**
    ```bash
    yarn install
    ```
3.  **Configure AWS Credentials:** Ensure your AWS CLI is configured with appropriate permissions for CDK deployment. You can typically set this up using:
    ```bash
    aws configure
    ```
    (Follow the prompts to enter your Access Key ID, Secret Access Key, default region, and output format).
4.  **Bootstrap CDK (if first time):** If this is your first time using AWS CDK in the target account and region, bootstrap the environment:
    ```bash
    yarn cdk:deploy # This will prompt for bootstrap if needed, or use 'npx aws-cdk bootstrap' directly in libs/cdk-infra
    ```

## Available Scripts

The following scripts are available in the root `package.json`:

*   `yarn start` or `yarn start:web`: Serves the web application for development (`nx serve webapp`).
*   `yarn build:web`: Builds the web application for production (`nx build webapp`).
*   `yarn start:mobile:ios`: Runs the mobile app on the iOS simulator (requires setup) (`nx run mobileapp:run-ios`).
*   `yarn start:mobile:android`: Runs the mobile app on an Android emulator/device (requires setup) (`nx run mobileapp:run-android`).
*   `yarn cdk:synth`: Synthesizes the CloudFormation template from the CDK code (`cd libs/cdk-infra && npx cdk synth`).
*   `yarn cdk:deploy`: Deploys the CDK stack to your configured AWS account/region (`cd libs/cdk-infra && npx cdk deploy`).
*   `yarn cdk:diff`: Compares the deployed stack with the current CDK code (`cd libs/cdk-infra && npx cdk diff`).
*   `yarn lint`: Runs ESLint on all projects (`nx run-many --target=lint`).
*   `yarn test`: Runs tests (Vitest) on all projects (`nx run-many --target=test`).
*   `yarn graph`: Opens the Nx project dependency graph viewer (`nx graph`).

## Development Workflow

1.  **Run Web App:**
    ```bash
    yarn start:web
    ```
    This will start the Vite development server, typically on `http://localhost:4200` or `http://localhost:5173`.
2.  **Development Auth Bypass:** To skip the Amplify login screen for easier UI development:
    *   Create a `.env.local` file in the project root.
    *   Add the line `VITE_DEV_SKIP_AUTH=true`.
    *   Restart the development server.
    *(Remove the line or set to `false` to re-enable authentication)*.
3.  **Deploy Backend:**
    *   Ensure AWS credentials are configured.
    *   Run `yarn cdk:deploy`. This will create/update the AWS resources (Cognito, DynamoDB, etc.).
    *   After deployment, copy the outputs (UserPoolId, UserPoolClientId, ApiEndpoint) from the terminal into the `apps/webapp/src/amplifyconfiguration.json` file, replacing the `PLACEHOLDER_` values.
    *   Restart the web app server if it was running.
4.  **Mobile Development:** (Requires React Native development environment setup - see React Native documentation)
    *   Run `yarn start:mobile:ios` or `yarn start:mobile:android`.

## Current Status

*   **Phase 0 (Setup & Foundation):** Complete.
*   **Phase 1 (Baby Profile & Pregnancy Core):** UI Placeholders Complete. Backend logic pending.
*   **Phase 2 (Post-Birth Trackers):** UI Placeholders Complete. Backend logic pending.
*   **Phase 3 (Notes & Reports):** UI Placeholders Complete. Backend logic pending.
*   **Phase 4 (CI/CD & Refinement):** Not started.

## MCP Server Information

This project may interact with Model Context Protocol (MCP) servers to extend its capabilities (e.g., for browser automation, external API access). Connected servers are configured in the Cline settings file:

*   **macOS:** `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Connected Servers

*   **`github.com/AgentDeskAI/browser-tools-mcp`**
    *   **Purpose:** Provides tools for browser interaction and auditing (e.g., getting logs, taking screenshots, running audits).
    *   **Start Commands (for debugging/manual start):**
        ```bash
        # To start the server executable (likely the correct one):
        yarn mcp:start:browser-tools-server
        # (Runs: npx @agentdeskai/browser-tools-server@latest)

        # To start the MCP package (if different from server):
        yarn mcp:start:browser-tools-mcp
        # (Runs: npx @agentdeskai/browser-tools-mcp@latest)
        ```
    *   **Note:** The correct package to execute might depend on the specific version or setup. Start with `browser-tools-server`.
    *   **Configuration:** See https://github.com/AgentDeskAI/browser-tools-mcp.

