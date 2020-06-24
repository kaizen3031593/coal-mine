#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ReferenceAppStack } from '../lib/reference-app-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
const lambdaStack = new ReferenceAppStack(app, 'LambdaStack');
new PipelineStack(app, 'PipelineStack', {
    lambdaCode1: lambdaStack.lambdaCode1,
});

app.synth();