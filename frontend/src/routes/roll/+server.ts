export function GET() {
	const number = Math.floor(Math.random() * 6) + 1;

  const x = JSON.stringify({
    number: number,
  })
	return new Response(x, {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}