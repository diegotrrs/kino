import { GraphQLClient } from 'graphql-request';
import { type GetNoteByIdQuery, getSdk } from './generated';

const GRAPHQL_API_KEY = process.env.GRAPHQL_API_KEY || ""
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "";

const client = new GraphQLClient(GRAPHQL_ENDPOINT, { headers: { 'x-api-key': GRAPHQL_API_KEY } });

const sdk = getSdk(client)

export default {
	getAllNotes: () => sdk.getAllNotes(),
	getNoteById: (noteId: string) => sdk.getNoteById({noteId}),
};
