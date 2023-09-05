import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as appsync from '@aws-cdk/aws-appsync-alpha'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'

import * as ec2 from 'aws-cdk-lib/aws-ec2';


const createAppSyncSchema = (scope: Construct) => {
  const api = new appsync.GraphqlApi(scope, 'Api', {
    name: 'cdk-notes-appsync-api',
    schema: appsync.Schema.fromAsset('../graphql/schema/notes.graphql'),
    authorizationConfig: {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.API_KEY,
        apiKeyConfig: {
          expires: cdk.Expiration.after(cdk.Duration.days(365))
        }
      },
    },
    xrayEnabled: true,
  });
  return { api }
}

const createLambda = (scope: Construct) => {
  // lib/appsync-cdk-app-stack.ts
  const notesLambda = new lambda.Function(scope, 'AppSyncNotesHandler', {
    runtime: lambda.Runtime.NODEJS_16_X,
    handler: 'main.handler',
    code: lambda.Code.fromAsset('lambda-fns'),
    memorySize: 1024
  });
  

  return { notesLambda }
}

export class KinoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { api }  = createAppSyncSchema(this)

    const { notesLambda } = createLambda(this)

    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', notesLambda);

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getNoteById"
    })
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listNotes"
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createNote"
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteNote"
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateNote"
    })

    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    })

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(notesLambda)

    // Create an environment variable that we will use in the function code
    notesLambda.addEnvironment('NOTES_TABLE', notesTable.tableName);

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", { value: api.graphqlUrl });
 
     // Prints out the AppSync GraphQL API key to the terminal
     new cdk.CfnOutput(this, "GraphQLAPIKey", { value: api.apiKey || '' });
 
     // Prints out the stack region to the terminal
     new cdk.CfnOutput(this, "Stack Region", { value: this.region });
    
    
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
