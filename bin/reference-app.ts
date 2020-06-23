#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ReferenceAppStack } from '../lib/reference-app-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new ReferenceAppStack(app, 'ReferenceAppStack');
new PipelineStack(app, 'PipelineAppStack');