# Fliphtml5 Downloader

An elegant online tool that converts FlipHTML5 publications into high-quality PDF files.

**[Try Online](https://fliphtml5.aivaded.com/)**

## Features

- **URL Parsing**: Automatically detect and parse FlipHTML5 links
- **PDF Generation**: Convert flipbook pages into beautifully formatted PDF documents
- **Batch Support**: Handle multiple download tasks simultaneously
- **ZIP Compatibility**: Support for ZIP-compressed page resources
- **Discovery**: Browse popular publications downloaded by the community

## Tech Stack

### Frontend

- **Next.js 15** - React framework
- **Tailwind CSS 4** - Styling system
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **jsPDF** - PDF generation

### Backend & Data

- **Neon** - Serverless PostgreSQL
- **Drizzle ORM** - Database ORM

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
│   └── db/               # Database configuration
├── hooks/                 # Custom Hooks
└── public/                # Static assets
```

## Quick Start

### Requirements

- Node.js 20+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=your_neon_database_url
```

### Development

```bash
pnpm dev
```

Visit http://localhost:3000

### Build

```bash
pnpm build
pnpm start
```

## Usage

1. Paste a FlipHTML5 link into the input box on the home page
2. Click the download button to start conversion
3. Wait for processing to complete, PDF will download automatically
4. Browse popular publications downloaded by other users below

## License

MIT
