<script lang="ts">
	import { api } from '$lib/graphql/api';
	import type { GetNoteByIdQuery } from '$lib/graphql/types';
  import { createQuery } from '@tanstack/svelte-query'

  export let noteId: string

  const noteQuery = createQuery<GetNoteByIdQuery, Error>(api.getGetNoteByIdQueryOptions(noteId));

</script>

<div>
  <div>
    <a class="button" href="/"> Back </a>
  </div>
  {#if !noteId || $noteQuery.isLoading}
    <span>Loading...</span>
  {/if}
  {#if $noteQuery.error}
    <span>Error: {$noteQuery.error.message}</span>
  {/if}
  {#if $noteQuery.isSuccess}
    <h1>{$noteQuery.data.getNoteById?.name}</h1>
    <div>
      <p>{$noteQuery.data?.getNoteById?.id}</p>
    </div>
    <div>{$noteQuery.isFetching ? 'Background Updating...' : ' '}</div>
  {/if}
</div>
