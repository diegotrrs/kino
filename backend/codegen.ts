import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../graphql/schema/core.graphql",
  generates: {
    "common/generated/types.ts": {
      plugins: [
				"typescript",
				"typescript-operations"
			],      
    },
  },
};

export default config;
