import * as cdk from '@aws-cdk/core';
import { Canary, Code, Runtime } from '@aws-cdk/aws-synthetics';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

export class CanaryL2Stack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const canary = new Canary(this, 'my_test', {
          handler: 'index.handler',
          runtime: Runtime.SYN_1_0,
          canaryName: 'myl2canary',
          code: new Code(`var synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');
          const https = require('https');
          const http = require('http');
          
          const apiCanaryBlueprint = async function () {
              const postData = "";
          
              const verifyRequest = async function (requestOption) {
                return new Promise((resolve, reject) => {
                  log.info("Making request with options: " + JSON.stringify(requestOption));
                  let req
                  if (requestOption.port === 443) {
                    req = https.request(requestOption);
                  } else {
                    req = http.request(requestOption);
                  }
                  req.on('response', (res) => {
                    log.info(\`Status Code: \${res.statusCode}\`)
                    log.info(\`Response Headers: \${JSON.stringify(res.headers)}\`)
                    if (res.statusCode !== 200) {
                       reject("Failed: " + requestOption.path);
                    }
                    res.on('data', (d) => {
                      log.info("Response: " + d);
                    });
                    res.on('end', () => {
                      resolve();
                    })
                  });
          
                  req.on('error', (error) => {
                    reject(error);
                  });
          
                  if (postData) {
                    req.write(postData);
                  }
                  req.end();
                });
              }
          
              const headers = {}
              headers['User-Agent'] = [synthetics.getCanaryUserAgentString(), headers['User-Agent']].join(' ');
              const requestOptions = {"hostname":"ajt66lp5wj.execute-api.us-east-1.amazonaws.com","method":"GET","path":"/prod/","port":443}
              requestOptions['headers'] = headers;
              await verifyRequest(requestOptions);
          };
          
          exports.handler = async () => {
              return await apiCanaryBlueprint();
          };`)
      });

        const canaryMetric = new cloudwatch.Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'Duration',
            statistic: 'avg',
            period: cdk.Duration.minutes(1),
        }).attachTo(canary);

        new cloudwatch.Alarm(this, 'CanaryL2Alarm', {
            metric: canaryMetric,
            threshold: 16500,
            evaluationPeriods: 2,
            alarmName: 'CanaryL2Alarm',
        })
    }
}