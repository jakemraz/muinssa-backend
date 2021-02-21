import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import {Runtime} from '@aws-cdk/aws-lambda';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';

export class MuinssaBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      const table = new ddb.Table(this, 'Meeting', {
        partitionKey: {
          name: 'Title',
          type: ddb.AttributeType.STRING
        },
        timeToLiveAttribute: 'EndTime'
      })

      const joinFunction = new NodejsFunction(this, 'JoinFunction', {
        entry: path.join(__dirname, './function/meeting.ts'),
        runtime: Runtime.NODEJS_14_X,
        handler: 'join',
        bundling: {
          nodeModules: [
            'amazon-chime-sdk-js'
          ]
        }
      });
      table.grantFullAccess(joinFunction);


      const api = new apigw.RestApi(this, 'MuinssaApi');
      const joinIntegration = new apigw.LambdaIntegration(joinFunction);

      const v1 = api.root.addResource('v1');
      const join = v1.addResource('join');
      const joinPost = join.addMethod('GET', joinIntegration);


  }
}
