import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as appsync from '@aws-cdk/aws-appsync-alpha'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'

const createAppSyncSchema = (scope: Construct) => {
  const api = new appsync.GraphqlApi(scope, 'Api', {
    name: 'cdk-kino-appsync-api',
    schema: appsync.Schema.fromAsset('../graphql/schema/core.graphql'),
    authorizationConfig: {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.API_KEY,
        apiKeyConfig: {
          expires: cdk.Expiration.after(cdk.Duration.days(365)),
        },
      },
    },
    xrayEnabled: true,
  })

  return { api }
}

export const defaultNodeJsFunctionProps: NodejsFunctionProps = {
  memorySize: 1024,
  timeout: cdk.Duration.seconds(5),
  environment: {
    NODE_OPTIONS: '--enable-source-maps',
  },
  bundling: {
    minify: false,
    sourceMap: true,
    externalModules: [
      'aws-sdk',
      'node:tls',
      'node:buffer',
      'node:http',
      'node:https',
      'node:stream',
      'node:url',
      'node:events',
      'node:process',
      'node:util',
      'node:net',      
    ],
  },
}
const createLambda = (scope: Construct) => {
  const appSyncKinoHandlerLambda = new NodejsFunction(scope, 'AppSyncKinoHandler', {
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: 'src/lambdas/main.ts',
    handler: 'handler',
    bundling: {
      // Exclude the following modules
      externalModules: [
        'aws-sdk',
      ],
    },
  })
  
  return { appSyncKinoHandlerLambda }
}

export class KinoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const { api }  = createAppSyncSchema(this)

    const { appSyncKinoHandlerLambda } = createLambda(this)

    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', appSyncKinoHandlerLambda)

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getNoteById",
    })
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listNotes",
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createNote",
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteNote",
    })
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateNote",
    })

    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    })

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(appSyncKinoHandlerLambda)

    // Create an environment variable that we will use in the function code
    appSyncKinoHandlerLambda.addEnvironment('NOTES_TABLE', notesTable.tableName)

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", { value: api.graphqlUrl })
 
    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", { value: api.apiKey || '' })
 
    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "Stack Region", { value: this.region })
  }
}
