import { api } from '$lib/graphql/api'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.prefetchQuery(api.getListNotesQueryOptions())
}
