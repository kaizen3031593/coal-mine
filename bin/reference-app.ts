#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ReferenceAppStack } from '../lib/reference-app-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { CanaryStack } from '../lib/canary-stack';
// import { CanaryL2Stack } from '../lib/canary-l2-stack';

const app = new cdk.App();
const lambdaStack = new ReferenceAppStack(app, 'LambdaStack');
new PipelineStack(app, 'PipelineStack', {
    lambdaCode: lambdaStack.lambdaCode,
});
new CanaryStack(app, 'CanaryStack');
//new CanaryL2Stack(app, 'CanaryL2Stack');
app.synth();