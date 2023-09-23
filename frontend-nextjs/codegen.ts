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
	}
};

export default config;
