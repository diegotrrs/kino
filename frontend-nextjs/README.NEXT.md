
# Options Next Revalidate
[Source](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate)
```
export default async function Page() {
  // This request should be cached until manually invalidated.
  // Similar to `getStaticProps`.
  // `force-cache` is the default and can be omitted.
  const staticData = await fetch(`https://...`, { cache: 'force-cache' })
 
  // This request should be refetched on every request.
  // Similar to `getServerSideProps`.
  const dynamicData = await fetch(`https://...`, { cache: 'no-store' })
 
  // This request should be cached with a lifetime of 10 seconds.
  // Similar to `getStaticProps` with the `revalidate` option.
  const revalidatedData = await fetch(`https://...`, {
    next: { revalidate: 10 },
  })
 
  return <div>...</div>
}
```

```
fetch(`https://...`, { next: { revalidate: false | 0 | number } })
```

Set the cache lifetime of a resource (in seconds).

false - Cache the resource indefinitely. Semantically equivalent to revalidate: Infinity. The HTTP cache may evict older resources over time.
0 - Prevent the resource from being cached.
number - (in seconds) Specify the resource should have a cache lifetime of at most n seconds.