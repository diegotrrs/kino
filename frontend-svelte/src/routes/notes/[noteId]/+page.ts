import { api } from '$lib/graphql/api'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()

  const noteId = params.noteId

  await queryClient.prefetchQuery(api.getGetNoteByIdQueryOptions(noteId))


  return { noteId }
}
