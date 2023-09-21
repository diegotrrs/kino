
<script>
  /** @type {number} */
	let number;

	async function roll() {
		const response = await fetch('/roll');
		const xx = await response.json();
    number = xx['number']
	}
</script>
<div class="container mx-auto p-8 space-y-8">
	<h1 class="h1"> What's the difference between +page.js, +page.server.js, and +server.js</h1>
  
    <br>  
    +page.js/ts: Load function associated with a page. Load data first, then hand it over to the page and render the page. If page is is visited as first page, load runs on the server. If page is visited via client-side nav, load runs on the client.
    <br>
    <br>
    +page.server.js/ts: Certain things are not suitable to be done in +page.js, e.g. accessing data from an API with a secret. Then you reach for this file and force execution of load to be always on the server (even during client-side nav). Can not only include load, but also form actions (released today).
    <br>
    <br>
    +server.js: standalone API route. Not associated with a page. Think of implementing a mini API.
    <br>
    Notice that they share the same routing like the other pages. For example: /roll
    <br>
    <br>

    <button on:click={roll}>Roll the dice</button>

    {#if number !== undefined}
	    <p>You rolled a {number}</p>
    {/if}
  
</div>
