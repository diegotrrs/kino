import { api } from '$lib/api'
import type { PageLoad } from './$types'
import { DateTime } from 'luxon'

// This function will be called on the server if the page is visited the first time.
// This function will be called on the client if the page is visited from the side menu or a <a /> link.

export const load: PageLoad = async ({ parent, fetch }) => {  
  //console.log(`+page.ts ${DateTime.now().toISOTime()}`)
}
