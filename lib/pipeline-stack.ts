import * as lambda from '@aws-cdk/aws-lambda';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';


export class PipelineStack extends cdk.Stack {
    constructor(app: cdk.App, id: string){
        super(app, id);

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

        const pipelineStack = cdk.Stack.of(this);

        const projectBuildOutput = new codepipeline.Artifact('ProjectBuildOutput');
        const buildAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'Project_Build',
        input: sourceOutput,
        outputs: [projectBuildOutput],
        project: project,
        });
        
        const prepareChangeSetAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
            actionName: 'Prepare',
            adminPermissions: true,
            stackName: 'prepareChangeSet',
            templatePath: projectBuildOutput.atPath(this.templateFile),
            
        });

        // const executeChangeSetAction = new codepipeline_actions.CloudFormationExecuteChangeSetAction({
        //     actionName: 'Deploy',
        //     stackName: 'executeChangeSet',
        //     changeSetName: 'pipelineChangeSet',
        // });

        // Create a pipeline
        const pipeline = new codepipeline.Pipeline(this, 'MyPipeline');
        // const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
        //     stages: [
        //         {
        //             stageName: 'Source',
        //             actions: [sourceAction],
        //         },
        //         {
        //             stageName: 'Build',
        //             actions: [buildAction],
        //         },
        //         {
        //             stageName: 'PreparePipeline',
        //             actions: [prepareChangeSetAction],
        //         },
        //         // {
        //         //     stageName: 'ExecutePipeline',
        //         //     actions: [executeChangeSetAction],
        //         // }
        //     ],
        // });

        pipeline.artifactBucket.grantRead(prepareChangeSetAction.deploymentRole);

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
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
            },
            encryptionKey: pipeline.artifactBucket.encryptionKey,
        });

        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction],
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction],
        });
        pipeline.addStage({
            stageName: 'Deploy',
            actions: [prepareChangeSetAction],
        })
    }
}


