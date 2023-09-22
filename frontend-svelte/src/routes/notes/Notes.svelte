<script lang="ts">
	import { alwaysArray } from '$lib/util/alwaysArray';
	import { OperationIds, api } from '$lib/graphql/api';
	import type { ListNotesQuery } from '$lib/graphql/types';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	const client = useQueryClient();

	const notesQuery = createQuery<ListNotesQuery, Error>(api.getListNotesQueryOptions());
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
						<a
              href={`/notes/${note.id}`}
              style={// We can use the queryCache here to show bold links for
              // ones that are cached
              client.getQueryData([OperationIds.GetNoteById, note.id])
                ? 'font-weight: bold; color: indianred'
                : 'cursor: pointer'}
            >
              {note.name}
            </a>
						{note.name}fff
					</article>
				{/each}
			</ul>
			{#if $notesQuery.isFetching}
				<div style="color:darkgreen; font-weight:700">Background Updating...</div>
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
