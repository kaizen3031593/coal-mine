import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';

export class ReferenceAppStack extends cdk.Stack {

  public readonly lambdaCode: lambda.CfnParametersCode;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.lambdaCode = lambda.Code.fromCfnParameters();

    // Create lambda backend function
    // function from asset will be added in from Cfn Parameters at later time
    const hello = new lambda.Function(this, 'GreetLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: this.lambdaCode,
      handler: 'hello.handler',
    });

    // Add API gateways for the lambda backend
    new apigw.LambdaRestApi(this, 'Endpoint', {
      description: 'first endpoint',
      handler: hello,
    });

    // // Use AWS route53 domain name service to simplify endpoints
    // new route53.PublicHostedZone(this, 'HostedZone', {
    //   zoneName: '',
    // });
  }
}
