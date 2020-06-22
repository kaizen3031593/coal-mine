import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';

export class ReferenceAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'GreetLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda'),
      handler: 'hello.handler',
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      description: 'endpoint for a greeting',
      handler: hello,
    });

    const discussion = new lambda.Function(this, 'DiscussionLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda'),
      handler: 'discussion.handler',
    });

    new apigw.LambdaRestApi(this, 'Endpoint2', {
      description: 'second endpoint',
      handler: discussion,
    })
  }
}
