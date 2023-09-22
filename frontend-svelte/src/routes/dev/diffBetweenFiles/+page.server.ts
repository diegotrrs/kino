import { api } from '$lib/api'
import type { PageLoad, PageServerLoad } from './$types'
import { DateTime } from 'luxon'

// This function will be called always on the server.

// This function will be always called before +page.ts

// This function will be always called before +page.svelte

// This function is called in both cases:

// a- First load (reload of page) - srr
// b- Client, coming from menu or link.

export const load: PageServerLoad = async ({ parent, fetch }) => {  
  //console.log(`+page.server.ts ${DateTime.now().toISOTime()}`)
}
