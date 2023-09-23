import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: '../backend-fastapi/src/graphql/schema.graphql',
	documents: ['src/**/*.gql'],
	generates: {
		'src/lib/graphql/types.ts': {
			plugins: [
        'typescript',
        'typescript-operations'
      ],
			config: {
				avoidOptionals: true
			},
		}
	}
};

export default config;
