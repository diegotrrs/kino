import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
//import * as appsync from '@aws-cdk/aws-appsync'

import * as ec2 from 'aws-cdk-lib/aws-ec2';


// const createAppSyncSchema = () => {
//   const api = new appsync.GraphqlApi(this, 'Api', {
//     name: 'cdk-notes-appsync-api',
//     schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
//     authorizationConfig: {
//       defaultAuthorization: {
//         authorizationType: appsync.AuthorizationType.API_KEY,
//         apiKeyConfig: {
//           expires: cdk.Expiration.after(cdk.Duration.days(365))
//         }
//       },
//     },
//     xrayEnabled: true,
//   });
// }

export class KinoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'BackendQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // The code that defines your stack goes here
    // We have created the VPC object from the VPC class
  //   new ec2.Vpc(this, 'mainVPC', {
  //     // This is where you can define how many AZs you want to use
  //     maxAzs: 2,
  //     // This is where you can define the subnet configuration per AZ
  //     subnetConfiguration: [
  //        {
  //          cidrMask: 24,
  //          name: 'public-subnet',
  //          subnetType: ec2.SubnetType.PUBLIC,
  //        }
  //     ]
  //  });
  }
}
