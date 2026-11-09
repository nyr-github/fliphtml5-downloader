# FlipHTML5 Downloader - Local Edition

A stripped-down browser-only adaptation of [nyr-github/fliphtml5-downloader](https://github.com/nyr-github/fliphtml5-downloader), based on upstream commit `4f607be`.

## Run locally

Requires **Node.js 22.13+** and npm. No account, `.env`, API key, database, or application backend is required.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:10022>. Paste a public publication URL, convert, then click **Download PDF**.

## Static production build

```sh
npm run build
npm start
```

`out/` contains the complete static site. The convenience preview command requires Python 3. `npm start` serves these files on loopback; it is a static file server, not an API/backend. The site can also be served by any ordinary static web server. Use HTTP rather than opening `index.html` via `file://`.

If you have a prebuilt archive containing `out/`, you can preview it without installing Node dependencies. A GitHub source ZIP does not include the build output; build it first using the commands above.

```sh
python3 -m http.server 10022 --bind 127.0.0.1 --directory out
```

## What remains

- Direct browser fetching of public FlipHTML5 configuration and page images.
- Upstream public page-list decoding and ZIP/PDF page-resource support.
- Browser-side PDF assembly, ordered pages, progress, retry, and cancellation.
- Up to ten recent task URLs/titles in **localStorage**, with **Clear tasks** and per-task removal.
- A locally served PDF.js worker, copied from the installed dependency before dev/build.

## What was removed

- All API routes, server actions, middleware, dynamic catalogue/reader pages, admin and discovery features.
- Neon/PostgreSQL, Cloudflare D1, Drizzle, migrations, and deployment jobs.
- Payment/free-pass services, tracking/analytics, AI tagging, and third-party promotions.
- Database-backed and IndexedDB storage. No generated PDF is persisted by the app.

## Network and privacy

There is no proxy. Publication configuration and page resources must allow **CORS** access from your browser. Authentication, private/password-protected publications, and source access restrictions are not bypassed. A failed page stops conversion rather than silently saving an incomplete PDF.

The app still needs internet access to fetch source content. Encoded public page lists also use the upstream official FlipHTML5 jQuery/decoder scripts from `static.fliphtml5.com`. It does not send a download record, payment request, or analytics event to an application server. Task URLs/titles remain in this browser; clearing them does not remove any PDF you saved to disk.

After refresh, generated blob URLs are gone, so restored tasks must be converted again. Large publications may be limited by browser memory. Only convert material you own or are permitted to download.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Unit tests use synthetic configurations/resources, not third-party publications.

### Browser smoke tests

With the built static site running via `npm start` in another terminal:

```sh
npx playwright install chromium
npm run test:browser
```

Alternatively, set `BROWSER_CHANNEL=chrome` to use an installed Chrome in a fresh, isolated browser profile. The smoke tests intercept **every** remote response with synthetic fixtures, check image and ZIP/PDF conversion, downloads, errors, retry, cancellation, persistence and mobile layout, and assert that no application API is called. They do not download any real publication. Artifacts go to the ignored `test-results/` directory.
