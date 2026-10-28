# PicWrap

Upload a few photos, give them a title, and get a shareable gallery page at `/g/<id>`
with a responsive grid and a keyboard-friendly lightbox (click to open, ← / → or the
arrow buttons to move, Esc to close).

It is one Cloudflare Worker: static assets for the upload page, Workers KV for the
gallery record and image bytes. It runs on the Workers **free** plan.

## How it works

| Route | What it does |
| --- | --- |
| `GET /` | Upload page (`public/index.html`, client code in `src/client/upload.ts`) |
| `POST /api/galleries` | Multipart upload: `title` + one or more `files`. Returns `{ id, url }` |
| `GET /api/galleries/:id` | Gallery JSON |
| `GET /g/:id` | Server-rendered gallery page (client code in `src/client/gallery.ts`) |
| `GET /i/:id/:n` | Image bytes |

Server-side validation (`src/validate.ts`):

- Image type is decided by **magic bytes** (JPEG, PNG, GIF, WebP only). The browser's declared
  MIME type and the filename are ignored, and SVG/HTML are rejected.
- Up to **20 files**, **5 MB** each. Title is required, control characters are stripped, and it is
  capped at 120 characters.
- KV keys are generated (`gallery:<id>`, `img:<id>:<n>`, with a random 12-character id). User
  input never becomes part of a key, and ids are checked against a strict pattern before lookups.
- The title is HTML-escaped on output, and pages are sent with a strict Content-Security-Policy
  (`script-src 'self'`, no inline script). Images are served with the sniffed type and
  `X-Content-Type-Options: nosniff`.
- Every KV entry has a **30-day TTL**, so storage stays inside free-tier limits.

## Languages

The gallery and "not found" pages are rendered in the visitor's language, picked from the
`Accept-Language` header (primary subtag match, q-values honoured, English fallback). Strings live in
`src/i18n/locales/<code>.json` (20 locales); `src/i18n/index.ts` handles lookup and plural forms via
`Intl.PluralRules`. Translated strings are HTML-escaped like any other text. Responses carry
`Content-Language` and `Vary: Accept-Language`.

## Run locally

Requires Node.js 20+. No secrets or Cloudflare login are needed. `wrangler dev` uses a local,
simulated KV store.

```sh
npm install
npm run dev          # builds the client, then wrangler dev on http://localhost:8787
```

## Test, typecheck, lint, build

```sh
npm test             # vitest: upload validation + gallery create/fetch/render
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # bundles client JS and runs `wrangler deploy --dry-run`
npm run check        # all of the above
```

## Deploy (Cloudflare Workers, free plan)

1. Authenticate: `npx wrangler login`, or export `CLOUDFLARE_API_TOKEN` (needs *Workers Scripts:
   Edit* and *Workers KV Storage: Edit*). If the token can see more than one account, also export
   `CLOUDFLARE_ACCOUNT_ID`. Keep both out of the repo.
2. Create the KV namespace and put its id in `wrangler.jsonc` under `kv_namespaces` → `GALLERIES`:

   ```sh
   npx wrangler kv namespace create picwrap-galleries
   ```

3. Deploy:

   ```sh
   npm run build:client
   npx wrangler deploy        # or: npm run deploy
   ```

   The worker is published at `https://picwrap.<your-subdomain>.workers.dev`. The first time an
   account deploys to workers.dev it has to have a workers.dev subdomain. Wrangler or the
   dashboard will prompt for one.

Free-plan budget: KV allows 1,000 writes a day, and each gallery costs 1 + (number of images)
writes. That works out to roughly 50–250 galleries a day, with 1 GB of storage reclaimed by the TTL.

## Why not Vercel / Next.js?

Next.js on Vercel (with Blob storage) was the alternative we considered. We chose a single
Worker + KV instead because it needs no framework, it deploys with one `wrangler deploy`, and it
runs entirely on the free tier with local dev that needs no credentials.
