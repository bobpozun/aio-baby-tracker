import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // Import NodejsFunction
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'; // Reverted to wildcard import
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class AioBabyTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Cognito User Pool ---
    const userPool = new cognito.UserPool(this, 'AioUserPool', {
      userPoolName: 'aio-baby-tracker-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Or DESTROY for non-production
    });

    // --- Cognito User Pool Client ---
    const userPoolClient = new cognito.UserPoolClient(
      this,
      'AioUserPoolClient',
      {
        userPool: userPool,
        userPoolClientName: 'aio-webapp-client',
        // Standard settings for a web app client:
        authFlows: {
          userSrp: true, // Secure Remote Password protocol
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        // Add other configurations like OAuth scopes if needed later
      }
    );

    // --- DynamoDB Tables ---
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'aio-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING }, // Cognito Sub
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
    });

    const babiesTable = new dynamodb.Table(this, 'BabiesTable', {
      tableName: 'aio-babies',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'babyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
    });

    const trackerEntriesTable = new dynamodb.Table(
      this,
      'TrackerEntriesTable',
      {
        tableName: 'aio-tracker-entries',
        partitionKey: { name: 'babyId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'entryId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
        // Consider adding Global Secondary Indexes (GSIs) later
      }
    );

    // New table for checklist item status
    const checklistStatusTable = new dynamodb.Table(
      this,
      'ChecklistStatusTable',
      {
        tableName: 'aio-checklist-status',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING }, // User ID from Cognito
        sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING }, // Checklist item ID (c1, c2, etc. or custom ID)
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
      }
    );

    // --- S3 Bucket ---
    // NOTE: Bucket names must be globally unique. Adjust if needed.
    const assetsBucket = new s3.Bucket(this, 'AioAssetsBucket', {
      bucketName: `aio-baby-tracker-assets`, // Fixed name
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
      // Consider adding lifecycle rules later
    });

    // --- S3 Bucket for Frontend Hosting ---
    // NOTE: Bucket names must be globally unique. Adjust if needed.
    const hostingBucket = new s3.Bucket(this, 'AioWebAppHostingBucket', {
      bucketName: `aio-baby-tracker-webapp-hosting`, // Fixed name
      publicReadAccess: false, // Access will be granted via CloudFront OAC/OAI
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // websiteIndexDocument and websiteErrorDocument are not needed when serving via CloudFront
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete bucket on stack removal
      autoDeleteObjects: true, // Automatically delete objects in bucket on stack removal
    });

    // --- CloudFront Origin Access Control (OAC) ---
    // OAC is implicitly configured by CDK when using S3Origin without specifying an OAI.
    // The explicit OAI and Bucket Policy are no longer needed.

    // --- CloudFront Distribution ---
    const distribution = new cloudfront.Distribution(
      this,
      'AioWebAppDistribution',
      {
        defaultBehavior: {
          // Reverting to deprecated S3Origin as a workaround for TS2511 error
          origin: new origins.S3Origin(hostingBucket, { originPath: '/' }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, // Re-enable default caching
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        defaultRootObject: 'index.html',
        // Price class can be adjusted (e.g., PRICE_CLASS_100 for US/EU only)
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        // Add custom domain configuration later if needed
        errorResponses: [
          // Handle SPA routing for 403/404 errors
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(0),
          },
        ],
      }
    );

    // --- S3 Bucket Deployment ---
    // Uploads the built webapp assets to the hosting bucket
    new s3deploy.BucketDeployment(this, 'DeployAioWebApp', {
      // Correct path relative to this file (libs/cdk-infra/lib/): ../../../dist/apps/webapp
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, '../../../dist/apps/webapp')
        ),
      ],
      destinationBucket: hostingBucket,
      distribution: distribution, // Invalidate CloudFront cache on deployment
      distributionPaths: ['/*'], // Invalidate everything
    });

    // --- Lambda Function (using NodejsFunction for automatic bundling) ---
    const apiLambda = new NodejsFunction(this, 'ApiLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      // entry points to the handler file relative to the CDK stack file
      entry: path.join(__dirname, '../lambda-handlers/api/index.ts'),
      handler: 'handler', // Default handler function name is 'handler'
      environment: {
        USERS_TABLE_NAME: usersTable.tableName, // Still needed? Maybe remove if not used directly by API
        BABIES_TABLE_NAME: babiesTable.tableName, // Used for profiles
        TRACKER_ENTRIES_TABLE_NAME: trackerEntriesTable.tableName,
        CHECKLIST_STATUS_TABLE_NAME: checklistStatusTable.tableName, // Add new table name
      },
      // Add memorySize, timeout etc. if needed
    });

    // Grant Lambda permissions
    usersTable.grantReadWriteData(apiLambda); // Keep or remove based on final logic
    babiesTable.grantReadWriteData(apiLambda); // Needed for profiles
    trackerEntriesTable.grantReadWriteData(apiLambda); // Needed for tracker entries
    checklistStatusTable.grantReadWriteData(apiLambda); // Grant permissions for checklist status table
    // Grant S3 permissions later if needed for uploads via Lambda

    // --- API Gateway ---
    // Define Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'AioCognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
      }
    );

    const api = new apigateway.LambdaRestApi(this, 'AioApiGateway', {
      handler: apiLambda,
      proxy: false, // Set proxy to false to define specific integrations/authorizers
      defaultCorsPreflightOptions: {
        // Explicitly allow the CloudFront distribution domain
        allowOrigins: [`https://${distribution.distributionDomainName}`],
        allowMethods: apigateway.Cors.ALL_METHODS, // Keep broad for now
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS.concat(['Authorization']),
      },
      // Set default authorizer for all methods (can be overridden per method)
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: authorizer,
      },
      // Add deploy options to configure the stage, including throttling
      deployOptions: {
        stageName: 'prod', // Explicitly set stage name
        throttlingRateLimit: 10, // Max 10 requests per second
        throttlingBurstLimit: 20, // Allow bursts up to 20 concurrent requests
        // Optional: Add logging, caching, etc. here if needed
        // loggingLevel: apigateway.MethodLoggingLevel.INFO,
        // dataTraceEnabled: true,
      },
    });

    // Define API resources and methods explicitly since proxy is false
    // This allows applying the authorizer correctly.

    // /profiles
    const profilesResource = api.root.addResource('profiles');
    profilesResource.addMethod('GET'); // Uses default authorizer
    profilesResource.addMethod('POST'); // Uses default authorizer

    // /profiles/{profileId}
    const profileIdResource = profilesResource.addResource('{profileId}');
    profileIdResource.addMethod('PUT'); // Uses default authorizer
    profileIdResource.addMethod('DELETE'); // Uses default authorizer

    // /profiles/{profileId}/trackers/{trackerType}
    const trackersResource = profileIdResource.addResource('trackers');
    const trackerTypeResource = trackersResource.addResource('{trackerType}');
    trackerTypeResource.addMethod('GET'); // Uses default authorizer
    trackerTypeResource.addMethod('POST'); // Uses default authorizer
    // TODO: Add PUT/DELETE for tracker entries later if needed

    // /checklist/status
    const checklistResource = api.root.addResource('checklist');
    const checklistStatusResource = checklistResource.addResource('status');
    checklistStatusResource.addMethod('GET'); // Uses default authorizer

    // /checklist/status/{itemId}
    const checklistItemIdResource =
      checklistStatusResource.addResource('{itemId}');
    checklistItemIdResource.addMethod('PUT'); // Uses default authorizer

    // TODO: Add routes for custom checklist items if implementing that feature

    // --- SNS Topic ---
    const notificationsTopic = new sns.Topic(this, 'AioNotificationsTopic', {
      displayName: 'AIO Baby Tracker Notifications',
      topicName: 'aio-baby-tracker-notifications',
    });
    // Subscriptions to be added later

    // --- Outputs ---
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for Web App',
    });
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB Table Name',
    });
    new cdk.CfnOutput(this, 'BabiesTableName', {
      value: babiesTable.tableName,
      description: 'Babies DynamoDB Table Name',
    });
    new cdk.CfnOutput(this, 'TrackerEntriesTableName', {
      value: trackerEntriesTable.tableName,
      description: 'Tracker Entries DynamoDB Table Name',
    });
    new cdk.CfnOutput(this, 'ChecklistStatusTableName', {
      value: checklistStatusTable.tableName,
      description: 'Checklist Status DynamoDB Table Name',
    });
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 Bucket Name for Assets',
    });
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint URL',
    });
    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: notificationsTopic.topicArn,
      description: 'SNS Topic ARN for Notifications',
    });
    new cdk.CfnOutput(this, 'WebAppHostingBucketName', {
      value: hostingBucket.bucketName,
      description: 'S3 Bucket Name for Web App Hosting',
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Domain Name (Web App URL)',
    });
  }
}
