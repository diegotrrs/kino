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
  Date: { input: any; output: any; }
};

export type Calendar = {
  __typename?: 'Calendar';
  endDate: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  location: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  startDate: Scalars['Date']['output'];
};

export type CreateCalendarInput = {
  endDate: Scalars['Date']['input'];
  location: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
};

export type CreateNoteInput = {
  completed: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createCalendar: Maybe<Calendar>;
  createNote: Maybe<Note>;
  deleteNote: Maybe<Scalars['String']['output']>;
  updateNote: Maybe<Note>;
};


export type MutationCreateCalendarArgs = {
  input: CreateCalendarInput;
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
  getAllCalendars: Array<Calendar>;
  getAllNotes: Maybe<Array<Maybe<Note>>>;
  getCalendarById: Maybe<Calendar>;
  getNoteById: Maybe<Note>;
};


export type QueryGetCalendarByIdArgs = {
  calendarId: Scalars['String']['input'];
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

export type GetCalendarByIdQueryVariables = Exact<{
  calendarId: Scalars['String']['input'];
}>;


export type GetCalendarByIdQuery = { __typename?: 'Query', getCalendarById: { __typename?: 'Calendar', id: string, name: string, location: string | null, startDate: any, endDate: any } | null };

export type GetAllCalendarsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllCalendarsQuery = { __typename?: 'Query', getAllCalendars: Array<{ __typename?: 'Calendar', id: string, location: string | null, name: string, startDate: any, endDate: any }> };

export type CreateCalendarMutationVariables = Exact<{
  input: CreateCalendarInput;
}>;


export type CreateCalendarMutation = { __typename?: 'Mutation', createCalendar: { __typename?: 'Calendar', id: string } | null };


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
export const GetCalendarByIdDocument = gql`
    query getCalendarById($calendarId: String!) {
  getCalendarById(calendarId: $calendarId) {
    id
    name
    location
    startDate
    endDate
  }
}
    `;
export const GetAllCalendarsDocument = gql`
    query getAllCalendars {
  getAllCalendars {
    id
    location
    name
    startDate
    endDate
  }
}
    `;
export const CreateCalendarDocument = gql`
    mutation createCalendar($input: CreateCalendarInput!) {
  createCalendar(input: $input) {
    id
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
    },
    getCalendarById(variables: GetCalendarByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetCalendarByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCalendarByIdQuery>(GetCalendarByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getCalendarById', 'query');
    },
    getAllCalendars(variables?: GetAllCalendarsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetAllCalendarsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAllCalendarsQuery>(GetAllCalendarsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getAllCalendars', 'query');
    },
    createCalendar(variables: CreateCalendarMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<CreateCalendarMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateCalendarMutation>(CreateCalendarDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'createCalendar', 'mutation');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;