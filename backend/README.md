# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `npm run build && cdk diff` compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk destroy`     destroys all of the resources


## Folder structure
Here are some of the important files and what they are used for:

bin/cdk-demo.ts - This is the entry point to your CDK application. This will load/create all the stacks we define under lib/*
lib/cdk-demo-stack.ts - This is where your main CDK application stack is defined. Your resources and its properties can go here.
package.json - This is where you define your project dependencies, as well as some additional information, and build scripts (npm build, npm test, npm watch).
cdk.json - This file tells the toolkit how to run your application and also contains some additional settings and parameters related to CDK and your project.

## References 
https://aws.amazon.com/getting-started/guides/setup-cdk/module-three/
https://aws.amazon.com/blogs/mobile/building-scalable-graphql-apis-on-aws-with-cdk-and-aws-appsync/

