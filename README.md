# Welcome to the Coal Mine!

This is the reference app for AWS Cloudwatch Canaries. It is called the coal mine as a reference to how the resource was named a 'canary.'

## How to use:

First, clone and download this github repository. In your downloaded github repository, you must change the configuration for `sourceAction` to match your github credentials. Make sure you change `owner` and `oauthToken`.

For the `oauthToken`, you may have to manually create a new token and add it to secretsmanager.

Next, run these commands in the terminal:

```
$ npm install -g aws-cdk
$ cdk deploy PipelineStack
```

This will deploy the CI/CD pipeline that in turns builds and deploys `LambdaStack`.

Make sure you have the right AWS credentials to allow the app to deploy to cloudformation.

From here, any time you change `LambdaStack` you can commit and push your changes to Github and the Pipeline will automatically run.

## API endpoints:

The result of the pipeline is an API endpoint mapped to a lambda backend.

The endpoint takes in two query parameters: `name` and `food`. You can hit the api like this:

```
https://<domain_name>.amazonaws.com/prod/?name=popeye&food=spinach
```

You should receive a greeting as a response.

## Canary: 

Part of the Pipeline is a stage that involves a canary. Currently canaries are not supported actions in code pipeline, so the canary is just a lambda that hits the api endpoint. 

