import * as cdk from '@aws-cdk/core';
import { CfnCanary } from '@aws-cdk/aws-synthetics';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
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

        const canary = new CfnCanary(this, 'test-lambda-canary', {
            artifactS3Location: bucket.s3UrlForObject(),
            code: {
                handler: 'index.handler',
                script: `var synthetics = require('Synthetics');
                const log = require('SyntheticsLogger');
                const https = require('https');
                const http = require('http');
                
                const apiCanaryBlueprint = async function () {
                    const postData = "";
                
                    const verifyRequest = async function (requestOption) {
                      return new Promise((resolve, reject) => {
                        log.info("Making request with options: " + JSON.stringify(requestOption));
                        let req
                        if (requestOption.port === 443) {
                          req = https.request(requestOption);
                        } else {
                          req = http.request(requestOption);
                        }
                        req.on('response', (res) => {
                          log.info(\`Status Code: \${res.statusCode}\`)
                          log.info(\`Response Headers: \${JSON.stringify(res.headers)}\`)
                          if (res.statusCode !== 200) {
                             reject("Failed: " + requestOption.path);
                          }
                          res.on('data', (d) => {
                            log.info("Response: " + d);
                          });
                          res.on('end', () => {
                            resolve();
                          })
                        });
                
                        req.on('error', (error) => {
                          reject(error);
                        });
                
                        if (postData) {
                          req.write(postData);
                        }
                        req.end();
                      });
                    }
                
                    const headers = {}
                    headers['User-Agent'] = [synthetics.getCanaryUserAgentString(), headers['User-Agent']].join(' ');
                    const requestOptions = {"hostname":"ajt66lp5wj.execute-api.us-east-1.amazonaws.com","method":"GET","path":"/prod/","port":443}
                    requestOptions['headers'] = headers;
                    await verifyRequest(requestOptions);
                };
                
                exports.handler = async () => {
                    return await apiCanaryBlueprint();
                };`},
            executionRoleArn: role.roleArn,
            name: 'testlambdacanary',
            runConfig: { timeoutInSeconds: 60},
            runtimeVersion: 'syn-1.0',
            schedule: { durationInSeconds: '3600', expression: 'rate(1 minute)'},
            startCanaryAfterCreation: true,
        });

        const canaryMetric = new cloudwatch.Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'Duration',
            statistic: 'avg',
            period: cdk.Duration.minutes(1),
        }).attachTo(canary);

        new cloudwatch.Alarm(this, 'CanaryAlarm1', {
            metric: canaryMetric,
            threshold: 16500,
            evaluationPeriods: 2,
            alarmName: 'CanaryAlarm1',
        })
    }
}