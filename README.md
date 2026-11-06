# Fliphtml5 Downloader

An elegant online tool that converts FlipHTML5 publications into high-quality PDF files.

**[Try Online](https://fliphtml5.aivaded.com/)**

**[Leave a Comment on X](https://x.com/aivaded/status/2046677803987517552)**

## Features

- **URL Parsing**: Automatically detect and parse FlipHTML5 links
- **PDF Generation**: Convert flipbook pages into beautifully formatted PDF documents
- **Batch Support**: Handle multiple download tasks simultaneously
- **ZIP Compatibility**: Support for ZIP-compressed page resources
- **Discovery**: Browse popular publications downloaded by the community
- **Reading Progress**: Automatically save and restore your reading position using IndexedDB
- **Reading History**: Track and manage all your recently read books with progress indicators

## Tech Stack

### Frontend

- **Next.js 15** - React framework (App Router)
- **React 19** - UI library
- **Tailwind CSS 4** - Styling system
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **jsPDF** - PDF generation
- **pdf.js** - Page rendering

### Backend & Data

- **Neon** - Serverless PostgreSQL
- **Drizzle ORM** - Database ORM
- **Cloudflare Workers** - Optional deploy target via OpenNext

## How It Works

### Decryption Process

The tool decrypts FlipHTML5's encrypted configuration data through a three-phase process:

**1. Script Loading**

```typescript
await loadScript(
  "https://static.fliphtml5.com/resourceFiles/html5_templates/js/jquery-4.0.0.min.js",
);
await loadScript(
  "https://static.fliphtml5.com/resourceFiles/html5_templates/js/deString.js",
);
```

Loads FlipHTML5's official jQuery and decryption engine scripts.

**2. Engine Initialization**
Waits for three global variables via polling:

- `window.allocateUTF8` - Allocates UTF-8 string memory
- `window.Module._DeString` - Main decryption function
- `window.UTF8ToString` - Converts memory pointer to JavaScript string

**3. Decryption Execution**

```typescript
const q = window.allocateUTF8(encrypted); // Write encrypted string to WASM memory
const p = window.Module._DeString(q); // Call decryption function
let y = window.UTF8ToString(p); // Read decrypted result
// Truncate to last "]" to remove trailing garbage
resolve(JSON.parse(y)); // Parse as JSON
```

The encryption uses byte-inversion algorithms in the WASM module. Decrypted data contains `fliphtml5_pages` configuration with page URLs and metadata.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── books/        # Book-related APIs
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── FlipDownloaderClient.tsx   # Downloader core component
│   ├── BookListClient.tsx         # Book list component
│   └── ...
├── lib/                   # Core logic
│   ├── decryption.ts      # Page decryption
│   ├── pdf-handler.ts    # PDF handling
│   ├── actions.ts        # Server actions
│   ├── reading-progress-db.ts  # IndexedDB for reading progress
│   └── db/               # Database configuration
├── hooks/                 # Custom Hooks
└── public/                # Static assets
```

## Quick Start

### Requirements

- Node.js 20+
- pnpm 10+ (pnpm 11 recommended)

### Installation

```bash
pnpm install
```

> **pnpm 11+ users:** pnpm refuses to finish an install while any dependency
> has an unreviewed build script, failing with `ERR_PNPM_IGNORED_BUILDS`
> (exit code 1). This repo already declares the required decisions in
> `pnpm-workspace.yaml` under `allowBuilds`, so the command above works out of
> the box. If you add a dependency whose install script is blocked, run
> `pnpm approve-builds` and commit the updated `pnpm-workspace.yaml`.

### Environment Configuration

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

The only variable required to run the app fully is the database URL:

```env
DATABASE_URL=postgresql://user:password@host/database
```

`DB_DRIVER` stays empty for PostgreSQL (Vercel / VPS / local). Set it to `d1`
only when running on Cloudflare D1, where it is injected by `wrangler.jsonc`.

Without `DATABASE_URL` the app still boots and renders pages, but book
queries fail with `ECONNREFUSED` (logged, not fatal).

### Development

```bash
pnpm dev
```

Visit http://localhost:10022 — the dev script binds port **10022**, not 3000.

### Build

```bash
pnpm build
pnpm start
```

`pnpm build` first regenerates `lib/blog-list.json` from the Markdown files in
`blogs/`, then runs `next build`.

## Deploy

### Cloudflare Workers

```bash
pnpm preview     # build + local Workers preview
pnpm deploy:cf   # build + deploy
```

See [`CLOUDFLARE_DEPLOY.md`](./CLOUDFLARE_DEPLOY.md) for environment variables
and Dashboard settings, and [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) for
database setup and migrations (`pnpm db:push`).

## Troubleshooting

**`ERR_PNPM_IGNORED_BUILDS` during `pnpm install`**

pnpm 11 treats unreviewed build scripts as errors. Run `pnpm approve-builds`,
or set explicit `true` / `false` values for each package under `allowBuilds`
in `pnpm-workspace.yaml`. Never leave the placeholder text
`set this to true or false` — it is a string, so the package stays blocked and
the install keeps failing.

**`EPERM: operation not permitted, symlink` at the end of `pnpm build` (Windows)**

`next build` produces `output: "standalone"`, which copies traced files using
symlinks. Windows only allows symlinks with Developer Mode enabled or from an
elevated terminal (junctions are not affected). Enable *Settings → System →
For developers → Developer mode*, or run the build as administrator.

**`Warning: Next.js inferred your workspace root, but it may not be correct`**

A lockfile above the project directory (for example `~/pnpm-lock.yaml`) makes
Next.js pick the wrong root, so the standalone output nests under an extra
folder. Either remove the stray lockfile or pin the root explicitly in
`next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // ...
};
```

**`ECONNREFUSED` when loading books**

`DATABASE_URL` is missing or unreachable. See
[`DATABASE_SETUP.md`](./DATABASE_SETUP.md).

## Usage

1. Paste a FlipHTML5 link into the input box on the home page
2. Click the download button to start conversion
3. Wait for processing to complete, PDF will download automatically
4. Browse popular publications downloaded by other users below

## License

MIT
