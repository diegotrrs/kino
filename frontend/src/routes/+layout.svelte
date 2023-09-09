<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';	
	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';

	import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<QueryClientProvider client={data.queryClient}>
	<AppShell slotSidebarLeft="w-56 p-4">
		<svelte:fragment slot="sidebarLeft">
			<!-- Insert the list: -->
			<nav class="list-nav">
				<ul>
					<li><a href="/">Home</a></li>
					<li><a href="/about">About</a></li>
				</ul>
			</nav>
			<!-- --- -->
		</svelte:fragment>
		<svelte:fragment slot="header">
			<!-- App Bar -->
			<AppBar>
				<svelte:fragment slot="lead">
					<strong class="text-xl uppercase">Kino Tables</strong>
				</svelte:fragment>
				<svelte:fragment slot="trail">				
					<LightSwitch />				
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>
		<!-- Page Route Content -->
		<slot />
	</AppShell>
</QueryClientProvider>