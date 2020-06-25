import * as lambda from '@aws-cdk/aws-lambda';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { CfnCanary } from '@aws-cdk/aws-synthetics';
import * as iam from '@aws-cdk/aws-iam';

export interface PipelineStackProps extends cdk.StackProps {
    readonly lambdaCode: lambda.CfnParametersCode;
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
                ...props.lambdaCode.assign(lambdaOutput.s3Location),
            },
            extraInputs: [lambdaOutput], 
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
            ],
        });
    }
}


