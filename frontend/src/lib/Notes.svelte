<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { gql, GraphQLClient } from 'graphql-request'

  const endpoint = 'https://ssm2qgborzcrlpdbjga75gejem.appsync-api.us-east-1.amazonaws.com/graphql'
  // x-api-key
  const key = "da2-or7ya2fmnvhqhbbvykq5rso3z4"

  //const client = useQueryClient()
  const client = new GraphQLClient(endpoint)

  let limit = 10


  const query = gql`
    query ListNotes {
      listNotes {
        id
        name
        completed
      }
    }`

  const requestHeaders = {
    'x-api-key': key
  }

  type ResponseType = {
    listNotes:  {
       id: string; name: string; completed: boolean
    }[]
  }
  const notes = createQuery<
    ResponseType,
    Error
  >({
    queryKey: ['listNotes', limit],
    queryFn: () => client.request(query, {}, requestHeaders),
  })
</script>

<div>
  <div>
    {#if $notes.status === 'loading'}
      <span>Loading...</span>
    {:else if $notes.status === 'error'}
      <span>Error: {$notes.error.message}</span>
    {:else}
      <ul>
        {#each $notes.data.listNotes as note}
          <article>
            <!-- <a
              href={`/${note.id}`}
              style={// We can use the queryCache here to show bold links for
              // ones that are cached
              client.getQueryData(['post', note.id])
                ? 'font-weight: bold; color: indianred'
                : 'cursor: pointer'}
            >
              {note.title}
            </a> -->
            {note.name}
          </article>
        {/each}
      </ul>
      {#if $notes.isFetching}
        <div style="color:darkgreen; font-weight:700">
          Background Updating...
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  article {
    text-align: left;
  }
  a {
    display: block;
    color: white;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
</style>
