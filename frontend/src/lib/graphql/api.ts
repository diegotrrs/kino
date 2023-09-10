import { createQuery } from '@tanstack/svelte-query';
import { gql, GraphQLClient } from 'graphql-request';
import type { ListNotesQuery } from '../graphql/types';

// Import env variables from vite's context.
const GRAPHQL_API_KEY = import.meta.env.VITE_GRAPHQL_API_KEY
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT

const DEFAULT_RESULT_LIMIT = 100

const client = new GraphQLClient(GRAPHQL_ENDPOINT, { headers: { 'x-api-key': GRAPHQL_API_KEY }});

export enum OperationIds {
  ListNotes = 'listNotes'
}

const createListNotesQuery = (limit = DEFAULT_RESULT_LIMIT) =>
	createQuery<ListNotesQuery, Error>({
		queryKey: [OperationIds.ListNotes, limit],
		queryFn: () =>
			client.request(
				gql`query ListNotes {
						listNotes {
							id
							name
							completed
						}
					}`,				
			)
	});

export const api = {
	createListNotesQuery,
}
