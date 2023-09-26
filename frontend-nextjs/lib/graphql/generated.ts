import type { GraphQLClient, RequestOptions } from "graphql-request";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Calendar = {
  __typename?: 'Calendar';
  category: Scalars['String']['output'];
  content: Maybe<Scalars['String']['output']>;
  dates: CalendarDateRange;
  id: Scalars['ID']['output'];
  link: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type CalendarDateRange = {
  __typename?: 'CalendarDateRange';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
};

export type CreateNoteInput = {
  completed: Scalars['Boolean']['input'];
  id: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createNote: Maybe<Note>;
  deleteNote: Maybe<Scalars['String']['output']>;
  updateNote: Maybe<Note>;
};


export type MutationCreateNoteArgs = {
  input: CreateNoteInput;
};


export type MutationDeleteNoteArgs = {
  noteId: Scalars['String']['input'];
};


export type MutationUpdateNoteArgs = {
  input: UpdateNoteInput;
};

export type Note = {
  __typename?: 'Note';
  completed: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  getAllNotes: Maybe<Array<Maybe<Note>>>;
  getNoteById: Maybe<Note>;
  users: Maybe<Scalars['String']['output']>;
};


export type QueryGetNoteByIdArgs = {
  noteId: Scalars['String']['input'];
};

export type UpdateNoteInput = {
  completed: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name: InputMaybe<Scalars['String']['input']>;
};

export type GetAllNotesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllNotesQuery = { __typename?: 'Query', getAllNotes: Array<{ __typename?: 'Note', id: string, name: string, completed: boolean } | null> | null };

export type GetNoteByIdQueryVariables = Exact<{
  noteId: Scalars['String']['input'];
}>;


export type GetNoteByIdQuery = { __typename?: 'Query', getNoteById: { __typename?: 'Note', id: string, name: string, completed: boolean } | null };


export const GetAllNotesDocument = gql`
    query getAllNotes {
  getAllNotes {
    id
    name
    completed
  }
}
    `;
export const GetNoteByIdDocument = gql`
    query getNoteById($noteId: String!) {
  getNoteById(noteId: $noteId) {
    id
    name
    completed
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getAllNotes(variables?: GetAllNotesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetAllNotesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAllNotesQuery>(GetAllNotesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getAllNotes', 'query');
    },
    getNoteById(variables: GetNoteByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetNoteByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNoteByIdQuery>(GetNoteByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getNoteById', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;