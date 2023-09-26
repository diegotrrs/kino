This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Code generation
The [graphql-codegen](https://the-guild.dev/graphql/codegen) library is used to generate Types and code from the GraphQL schema. The file codegen.ts corresponds to the configuration for this library.

There is a [known issue](https://github.com/dotansimha/graphql-code-generator/issues/9046) for the typescript-graphql-request plugin. That's why there is a task that is executed after the file is generated. Check out the hook section in the codegen.ts file.

## Linting
The rule is ignore for the components under components/chart /* eslint-disable react-hooks/exhaustive-deps */. These specific components were imported from Mosaic and fixing them involved the risk of breaking their functionality. 


## Storybook
https://fakerjs.dev/api/
