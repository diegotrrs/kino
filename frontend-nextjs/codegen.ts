import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: '../backend-fastapi/src/graphql/schema.graphql',
	documents: ['src/**/*.gql'],
	generates: {
		'src/lib/graphql/generated.ts': {
			plugins: [
        'typescript',
        'typescript-operations',
				'typescript-graphql-request',
				
      ],
			config: {
				avoidOptionals: true
			},
		}
	},
	hooks: {
		// This is a temporary fix for this known bug https://github.com/dotansimha/graphql-code-generator/issues/9046 for the typescript-graphql-request plugin.		
    afterOneFileWrite: ["sed -i '' -e '1s|.*|import type { GraphQLClient, RequestOptions } from \"graphql-request\";|' -e '2s|.*|type GraphQLClientRequestHeaders = RequestOptions[\"requestHeaders\"];|' src/lib/graphql/generated.ts"]
	},	  
};

export default config;
