import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import {Runtime} from '@aws-cdk/aws-lambda';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
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
        entry: path.join(__dirname, './function/meeting.js'),
        runtime: Runtime.NODEJS_14_X,
        handler: 'join',
        bundling: {
          nodeModules: [
            'aws-sdk',
            'uuid'
          ]
        },
        environment: {
          MEETINGS_TABLE_NAME: table.tableName
        },
      });
      joinFunction.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonChimeFullAccess'));
      table.grantFullAccess(joinFunction);
      

      const api = new apigw.RestApi(this, 'MuinssaApi');
      const joinIntegration = new apigw.LambdaIntegration(joinFunction);

      const v1 = api.root.addResource('v1');
      const join = v1.addResource('join');
      const joinPost = join.addMethod('GET', joinIntegration);


      const eventBridgeHandler = new NodejsFunction(this, 'EventBridgeFunction', {
        entry: path.join(__dirname, './function/meeting.js'),
        runtime: Runtime.NODEJS_14_X,
        handler: 'event_bridge_handler'
      });

      const rule = new events.Rule(this, 'rule', {
        eventPattern: {
          source: ['aws.chime'],
          detailType: ['Chime Meeting State Change'],
        },
        targets: [new targets.LambdaFunction(eventBridgeHandler)]
      });

  }
}
