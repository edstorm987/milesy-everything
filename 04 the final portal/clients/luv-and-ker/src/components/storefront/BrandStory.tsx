export function BrandStory() {
  return (
    <section
      className="mx-auto max-w-6xl px-6 py-20"
      style={{ borderRadius: "var(--brand-radius)" }}
    >
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div
          aria-hidden
          className="aspect-square w-full"
          style={{
            borderRadius: "var(--brand-radius)",
            background:
              "linear-gradient(160deg, color-mix(in oklab, var(--brand-accent) 24%, white) 0%, color-mix(in oklab, var(--brand-primary) 14%, white) 100%)",
          }}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            The story
          </p>
          <h2 className="mt-3 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight">
            A gift carried across generations.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--brand-ink)]/80">
            Odo is the Twi word for love. It is more than a name — it is the philosophy behind
            every bar. Every ingredient is sourced directly from Ghanaian farmers. No middlemen.
            No shortcuts.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]/80">
            Felicia&apos;s grandmother taught her the recipes that became Luv &amp; Ker. The
            heritage is in the bar. The honesty is in the label. The love is in the name.
          </p>
        </div>
      </div>
    </section>
  );
}
