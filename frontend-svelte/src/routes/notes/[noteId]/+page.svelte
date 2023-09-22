<script lang="ts">
	import Note from './Note.svelte';
  import type { PageData } from './$types'

  export let data: PageData
</script>

<Note noteId={data.noteId} />
