# Welcome to the Coal Mine!

This is the reference app for AWS Cloudwatch Canaries. It is called the coal mine as a reference to how the resource was named a 'canary.'

## How to use:

Download this github repository and follow these steps:

```
$ npm install -g aws-cdk
$ cdk deploy
```

Make sure you have the right AWS credentials to allow the app to deploy to cloudformation.

## API endpoints:

The result of `cdk deploy` are two API endpoints. 

The first endpoint takes in two query parameters: `name` and `food`. You can hit the api like this:

```
https://<domain_name>.amazonaws.com/prod/?name=popeye&food=spinach
```

The second endpoint takes in one query parameter: `word`. Try to guess the magic word!

```
https://<domain_name>.amazonaws.com/prod/?word=magicword
```

