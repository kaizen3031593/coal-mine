#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ReferenceAppStack } from '../lib/reference-app-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { CanaryStack } from '../lib/canary-stack';

const app = new cdk.App();
const lambdaStack = new ReferenceAppStack(app, 'LambdaStack');
new PipelineStack(app, 'PipelineStack', {
    lambdaCode1: lambdaStack.lambdaCode1,
});
new CanaryStack(app, 'CanaryStack');

app.synth();