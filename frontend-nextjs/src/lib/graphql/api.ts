import { gql, GraphQLClient } from 'graphql-request';
import type { GetNoteByIdQuery, ListNotesQuery } from '../graphql/types';

// Import env variables from vite's context.
const GRAPHQL_API_KEY = process.env.GRAPHQL_API_KEY || ""
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "";

export const DEFAULT_RESULT_LIMIT = 100;

const client = new GraphQLClient(GRAPHQL_ENDPOINT, { headers: { 'x-api-key': GRAPHQL_API_KEY } });

export enum OperationIds {
	ListNotes = 'listNotes',
	GetNoteById = 'getNoteById',
}

export const fetchNotes = (): Promise<ListNotesQuery> => {
	return client.request(
		gql`
			query ListNotes {
				listNotes {
					id
					name
					completed
				}
			}
		`
	);
};

export const fetchNote = (noteId: string): Promise<GetNoteByIdQuery> => {
	return client.request(
		gql`
			query GetNoteById {
				getNoteById(noteId: "${noteId}") {
					id
					name
					completed
				}
			}
		`
	);
};

export const getListNotesQueryOptions = (limit = DEFAULT_RESULT_LIMIT) => {
	return {
		queryKey: [OperationIds.ListNotes, limit],
		queryFn: () => fetchNotes()
	};
};

export const getGetNoteByIdQueryOptions = (noteId: string) => {
	return {
		queryKey: [OperationIds.GetNoteById, noteId],
		queryFn: () => fetchNote(noteId)
	};
};

export const getQueryOptions = <T>(
	queryId: string,
	fn: () => Promise<T>,
	limit = DEFAULT_RESULT_LIMIT
) => {
	return {
		queryKey: [queryId, limit],
		queryFn: () => fn()
	};
};

export const api = {
	getListNotesQueryOptions,
	getQueryOptions,
	getGetNoteByIdQueryOptions,
};
