import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
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
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN for production
    });

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

    const trackerEntriesTable = new dynamodb.Table(this, 'TrackerEntriesTable', {
      tableName: 'aio-tracker-entries',
      partitionKey: { name: 'babyId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'entryId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
      // Consider adding Global Secondary Indexes (GSIs) later
    });

    // --- S3 Bucket ---
    const assetsBucket = new s3.Bucket(this, 'AioAssetsBucket', {
      bucketName: `aio-baby-tracker-assets-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Or RETAIN
      // Consider adding lifecycle rules later
    });

    // --- Lambda Function ---
    const apiLambda = new lambda.Function(this, 'ApiLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-handlers/api')),
      handler: 'index.handler',
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        BABIES_TABLE_NAME: babiesTable.tableName,
        TRACKER_ENTRIES_TABLE_NAME: trackerEntriesTable.tableName,
      },
      // Add memorySize, timeout etc. if needed
    });

    // Grant Lambda permissions
    usersTable.grantReadWriteData(apiLambda);
    babiesTable.grantReadWriteData(apiLambda);
    trackerEntriesTable.grantReadWriteData(apiLambda);
    // Grant S3 permissions later if needed for uploads via Lambda

    // --- API Gateway ---
    const api = new apigateway.LambdaRestApi(this, 'AioApiGateway', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS, // TODO: Restrict in production
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS.concat(['Authorization']),
      },
      // Consider adding Cognito Authorizer later
    });

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
    // TODO: Add UserPoolClientId output after creating the client
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

  }
}
