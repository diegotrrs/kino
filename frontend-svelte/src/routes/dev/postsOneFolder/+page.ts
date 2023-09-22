import { api } from '$lib/api'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()
  console.log('pre fetching query')

  // if the following lines are commented then the queryFn in Posts.svelte will run
  await queryClient.prefetchQuery({
    queryKey: ['posts', 10],
    queryFn: () => api(fetch).getPosts(10),
  })
}
