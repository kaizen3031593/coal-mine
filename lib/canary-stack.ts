import * as cdk from '@aws-cdk/core';
import { CfnCanary } from '@aws-cdk/aws-synthetics';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

export class CanaryStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'Role', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
          });
        
        role.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                's3:PutObject', 
                's3:GetBucketLocation', 
                's3:ListAllMyBuckets',
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents' 
            ]
        }));

        const bucket = new s3.Bucket(this, 'bucket');

        const lambdaBucket = new s3.Bucket(this, 'lambdacanarybucket');

        new s3Deployment.BucketDeployment(this, 'Deployment', {
          sources: [s3Deployment.Source.asset('./lambda')],
          destinationBucket: lambdaBucket,
        });

        const canary = new CfnCanary(this, 'test-lambda-canary', {
          artifactS3Location: bucket.s3UrlForObject(),
          code: {
              handler: 'index.handler',
              s3Bucket: lambdaBucket.bucketName,
              s3Key: 'index.js',
          },
          executionRoleArn: role.roleArn,
          name: 'testlambdacanary',
          runConfig: { timeoutInSeconds: 60},
          runtimeVersion: 'syn-1.0',
          schedule: { durationInSeconds: '3600', expression: 'rate(1 minute)'},
          startCanaryAfterCreation: true,
          failureRetentionPeriod: 10,
          successRetentionPeriod: 10,
      });

        const canaryMetric = new cloudwatch.Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'SuccessPercent',
            statistic: 'avg',
            period: cdk.Duration.minutes(5),
        }).attachTo(canary);

        new cloudwatch.Alarm(this, 'CanaryAlarm1', {
            metric: canaryMetric,
            threshold: 99,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            evaluationPeriods: 2,
            alarmName: 'CanaryAlarm1',
        })
    }
}