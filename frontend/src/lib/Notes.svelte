<script lang="ts">
  import { api } from './graphql/api'
	import { alwaysArray } from './util/alwaysArray';

  const notesQuery = api.createListNotesQuery()
</script>

<div>
  <div>
    {#if $notesQuery.status === 'loading'}
      <span>Loading...</span>
    {:else if $notesQuery.status === 'error'}
      <span>Error: {$notesQuery.error.message}</span>
    {:else}
      <ul>
        {#each alwaysArray($notesQuery.data.listNotes) as note}
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
      {#if $notesQuery.isFetching}
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
