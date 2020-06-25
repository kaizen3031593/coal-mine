import * as lambda from '@aws-cdk/aws-lambda';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { CfnCanary } from '@aws-cdk/aws-synthetics';
import * as iam from '@aws-cdk/aws-iam';

export interface PipelineStackProps extends cdk.StackProps {
    readonly lambdaCode1: lambda.CfnParametersCode;
    //readonly lambdaCode2: lambda.CfnParametersCode;
}

export class PipelineStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: PipelineStackProps){
        super(app, id, props);

        // Stage: Source
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'Github_Source',
            owner: 'kaizen3031593',
            repo: 'coal-mine',
            oauthToken: cdk.SecretValue.secretsManager('GithubToken'),
            output: sourceOutput,
            branch: 'master',
            trigger: codepipeline_actions.GitHubTrigger.POLL,
        });

        // Stage: BuildLambda
        const lambdaBuild = new codebuild.PipelineProject(this, 'LambdaBuild', {
            buildSpec: codebuild.BuildSpec.fromObject({
              version: '0.2',
              phases: {
                install: {
                  commands: [
                    'cd lambda',
                    'npm install',
                  ],
                },
                build: {
                  commands: 'npm run build',
                },
              },
              artifacts: {
                'base-directory': 'lambda',
                files: [
                  'hello.js',
                  'node_modules/**/*',
                ],
              },
            }),
            environment: {
              buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
            },
          });

          const lambdaOutput = new codepipeline.Artifact();
          const buildLambdaAction = new codepipeline_actions.CodeBuildAction({
              actionName: 'Lambda_Build',
              input: sourceOutput,
              outputs: [lambdaOutput],
              project: lambdaBuild,
          });

        // Stage: BuildCDK
        const project = new codebuild.PipelineProject(this, 'ProjectBuild', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: [
                            'npm install -g aws-cdk',
                            'npm install',
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                            'npm run cdk synth',
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: [
                      'LambdaStack.template.json',
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
            },
        });
      
        const projectBuildOutput = new codepipeline.Artifact();
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Project_Build',
            input: sourceOutput,
            outputs: [projectBuildOutput],
            project: project,
        });
        
        // Stage: Deploy
        const deployAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
            actionName: 'CFN_Deploy',
            adminPermissions: true,
            stackName: 'LambdaDeployStack',
            templatePath: projectBuildOutput.atPath('LambdaStack.template.json'),   
            parameterOverrides: {
                ...props.lambdaCode1.assign(lambdaOutput.s3Location),
            },
            extraInputs: [lambdaOutput], 
        });

        // Stage: Canary
        // const role = new iam.Role(this, 'Role', {
        //     assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        //   });
        
        // role.addToPolicy(new iam.PolicyStatement({
        //     resources: ['*'],
        //     actions: [
        //         's3:PutObject', 
        //         's3:GetBucketLocation', 
        //         's3:ListAllMyBuckets',
        //         'cloudwatch:PutMetricData',
        //         'logs:CreateLogGroup',
        //         'logs:CreateLogStream',
        //         'logs:PutLogEvents' 
        //     ]
        // }));

        // const canary = new CfnCanary(this, 'test-lambda-canary', {
        //     artifactS3Location: 's3://aws-canaries-myresultsbucket123a51fbf1f-1969sgwunxy1z',
        //     code: {
        //         handler: 'index.handler',
        //         script: `var synthetics = require('Synthetics');
        //         const log = require('SyntheticsLogger');
        //         const https = require('https');
        //         const http = require('http');
                
        //         const apiCanaryBlueprint = async function () {
        //             const postData = "";
                
        //             const verifyRequest = async function (requestOption) {
        //               return new Promise((resolve, reject) => {
        //                 log.info("Making request with options: " + JSON.stringify(requestOption));
        //                 let req
        //                 if (requestOption.port === 443) {
        //                   req = https.request(requestOption);
        //                 } else {
        //                   req = http.request(requestOption);
        //                 }
        //                 req.on('response', (res) => {
        //                   log.info(\`Status Code: \${res.statusCode}\`)
        //                   log.info(\`Response Headers: \${JSON.stringify(res.headers)}\`)
        //                   if (res.statusCode !== 200) {
        //                      reject("Failed: " + requestOption.path);
        //                   }
        //                   res.on('data', (d) => {
        //                     log.info("Response: " + d);
        //                   });
        //                   res.on('end', () => {
        //                     resolve();
        //                   })
        //                 });
                
        //                 req.on('error', (error) => {
        //                   reject(error);
        //                 });
                
        //                 if (postData) {
        //                   req.write(postData);
        //                 }
        //                 req.end();
        //               });
        //             }
                
        //             const headers = {}
        //             headers['User-Agent'] = [synthetics.getCanaryUserAgentString(), headers['User-Agent']].join(' ');
        //             const requestOptions = {"hostname":"ajt66lp5wj.execute-api.us-east-1.amazonaws.com","method":"GET","path":"/prod/","port":443}
        //             requestOptions['headers'] = headers;
        //             await verifyRequest(requestOptions);
        //         };
                
        //         exports.handler = async () => {
        //             return await apiCanaryBlueprint();
        //         };`},
        
        //     executionRoleArn: role.roleArn,
        //     name: 'testlambdacanary',
        //     runConfig: { timeoutInSeconds: 60},
        //     runtimeVersion: 'syn-1.0',
        //     schedule: { durationInSeconds: '3600', expression: 'rate(1 minute)'},
        //     startCanaryAfterCreation: true,
        // });

        const canaryLambda = new lambda.Function(this, 'canaryLambda',{
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
            const https = require('https');
            const http = require('http');
            
            const apiCanaryBlueprint = async function () {
                const postData = "";
            
                const verifyRequest = async function (requestOption) {
                  return new Promise((resolve, reject) => {
                    let req
                    if (requestOption.port === 443) {
                      req = https.request(requestOption);
                    } else {
                      req = http.request(requestOption);
                    }
                    req.on('response', (res) => {
                      if (res.statusCode !== 200) {
                         reject("Failed: " + requestOption.path);
                      }
                      res.on('data', (d) => {
                        console.log("Response: " + d);
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
                headers['User-Agent'] = [headers['User-Agent']].join(' ');
                const requestOptions = {"hostname":"ajt66lp5wj.execute-api.us-east-1.amazonaws.com","method":"GET","path":"/prod/?name=bobby&food=pizza","port":443}
                requestOptions['headers'] = headers;
                await verifyRequest(requestOptions);
            };
            
            exports.handler = async () => {
                return await apiCanaryBlueprint();
            };`),
        });

        const canaryAction = new codepipeline_actions.LambdaInvokeAction({
            actionName: 'Lambda',
            lambda: canaryLambda,
        });

        // Create a pipeline with 4 stages
        const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
            stages: [
                {
                stageName: 'Source',
                actions: [sourceAction],
                },
                {
                stageName: 'BuildLambda',
                actions: [buildLambdaAction],
                },
                {
                stageName: 'BuildCDK',
                actions: [buildAction],
                },
                {
                stageName: 'Deploy',
                actions: [deployAction],
                },
                {
                stageName: 'Test',
                actions: [canaryAction],
                },
            ],
        });
    }
}


