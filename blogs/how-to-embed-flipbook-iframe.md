---
title: "How to Embed a Flipbook on Your Website with an iframe"
description: "Step-by-step guide to embedding any FlipHTML5 flipbook into your own website, blog, or LMS using the /read/iframe/[id] endpoint. Includes responsive markup, parameters, and troubleshooting."
date: "2026-05-01"
---

# How to Embed a Flipbook on Your Website with an iframe

Sometimes you don't just want to _read_ a flipbook — you want to **display it directly on your own website, blog, documentation portal, or LMS**. With Fliphtml5 Downloader you can embed any book in seconds using a single `<iframe>` tag pointing at our dedicated embed endpoint:

```
/read/iframe/[id]
```

This guide walks you through the whole process: how to get the `id`, what the minimal embed code looks like, how to make it responsive, and how to customise the experience for your audience.

## What Is the Embed Endpoint?

We expose a clean, chrome‑free version of our online flipbook reader at:

```
https://fliphtml5.aivaded.com/read/iframe/[id]
```

The page is intentionally stripped down so it plays well inside an iframe:

- **No top navigation bar** — so it looks like part of your own site.
- **No site footer** — no distracting links to our homepage.
- **Full-viewport reader** — the book fills whatever size container you give it.
- **The same high-quality reader** used on our main site: flipping pages, thumbnails, zoom, fullscreen, page sharing, etc.

In short: all of the reader, none of the wrapper.

## Step 1: Get the Book's `id`

Every book on Fliphtml5 Downloader has a stable internal `id`. You can find it in the URL bar whenever you open a book on our site:

```
https://fliphtml5.aivaded.com/read/<id>
https://fliphtml5.aivaded.com/book/<id>
```

Just grab the `<id>` portion. That same value is what you'll plug into the iframe URL:

```
https://fliphtml5.aivaded.com/read/iframe/<id>
```

> Tip: if the book isn't in our catalog yet, simply paste the FlipHTML5 URL into the downloader homepage once. After it's indexed you'll be able to reach it at `/read/<id>` and embed it.

## Step 2: The Minimal Embed Code

The simplest possible embed looks like this:

```html
<iframe
  src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen
  loading="lazy"
  title="Flipbook Reader"
></iframe>
```

Drop that into any HTML page, WordPress post (use the _Custom HTML_ block), Ghost post, Notion embed, Webflow embed block, or CMS rich‑text field and you're done.

A few notes on the attributes:

- `allowfullscreen` — lets readers tap the fullscreen button inside the reader.
- `loading="lazy"` — defers the iframe until the user scrolls to it, saving bandwidth.
- `title` — important for accessibility; screen readers announce it.
- `frameborder="0"` — removes the default browser border around the iframe.

## Step 3: Customize Default Behavior with URL Parameters

You can append query parameters to the `src` URL to control the initial reader state — similar to how YouTube supports `?start=30&autoplay=1`. These are read once on page load.

| Parameter    | Values                 | Default | What it does                                                                                                          |
| ------------ | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `page`       | `1` … total page count | `1`     | Opens the reader at a specific page (1-based). Out‑of‑range values fall back to page 1.                               |
| `dual`       | `0` / `1`              | `0`     | When `1`, starts in two‑page (book) mode on wide screens. On mobile it still falls back to single page automatically. |
| `thumbnails` | `0` / `1`              | `1`     | When `0`, hides the “thumbnail grid” toggle button in the top toolbar for a cleaner UI.                               |

> **Note on `allow` attribute:** The HTML `allow` attribute on `<iframe>` is reserved for **browser permission policies** (camera, microphone, fullscreen, clipboard, etc.) — it is not meant for app‑level options. That is why every mainstream embed (YouTube, Vimeo, Google Maps, CodePen…) exposes behavior through the `src` URL instead. We follow the same convention.

### Examples

Jump straight to page 12:

```html
<iframe
  src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID?page=12"
  width="800"
  height="600"
  allowfullscreen
  loading="lazy"
  title="Flipbook Reader"
></iframe>
```

Start in two-page mode, minimal toolbar:

```html
<iframe
  src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID?dual=1&thumbnails=0"
  width="800"
  height="600"
  allowfullscreen
  loading="lazy"
  title="Flipbook Reader"
></iframe>
```

Combine everything — deep link to a chapter opening in spread view:

```html
<iframe
  src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID?page=8&dual=1&thumbnails=0"
  allowfullscreen
  loading="lazy"
  title="Flipbook Reader"
></iframe>
```

When `page` is provided, the reader skips its usual “resume where you left off” behavior for that session, so the host always controls the opening page.

## Step 4: Make It Responsive

A fixed `800 × 600` iframe looks awkward on phones. The classic _aspect‑ratio wrapper_ trick solves it elegantly:

```html
<div
  style="
    position: relative;
    width: 100%;
    padding-bottom: 75%; /* 4:3 aspect ratio */
    height: 0;
    overflow: hidden;
    border-radius: 12px;
  "
>
  <iframe
    src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID"
    style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
    "
    allowfullscreen
    loading="lazy"
    title="Flipbook Reader"
  ></iframe>
</div>
```

Pick your own aspect ratio by changing `padding-bottom`:

| Aspect ratio   | `padding-bottom` |
| -------------- | ---------------- |
| 16:9           | `56.25%`         |
| 4:3            | `75%`            |
| 3:4 (portrait) | `133.33%`        |
| 1:1            | `100%`           |

If your site already uses Tailwind CSS, the modern equivalent is even shorter:

```html
<div class="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
  <iframe
    src="https://fliphtml5.aivaded.com/read/iframe/YOUR_BOOK_ID"
    class="absolute inset-0 h-full w-full border-0"
    allowfullscreen
    loading="lazy"
    title="Flipbook Reader"
  ></iframe>
</div>
```

## Step 5: Embedding in Popular Platforms

The embed works anywhere that allows raw HTML:

- **WordPress** — insert a _Custom HTML_ block, paste the snippet, save.
- **Ghost** — use the _HTML_ card in the editor.
- **Notion** — use the `/embed` block and paste the iframe URL directly; Notion will wrap it for you.
- **Webflow / Framer / Wix** — drop an "Embed" or "HTML Embed" element and paste the snippet.
- **Moodle / Canvas / other LMS** — switch the rich‑text editor to HTML view and paste the snippet. Students can read the material without ever leaving the course page.
- **Static sites (Astro, Next.js, Hugo, Jekyll)** — paste the snippet straight into your Markdown/MDX file.

## Step 6 (Optional): Link Back to the Full Reader

Your audience may want the full experience — including downloads, related books and reading history — so it's nice to offer a _"Open in full reader"_ link next to your iframe:

```html
<p>
  <a
    href="https://fliphtml5.aivaded.com/read/YOUR_BOOK_ID"
    target="_blank"
    rel="noopener"
  >
    Open full reader →
  </a>
</p>
```

This sends visitors to `/read/[id]` (the standard page, with navigation), so they can use every feature of the site.

## Use Cases

Some of the most popular ways people embed our reader:

- **Authors & publishers** embed a free preview chapter of their book on their landing page.
- **Educators** embed course handbooks or syllabi directly inside their LMS.
- **Marketing teams** embed brochures, product catalogs and magazines in campaign landing pages.
- **Librarians & archivists** embed digitised collections on their institution's website.
- **Bloggers** embed research papers or reports they're reviewing so readers can read along inline.

## Troubleshooting

**1. The iframe is blank / won't load.**
Make sure you're using HTTPS on your own page. Browsers block mixed content, so an HTTPS page cannot load an HTTP iframe (our endpoint is always HTTPS, so the fix is to upgrade _your_ page to HTTPS).

**2. The fullscreen button doesn't work.**
You need `allowfullscreen` (or `allow="fullscreen"`) on the `<iframe>` element.

**3. The book renders tiny on mobile.**
You are probably using fixed `width`/`height` attributes. Switch to the responsive aspect‑ratio wrapper shown above.

**4. I embedded a private book and it shows a lock screen.**
This is by design: books marked as private in our database are not publicly viewable. Unset the private flag, or embed a public book instead.

**5. The embed is working but I'd like to control page flips programmatically.**
`postMessage`‑based cross‑frame control is not exposed on this endpoint yet. If this is important for your use case, open an issue on GitHub or leave us a message on Discord — the more concrete use cases we hear, the faster we'll ship it.

## Summary

Embedding a flipbook with Fliphtml5 Downloader is essentially a two‑step process:

1. Find the book's `id` from its URL on our site.
2. Drop an `<iframe src="https://fliphtml5.aivaded.com/read/iframe/[id]">` into your page, ideally wrapped in a responsive container.

No SDK. No API key. No backend. Just one URL — the same reader your visitors already know, quietly living inside your own page.

Happy embedding!
