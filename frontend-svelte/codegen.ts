import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: '../graphql/schema/core.graphql',
	documents: ['src/**/*.gql'],
	generates: {
		'src/lib/graphql/types.ts': {
			plugins: [
        'typescript',
        'typescript-operations'
      ],
		}
	}
};

export default config;
