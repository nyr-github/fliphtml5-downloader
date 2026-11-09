import FlipDownloaderClient from "@/components/FlipDownloaderClient";

export default function Home() {
  return (
    <main className="relative min-h-screen px-4 py-12 sm:px-6 sm:py-20">
      <div className="fixed inset-0 pointer-events-none gradient-mesh" />
      <div className="relative mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <span className="inline-block rounded-full border border-[var(--color-border)] bg-white px-4 py-1 text-xs font-semibold text-[var(--color-secondary)]">
            Browser-only · No account · No database
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            FlipHTML5 to <span className="text-gradient">PDF</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-text-secondary)]">
            Convert public publications you own or have permission to download.
            Processing stays in your browser; files are fetched directly from the source.
          </p>
        </header>
        <FlipDownloaderClient />
        <footer className="mt-12 text-center text-xs text-[var(--color-text-secondary)]">
          Adapted from{" "}
          <a className="underline" href="https://github.com/nyr-github/fliphtml5-downloader" target="_blank" rel="noopener noreferrer">
            nyr-github/fliphtml5-downloader
          </a>
          . No analytics, payment service, or server-side storage.
        </footer>
      </div>
    </main>
  );
}
