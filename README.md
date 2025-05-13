# AIO Baby Tracker

All-In-One Baby Tracker application for web and mobile, designed to help parents track pregnancy progress and baby milestones, feedings, sleep, diapers, and more.

## Technology Stack

- **Monorepo:** [Nx](https://nx.dev/) (An intelligent build system and monorepo manager that helps organize code, run tasks consistently, and manage dependencies across projects.)
- **Frontend (Web):** React, Vite (Fast build tool & dev server), TypeScript, React Router, AWS Amplify UI
- **Frontend (Mobile):** React Native, TypeScript, AWS Amplify UI (planned)
- **Backend:** AWS CDK (TypeScript) for Infrastructure as Code
  - **Authentication:** AWS Cognito
  - **Database:** AWS DynamoDB
  - **API:** AWS API Gateway + AWS Lambda (Node.js runtime)
  - **Storage:** AWS S3 (for images)
  - **Notifications:** AWS SNS (planned)
- **Styling:** CSS (Global styles + potentially component-specific later)
- **Package Manager:** Yarn

## Project Structure

This project uses an [Nx](https://nx.dev/) monorepo structure, which helps organize the codebase into distinct applications (`apps/`) and reusable libraries (`libs/`). Nx provides tools to manage dependencies and run tasks (like building, testing, serving) across these different parts of the project.

- `apps/`: Contains the deployable applications.
  - `webapp/`: The React web application source code.
  - `mobileapp/`: The React Native mobile application source code (placeholder structure).
- `libs/`: Contains reusable libraries.
  - `cdk-infra/`: AWS CDK code defining the backend infrastructure.
    - `bin/`: CDK application entry point.
    - `lib/`: CDK stack definitions (e.g., `aio-baby-tracker-stack.ts`).
    - `lambda-handlers/`: Source code for Lambda functions.
  - `shared-logic/`: (Placeholder) Intended for code shared between web and mobile apps (e.g., types, validation logic).

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
4.  **Bootstrap CDK (if first time):** If this is your first time using AWS CDK in the target account and region, bootstrap the environment from the project root:
    ```bash
    npx cdk bootstrap
    ```
    Alternatively, the first run of `yarn cdk:deploy` might prompt you to bootstrap.

## Available Scripts

The following scripts are available in the root `package.json`:

- `yarn start` or `yarn start:web`: Serves the web application for development (`nx serve webapp`).
- `yarn build:web`: Builds the web application for production (`nx build webapp`).
- `yarn start:mobile:ios`: Runs the mobile app on the iOS simulator (requires setup) (`nx run mobileapp:run-ios`).
- `yarn start:mobile:android`: Runs the mobile app on an Android emulator/device (requires setup) (`nx run mobileapp:run-android`).
- `yarn cdk:synth`: Synthesizes the CloudFormation template from the CDK code (runs `npx cdk synth` from root).
- `yarn cdk:deploy`: Deploys the CDK stack(s) to your configured AWS account/region (runs `npx cdk deploy --all` from root).
- `yarn cdk:diff`: Compares the deployed stack(s) with the current CDK code (runs `npx cdk diff` from root).
- `yarn lint`: Runs ESLint on all projects (`nx run-many --target=lint`).
- `yarn test`: Runs tests (Vitest) on all projects (`nx run-many --target=test`).
- `yarn format`: Formats all project files using Prettier (`prettier --write .`).
- `yarn graph`: Opens the Nx project dependency graph viewer (`nx graph`).
- `yarn repomix`: Packages the entire repo into one file for passing to an AI model
- `yarn remove-comments`: Removes all comments from code files except those containing TODO, FIXME, or placeholder.
- `yarn generate-demo-data`: Generates a year of demo tracker data for a user with 3 children (see below for setup and usage).
- `yarn upload:pregnancy-guide-images`: Uploads all SVG and PNG images in the `pregnancy-guide-images/` folder to the `aio-pregnancy-guide-images` S3 bucket.

## Generating Demo Data

You can generate a year of demo tracker data for a user (with 3 children of varying ages) using the provided script:

1. **Configure environment variables:**

   - Copy `scripts/.env.example` to `scripts/.env` if you haven't already.
   - Fill in your EMAIL and PASSWORD for the demo user in `scripts/.env`. Optionally, set `API_URL` if you want to override the default backend URL.

2. **Run the script:**

   - Using Yarn:
     ```bash
     yarn generate-demo-data
     ```
   - Or using npx/ts-node directly:
     ```bash
     npx ts-node scripts/generate-demo-data.ts
     ```

   The script will authenticate, create demo child profiles, and generate tracker entries for each child.

---

## Pregnancy Guide Images

To update or upload the playful fruit/veggie images for the Pregnancy Week-by-Week Guide:

1. **Place PNG images** (with transparent backgrounds, 256x256px recommended) in the `pregnancy-guide-images/` folder at the root of the repo. Name them to match the `babyImagePlaceholder` field in `apps/webapp/src/app/data/pregnancyGuideData.json` (e.g., `poppy_seed.png`, `leek.png`, `pumpkin.png`).
2. **Upload images to S3** by running:
   ```bash
   yarn upload:pregnancy-guide-images
   ```
   This will upload all SVG and PNG images in the folder to the `aio-pregnancy-guide-images` S3 bucket.

- The upload script requires AWS credentials with access to S3 in your deployment account/region.
- Images will be publicly readable by default for easy loading in the UI.
- The UI will attempt to load SVG images from S3 for each week in the pregnancy guide. If an SVG is not found, it will fall back to PNG.

**Script location:** `scripts/upload-pregnancy-guide-images.ts`

**Yarn script:** `yarn upload:pregnancy-guide-images`

---

### Pregnancy Guide Images in the UI

- The week-by-week pregnancy guide will now display images directly from S3, using SVGs for the best quality where available.
- To update or add images, simply add your SVG (or PNG) to the `pregnancy-guide-images/` folder and run the upload script again.

---

## Code Formatting

This project uses [Prettier](https://prettier.io/) for consistent code formatting.

- **Configuration:** Rules are defined in `.prettierrc.json` at the project root.
- **VS Code Integration:** The workspace settings in `.vscode/settings.json` configure VS Code to automatically format files on save using the project's Prettier configuration. Ensure you have the [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension installed.
- **Manual Formatting:** You can format the entire project manually by running `yarn format`.

## Development Workflow

1.  **Run Web App:**

    ```bash
    yarn start:web
    ```

    This will start the Vite development server, typically on `http://localhost:4200` or `http://localhost:5173`.

2.  **Mobile Development:** (Requires React Native development environment setup - see React Native documentation)
    - Run `yarn start:mobile:ios` or `yarn start:mobile:android`.

## Deployment

1.  **Prerequisites:**
    - Ensure AWS credentials are configured (`aws configure`).
    - Bootstrap the CDK environment if this is the first deployment to the AWS account/region (`npx cdk bootstrap`).
    - Build the frontend application: `yarn build:web`.
2.  **Deploy Infrastructure & Application:**
    - Run the deployment script from the project root:
      ```bash
      yarn cdk:deploy
      ```
    - This command deploys all CDK stacks, including backend resources (Cognito, DynamoDB, API Gateway, Lambdas) and frontend hosting (likely via Amplify Hosting or S3/CloudFront defined in the CDK).
    - The command might prompt for confirmation for security-related changes.
3.  **Configure Frontend (if needed):**
    - If the CDK deployment doesn't automatically configure the frontend (e.g., via Amplify Hosting environment variables), you might need to manually update `apps/webapp/src/amplifyconfiguration.json` with the outputs from the `yarn cdk:deploy` command (like UserPoolId, ApiEndpoint, etc.). Check the terminal output after deployment for these values.

## Current Status

- **Phase 0 (Setup & Foundation):** Complete.
- **Phase 1 (Baby Profile & Pregnancy Core):** UI Placeholders Complete. Backend logic pending.
- **Phase 2 (Post-Birth Trackers):** UI Placeholders Complete. Backend logic pending.
- **Phase 3 (Notes & Reports):** UI Placeholders Complete. Backend logic pending.
- **Phase 4 (CI/CD & Refinement):** Not started.

## MCP Server Information

This project may interact with Model Context Protocol (MCP) servers to extend its capabilities (e.g., for browser automation, external API access). Connected servers are configured in the Cline settings file:

- **macOS:** `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Connected Servers

- **`github.com/AgentDeskAI/browser-tools-mcp`**

  - **Purpose:** Provides tools for browser interaction and auditing (e.g., getting logs, taking screenshots, running audits).
  - **Start Commands (for debugging/manual start):**

    ```bash
    # To start the server executable (likely the correct one):
    yarn mcp:start:browser-tools-server
    # (Runs: npx @agentdeskai/browser-tools-server@latest)

    # To start the MCP package (if different from server):
    yarn mcp:start:browser-tools-mcp
    # (Runs: npx @agentdeskai/browser-tools-mcp@latest)
    ```

  - **Note:** The correct package to execute might depend on the specific version or setup. Start with `browser-tools-server`.
  - **Configuration:** See https://github.com/AgentDeskAI/browser-tools-mcp.
