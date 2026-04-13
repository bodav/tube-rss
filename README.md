# Tube RSS

Static YouTube RSS reader built with SvelteKit, TypeScript, and Tailwind CSS.

The app is designed for GitHub Pages:

- feed ingestion runs in GitHub Actions
- normalized feed data is written to `static/data/feeds.json`
- site is rebuilt and deployed as a static artifact

## Local Development

```sh
npm install
npm run ingest:feeds
npm run dev
```

## Build

```sh
npm run build
```

For project pages, set `BASE_PATH` to `/<repo-name>` before build.

## Feed Configuration

Edit `config.json` to manage categories, feed URLs, and ingestion limits.

Top-level defaults:

- `maxItemsPerFeed`
- `maxItemsPerCategory`
- `staleAfterHours`
- `requestTimeoutMs`
- `retryCount`

Each category defines:

- `id`
- `label`
- `order`
- optional `maxItemsPerCategory`
- `feeds` with `url`, `enabled`, and optional overrides

## GitHub Actions

- `/.github/workflows/fetch-feeds.yml`
  - runs daily and on `main` changes to ingestion inputs
  - regenerates `static/data/feeds.json`
  - commits and pushes only when data changed

- `/.github/workflows/deploy.yml`
  - builds static site
  - uploads artifact from `build`
  - deploys to GitHub Pages

## Data Flow

1. `config.json` defines sources per category
2. `scripts/feed-ingest.mjs` fetches and normalizes feeds
3. output written to `static/data/feeds.json`
4. `src/routes/+page.ts` loads local JSON
5. `src/routes/+page.svelte` renders category rails
