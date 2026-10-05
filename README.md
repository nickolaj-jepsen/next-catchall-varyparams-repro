# Repro: prefetched optional catch-all index is rendered for sibling URLs

With `cacheComponents` and `partialPrefetching`, after `<Link href="/" prefetch={true}>` has
prefetched the index of `app/[[...slug]]`, client navigation to `/b` renders the index page.
No request for `/b` is made. A reload fixes it.

Reproduces 10/10 on 16.3.3 and 16.4.0-canary.60, in Chromium and Firefox.

## Steps

```sh
npm install
npx playwright install chromium
npm run repro   # next build, next start, then check.mjs
```

Or by hand after `next build && next start`:

1. Open `/a` and wait for the `/` link to prefetch.
2. Click the `/b` link.

`/b` shows "Index page" instead of "Page /b".

## Variations

| Change | Result |
| --- | --- |
| As is | Bug |
| Route at `app/docs/[[...slug]]`, prefetching `/docs` | Bug |
| `experimental: { varyParams: false }` | Works |
| No `partialPrefetching` | Works |
| `/` opened with a full page load instead of prefetched | Works |

`generateStaticParams` and `'use cache'` don't change the result. `loading.tsx` is only there so the
build accepts the `params` access.

## Notes

Same symptom as #96553, whose fix is in both tested versions. That fix covered a fully static
index; this index reads `params`.

The `<Link prefetch={true}>` request for `/` (`Next-Router-Prefetch: 2`) gets a response where
`__PAGE__` lists only the search params as vary params, without `slug`. For `/a` the same
request lists `slug`. The client then stores the index's `__PAGE__` under a Fallback `slug`, and
the navigation to `/b` reads that fulfilled entry instead of fetching.
