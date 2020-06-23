import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';

export class ReferenceAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create two lambda backend functions
    const hello = new lambda.Function(this, 'GreetLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    const discussion = new lambda.Function(this, 'DiscussionLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'discussion.handler',
    });

    // Add API gateways for the two lambda backend functions
    new apigw.LambdaRestApi(this, 'Endpoint', {
      description: 'first endpoint',
      handler: hello,
    });

    new apigw.LambdaRestApi(this, 'Endpoint2', {
      description: 'second endpoint',
      handler: discussion,
    });

    // // Use AWS route53 domain name service to simplify endpoints
    // new route53.PublicHostedZone(this, 'HostedZone', {
    //   zoneName: '',
    // });

    // Follow Github Source Action from code-pipeline-actions README
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

    const project = new codebuild.PipelineProject(this, 'ProjectBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              'npm run build',
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const projectBuildOutput = new codepipeline.Artifact('ProjectBuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Project_Build',
      input: sourceOutput,
      outputs: [projectBuildOutput],
      project: project,
    })

    // Create a pipeline
    new codepipeline.Pipeline(this, 'MyPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
      ],
    });

  }
}
