#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ReferenceAppStack } from '../lib/reference-app-stack';

const app = new cdk.App();
new ReferenceAppStack(app, 'ReferenceAppStack');
