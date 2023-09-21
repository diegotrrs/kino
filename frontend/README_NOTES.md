
# 1. Svelte

## 1.1 What's the difference between +page.js, +page.server.js, and +server.js

+page.js/ts: Load function associated with a page. Load data first, then hand it over to the page and render the page. If page is is visited as first page, load runs on the server. If page is visited via client-side nav, load runs on the client.

+page.server.js/ts: Certain things are not suitable to be done in +page.js, e.g. accessing data from an API with a secret. Then you reach for this file and force execution of load to be always on the server (even during client-side nav). Can not only include load, but also form actions (released today).

+server.js: standalone API route. Not associated with a page. Think of implementing a mini API.

# 2. Tanstack

Pre-fetch happens in ```routes/+page.ts```
```typescript
export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.prefetchQuery({
    queryKey: ['posts', 10],
    queryFn: () => api(fetch).getPosts(10),
  })
}
```


Then in ```routes/+page.svelte```, just render, importing the common component.

```html
<script>
	import Posts from '$lib/Posts.svelte'
</script>

<div class="container mx-auto p-8 space-y-8">
	<h1 class="h1">My boards</h1>
	<button type="button" class="btn variant-filled">New table</button>
	<!-- <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p> -->
	<h1>Basic Query with SSR</h1>
	<Posts />
</div>
```

In lib we define the api (api.ts), when the actual calls are done
```typescript
import type { Post } from './types'

export const api = (customFetch = fetch) => ({
  getPosts: async (limit: number) => {
    const response = await customFetch(
      'https://jsonplaceholder.typicode.com/posts',
    )
    const data = (await response.json()) as Post[]
    return data.filter((x) => x.id <= limit)
  },
  getPostById: async (id: number): Promise<Post> => {
    const response = await customFetch(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    )
    const data = (await response.json()) as Post
    return data
  },
})

```

We have ```lib/Posts.svelte``` where the ```createQuery``` is called.

```svelte
<script lang="ts">
	import { useQueryClient, createQuery } from '@tanstack/svelte-query';
	import { api } from './api';

	const client = useQueryClient();

	let limit = 10;

	const posts = createQuery<{ id: number; title: string; body: string }[], Error>({
		queryKey: ['posts', limit],
		queryFn: () => api().getPosts(limit)
	});
</script>

<div>
	<div>
		{#if $posts.status === 'loading'}
			<span>Loading...</span>
		{:else if $posts.status === 'error'}
			<span>Error: {$posts.error.message}</span>
		{:else}
			<ul>
				{#each $posts.data as post}
					<article>
						<a
							href={`/${post.id}`}
							style={// We can use the queryCache here to show bold links for
							// ones that are cached
							client.getQueryData(['post', post.id])
								? 'font-weight: bold; color: indianred'
								: 'cursor: pointer'}
						>
							{post.title}
						</a>
					</article>
				{/each}
			</ul>
			{#if $posts.isFetching}
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
```

Notice that api is called twice
```typescript

// In api/Posts.svelte

const posts = createQuery<{ id: number; title: string; body: string }[], Error>({
		queryKey: ['posts', limit],
		queryFn: () => api().getPosts(limit)
});

// In +page.ts

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.prefetchQuery({
    queryKey: ['posts', 10],
    queryFn: () => api(fetch).getPosts(10),
  })
}

```

You can check ```routes/dev/postsOneFolder``` to check all mentioned in this section but with all files in one folder.

Important Differences between Svelte Query & React Query
Svelte Query offers an API similar to React Query, but there are some key differences to be mindful of.

Many of the functions in Svelte Query return a Svelte store. To access values on these stores reactively, you need to prefix the store with a $. You can learn more about Svelte stores here.
If your query or mutation depends on variables, you must assign it reactively. You can read more about this here.