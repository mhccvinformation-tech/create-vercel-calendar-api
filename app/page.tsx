export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="font-mono text-sm uppercase tracking-widest text-[var(--color-accent)]">
          Calendar API
        </span>
        <h1 className="text-pretty text-3xl font-semibold leading-tight md:text-4xl">
          Current-month Google Calendar events
        </h1>
        <p className="text-pretty leading-relaxed text-[var(--color-muted)]">
          A minimal JSON endpoint that returns events from a public Google Calendar occurring during
          the current month, in the America/Los_Angeles timezone. CORS is enabled so it can be
          embedded on external sites.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[var(--color-accent)]/15 px-2 py-1 font-mono text-xs font-semibold text-[var(--color-accent)]">
            GET
          </span>
          <code className="font-mono text-sm">/api/events</code>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Returns a JSON payload with the month range and an array of events (title, description,
          location, start, end, all-day flag, and link).
        </p>
        <a
          href="/api/events"
          className="w-fit font-mono text-sm text-[var(--color-accent)] underline underline-offset-4"
        >
          Try it &rarr;
        </a>
      </section>
    </main>
  )
}
