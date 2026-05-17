import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class DevsaathiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── 1. COGNITO ─────────────────────────────────────
    const customMessageFn = new NodejsFunction(this, 'CustomMessageFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../backend/src/handlers/custom-message.ts'),
      timeout: cdk.Duration.seconds(5),
    });

    const userPool = new cognito.UserPool(this, 'DevSaathiUserPool', {
      userPoolName: 'devsaathi-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: { required: true, mutable: true },
      },
      lambdaTriggers: {
        customMessage: customMessageFn,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient('DevSaathiClient', {
      userPoolClientName: 'DevSaathiWebClient',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
    });

    // ─── 2. DYNAMODB (Import existing) ──────────────────
    const table = dynamodb.Table.fromTableName(this, 'MainTable', 'devsaathi-main');

    // ─── 3. S3 BUCKETS (Import existing) ────────────────
    const uploadsBucket = s3.Bucket.fromBucketName(this, 'Uploads', 'devsaathi-uploads-9391-6926-4604');
    const promptsBucket = s3.Bucket.fromBucketName(this, 'Prompts', 'devsaathi-prompts-939169264604');

    // ─── 4. LAMBDA IAM ROLE ─────────────────────────────
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DevSaathiPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:GetItem','dynamodb:PutItem','dynamodb:UpdateItem',
                'dynamodb:DeleteItem','dynamodb:Query','dynamodb:Scan','dynamodb:BatchWriteItem'],
              resources: [table.tableArn, `${table.tableArn}/index/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject','s3:PutObject','s3:DeleteObject','s3:GeneratePresignedUrl'],
              resources: [`${uploadsBucket.bucketArn}/*`, `${promptsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: [
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0',
                'arn:aws:bedrock:*::foundation-model/*',
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['aws-marketplace:ViewSubscriptions'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ─── 5. LAMBDA ENV VARS (shared) ────────────────────
    const lambdaEnv = {
      DYNAMODB_TABLE: table.tableName,
      S3_UPLOADS_BUCKET: uploadsBucket.bucketName,
      S3_PROMPTS_BUCKET: promptsBucket.bucketName,
      BEDROCK_REGION: 'us-east-1',
      NOVA_MODEL_ID: 'amazon.nova-lite-v1:0',
      NODE_ENV: 'production',
    };

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: false },
      environment: lambdaEnv,
    };

    // ─── 6. LAMBDA FUNCTIONS ────────────────────────────
    const tutorFn = new NodejsFunction(this, 'TutorFn', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../backend/src/handlers/tutor.ts'),
      memorySize: 512,
    });

    const codeFn = new NodejsFunction(this, 'CodeFn', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../backend/src/handlers/code.ts'),
      memorySize: 512,
    });

    const docsFn = new NodejsFunction(this, 'DocsFn', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../backend/src/handlers/docs.ts'),
      memorySize: 512,
    });

    const dashboardFn = new NodejsFunction(this, 'DashboardFn', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../backend/src/handlers/dashboard.ts'),
      memorySize: 256,
    });

    const userFn = new NodejsFunction(this, 'UserFn', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../backend/src/handlers/user.ts'),
      memorySize: 256,
    });

    // ─── 7. API GATEWAY ─────────────────────────────────
    const api = new apigateway.RestApi(this, 'API', {
      restApiName: 'devsaathi-api',
      deployOptions: { stageName: 'prod', tracingEnabled: true },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date'],
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Auth', {
      cognitoUserPools: [
        userPool,
        cognito.UserPool.fromUserPoolId(this, 'OldUserPool', 'ap-south-1_xxLzZsRGU')
      ],
      authorizerName: 'CognitoAuthorizer',
    });
    const withAuth = { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO };

    // Helper to add routes
    const addRoute = (path: string, method: string, fn: lambda.Function, auth = true) => {
      const parts = path.split('/').filter(Boolean);
      let resource = api.root;
      parts.forEach(part => {
        resource = resource.getResource(part) || resource.addResource(part);
      });
      resource.addMethod(method, new apigateway.LambdaIntegration(fn), auth ? withAuth : {});
    };

    // TUTOR ROUTES
    addRoute('/explain', 'POST', tutorFn);
    addRoute('/quiz/generate', 'POST', tutorFn);
    addRoute('/quiz/evaluate', 'POST', tutorFn);
    addRoute('/quiz/save', 'POST', tutorFn);
    addRoute('/quiz/history', 'GET', dashboardFn);
    addRoute('/notes/generate', 'POST', tutorFn);
    addRoute('/followup', 'POST', tutorFn);

    // CODE ROUTES
    addRoute('/code/explain', 'POST', codeFn);
    addRoute('/code/debug', 'POST', codeFn);
    addRoute('/code/improve', 'POST', codeFn);

    // DOCS ROUTES
    addRoute('/docs/upload-url', 'POST', docsFn);
    addRoute('/docs/upload', 'POST', docsFn);
    addRoute('/docs/summarize', 'POST', docsFn);
    addRoute('/docs/history', 'GET', docsFn);
    addRoute('/docs/summary/{docId}', 'GET', docsFn);

    // DASHBOARD ROUTES
    addRoute('/dashboard/stats', 'GET', dashboardFn);
    addRoute('/dashboard/activity', 'GET', dashboardFn);
    addRoute('/dashboard/activity-all', 'GET', dashboardFn);
    addRoute('/dashboard/activity-feed', 'GET', dashboardFn);
    addRoute('/dashboard/progress', 'GET', dashboardFn);
    addRoute('/dashboard/recent', 'GET', dashboardFn);
    addRoute('/dashboard/export', 'GET', dashboardFn);

    // NOTES ROUTES
    addRoute('/notes', 'GET', dashboardFn);
    addRoute('/notes', 'POST', dashboardFn);
    addRoute('/notes/{id}', 'GET', dashboardFn);
    addRoute('/notes/{id}', 'PUT', dashboardFn);
    addRoute('/notes/{id}', 'DELETE', dashboardFn);

    // USER ROUTES
    addRoute('/user/profile', 'GET', userFn);
    addRoute('/user/preferences', 'PATCH', userFn);
    addRoute('/user/export', 'GET', userFn);
    addRoute('/user/account', 'DELETE', userFn);

    // ─── 8. CLOUDWATCH ALARMS ───────────────────────────
    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
      alarmName: 'devsaathi-lambda-errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda', metricName: 'Errors',
        statistic: 'Sum', period: cdk.Duration.minutes(5),
      }),
      threshold: 5, evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ─── 9. CDK OUTPUTS ─────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, exportName: 'ApiUrl' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, exportName: 'UserPoolId' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, exportName: 'UserPoolClientId' });
    new cdk.CfnOutput(this, 'UploadsBucketName', { value: uploadsBucket.bucketName });
    new cdk.CfnOutput(this, 'PromptsBucketName', { value: promptsBucket.bucketName });
  }
}
