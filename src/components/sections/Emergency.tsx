import { BRAND, EMERGENCY_LINES, EMERGENCY_STATS } from "@/lib/content";

export default function Emergency() {
  return (
    <section id="emergency" data-beat="emergency" className="relative min-h-[220svh] px-5 md:px-12">
      <div className="flex md:sticky md:top-0 min-h-[100svh] flex-col justify-center py-28">
        <p className="eyebrow is-coral" data-fade>
          Emergency · always open
        </p>
        <h2 data-reveal className="display mt-6 max-w-2xl text-5xl md:text-[4.6vw]">
          Every second, <em className="!text-[var(--color-coral)]">accounted for.</em>
        </h2>
        <a
          href={BRAND.emergencyHref}
          data-fade
          className="mt-8 inline-flex w-fit items-center gap-4 rounded-2xl bg-[var(--color-coral)] px-6 py-4 text-white"
        >
          <span className="pulse" aria-hidden="true" />
          <span>
            <span className="mono block opacity-80">Call emergency</span>
            <span className="display text-4xl md:text-5xl">{BRAND.emergency}</span>
          </span>
        </a>
        <div className="mt-10 grid max-w-2xl gap-8 md:grid-cols-[1fr_1.2fr]">
          <ul data-fade className="space-y-2.5 text-[0.95rem] text-[var(--fg-mute)]">
            {EMERGENCY_LINES.map((l) => (
              <li key={l} className="flex items-baseline gap-3">
                <span className="text-[var(--color-coral)]">+</span>
                {l}
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-3 gap-4">
            {EMERGENCY_STATS.map((s) => (
              <div key={s.label} data-fade>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="display text-4xl" data-count={s.n}>
                    {s.n}
                  </span>
                  <span className="display text-2xl">{s.suffix}</span>
                  <span className="mt-1 block text-[0.78rem] text-[var(--fg-mute)]">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
