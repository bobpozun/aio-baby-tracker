import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class AioBabyTrackerStack extends cdk.Stack {
  public readonly pregnancyGuideImagesBucket: s3.Bucket;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      'AioUserPoolClient',
      {
        userPool: userPool,
        userPoolClientName: 'aio-webapp-client',
        authFlows: {
          userSrp: true,
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
      }
    );

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'aio-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const babiesTable = new dynamodb.Table(this, 'BabiesTable', {
      tableName: 'aio-babies',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'babyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const trackerEntriesTable = new dynamodb.Table(
      this,
      'TrackerEntriesTable',
      {
        tableName: 'aio-tracker-entries',
        partitionKey: { name: 'babyId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'entryId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const checklistStatusTable = new dynamodb.Table(
      this,
      'ChecklistStatusTable',
      {
        tableName: 'aio-checklist-status',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const assetsBucket = new s3.Bucket(this, 'AioAssetsBucket', {
      bucketName: `aio-baby-tracker-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const hostingBucket = new s3.Bucket(this, 'AioWebAppHostingBucket', {
      bucketName: `aio-baby-tracker-webapp-hosting`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const pregnancyGuideImagesBucket = new s3.Bucket(
      this,
      'AioPregnancyGuideImagesBucket',
      {
        bucketName: 'aio-pregnancy-guide-images',
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );
    this.pregnancyGuideImagesBucket = pregnancyGuideImagesBucket;

    // CloudFront OAC for private access to pregnancy guide images
    const imagesOac = new cloudfront.CfnOriginAccessControl(
      this,
      'PregnancyGuideImagesOAC',
      {
        originAccessControlConfig: {
          name: 'PregnancyGuideImagesOAC',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
          description: 'OAC for private S3 access to pregnancy guide images',
        },
      }
    );

    // L1 CfnDistribution for OAC-only CloudFront (no OAI)
    const imagesDistribution = new cloudfront.CfnDistribution(
      this,
      'PregnancyGuideImagesDistributionV3',
      {
        distributionConfig: {
          enabled: true,
          origins: [
            {
              id: 'PregnancyGuideImagesOrigin',
              domainName: pregnancyGuideImagesBucket.bucketRegionalDomainName,
              s3OriginConfig: {}, // No OAI specified
              originAccessControlId: imagesOac.ref,
            },
          ],
          defaultCacheBehavior: {
            targetOriginId: 'PregnancyGuideImagesOrigin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachePolicyId:
              cloudfront.CachePolicy.CACHING_OPTIMIZED.cachePolicyId,
          },
          priceClass: 'PriceClass_100',
          comment: 'CloudFront distribution for pregnancy guide images',
          defaultRootObject: '',
        },
      }
    );

    // Grant CloudFront OAC permission to read from the S3 bucket
    const account = cdk.Stack.of(this).account;
    const distributionArn = `arn:aws:cloudfront::${account}:distribution/${imagesDistribution.ref}`;
    pregnancyGuideImagesBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [pregnancyGuideImagesBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': distributionArn,
          },
        },
        effect: iam.Effect.ALLOW,
      })
    );

    // Output CloudFront domain for UI usage
    new cdk.CfnOutput(this, 'PregnancyGuideImagesCloudFrontDomain', {
      value: imagesDistribution.attrDomainName,
      description: 'CloudFront domain for pregnancy guide images',
    });

    // The bucket remains private; images are only accessible via CloudFront.

    // Removed public bucket policy

    // Use S3Origin (legacy) to avoid abstract class error with S3BucketOrigin.
    const distribution = new cloudfront.Distribution(
      this,
      'AioWebAppDistribution',
      {
        defaultBehavior: {
          origin: new S3Origin(hostingBucket, { originPath: '/' }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        defaultRootObject: 'index.html',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        errorResponses: [
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

    new s3deploy.BucketDeployment(this, 'DeployAioWebApp', {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, '../../../dist/apps/webapp'),
          {
            exclude: [
              '**/*.map',
              '**/*.test.*',
              '**/*.spec.*',
              '**/*.md',
              '**/*.DS_Store',
              '**/*.log',
              '**/*.zip',
              '**/*.tar',
              '**/*.7z',
              '**/*.gz',
              '**/*.mov',
              '**/*.mp4',
              '**/*.avi',
              '**/*.mkv',
              '**/*.webm',
              '**/.*',
              '**/node_modules/**',
              '**/coverage/**',
              '**/dist/**',
              '**/tmp/**',
              '**/logs/**',
              '**/*~',
              '**/*.bak',
              '**/*.swp',
              '**/*.tmp',
              '**/*.large',
            ],
          }
        ),
      ],
      destinationBucket: hostingBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
      memoryLimit: 1536,
    });

    const apiLambda = new NodejsFunction(this, 'ApiLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda-handlers/api/index.ts'),
      handler: 'handler',
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        BABIES_TABLE_NAME: babiesTable.tableName,
        TRACKER_ENTRIES_TABLE_NAME: trackerEntriesTable.tableName,
        CHECKLIST_STATUS_TABLE_NAME: checklistStatusTable.tableName,
      },
    });

    usersTable.grantReadWriteData(apiLambda);
    babiesTable.grantReadWriteData(apiLambda);
    trackerEntriesTable.grantReadWriteData(apiLambda);
    checklistStatusTable.grantReadWriteData(apiLambda);
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'AioCognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
      }
    );

    const api = new apigateway.LambdaRestApi(this, 'AioApiGateway', {
      handler: apiLambda,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS.concat(['Authorization']),
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: authorizer,
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 10,
        throttlingBurstLimit: 20,
      },
    });

    const profilesResource = api.root.addResource('profiles');

    const notesResource = api.root.addResource('notes');
    notesResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    profilesResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });
    profilesResource.addMethod('POST', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    const profileIdResource = profilesResource.addResource('{profileId}');
    profileIdResource.addMethod('PUT', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });
    profileIdResource.addMethod('DELETE', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });
    // Add /profiles/{profileId}/reports as a child resource after profileIdResource is declared
    const reportsResource = profileIdResource.addResource('reports');
    reportsResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
      apiKeyRequired: false,
    });

    const trackersResource = profileIdResource.addResource('trackers');
    const trackerTypeResource = trackersResource.addResource('{trackerType}');
    trackerTypeResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });
    trackerTypeResource.addMethod('POST', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    const trackerEntryIdResource = trackerTypeResource.addResource('{entryId}');
    trackerEntryIdResource.addMethod('DELETE', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    const checklistResource = api.root.addResource('checklist');
    checklistResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });
    checklistResource.addMethod('POST', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    const checklistStatusResource = checklistResource.addResource('status');
    checklistStatusResource.addMethod('GET', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    const checklistItemIdResource =
      checklistStatusResource.addResource('{itemId}');
    checklistItemIdResource.addMethod('PUT', undefined, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: authorizer,
    });

    // TODO: Add routes for custom checklist items if implementing that feature

    const notificationsTopic = new sns.Topic(this, 'AioNotificationsTopic', {
      displayName: 'AIO Baby Tracker Notifications',
      topicName: 'aio-baby-tracker-notifications',
    });
    if (api instanceof apigateway.RestApi) {
      api.addGatewayResponse('Default4xx', {
        type: apigateway.ResponseType.DEFAULT_4XX,
        responseHeaders: {
          'Access-Control-Allow-Origin': "'*'",
          'Access-Control-Allow-Headers':
            "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
          'Access-Control-Allow-Methods': "'OPTIONS,POST,GET,PUT,DELETE'",
        },
      });
      api.addGatewayResponse('Default5xx', {
        type: apigateway.ResponseType.DEFAULT_5XX,
        responseHeaders: {
          'Access-Control-Allow-Origin': "'*'",
          'Access-Control-Allow-Headers':
            "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
          'Access-Control-Allow-Methods': "'OPTIONS,POST,GET,PUT,DELETE'",
        },
      });
    }

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
