// import * as cdk from '@aws-cdk/core';
// import { Canary, Code, Rate } from '@aws-cdk/aws-synthetics';
// import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

// export class CanaryL2Stack extends cdk.Stack {
//     constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
//         super(scope, id, props);
//         const canary = new Canary(this, 'my_test', {
//           handler: 'index.handler',
//           canaryName: 'myl2canary',
//           code: Code.fromAsset('./lambda'),
//       });

//         const canaryMetric = canary.metricSuccessPercent();

//         canary.createAlarm('CanaryAlarm2',{
//           metric: canaryMetric,
//           evaluationPeriods: 2,
//           threshold: 99,
//           comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
//         });
//     }
// }