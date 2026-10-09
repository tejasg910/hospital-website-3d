import { DOCTORS, STATS } from "@/lib/content";

const initials = (n: string) =>
  n
    .replace("Dr. ", "")
    .split(" ")
    .map((w) => w[0])
    .join("");

export default function Doctors() {
  return (
    <section id="doctors" data-beat="doctors" className="relative min-h-[200svh] px-5 md:px-12">
      <div className="flex md:sticky md:top-0 min-h-[100svh] flex-col justify-center py-28">
        <p className="eyebrow" data-fade>
          Our people
        </p>
        <h2 data-reveal className="display mt-6 max-w-2xl text-5xl md:text-[4.4vw]">
          180 specialists. <em>One</em> conversation about you.
        </h2>
        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} data-fade className="border-t border-[var(--line)] pt-4">
              <dt className="text-[0.8rem] text-[var(--fg-mute)]">{s.label}</dt>
              <dd className="display mt-2 text-5xl">
                <span data-count={s.n}>{s.n}</span>
                {s.suffix}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOCTORS.map((d) => (
            <li key={d.name} data-fade className="panel flex items-center gap-4 p-4 lg:flex-col lg:items-start">
              <span
                aria-hidden="true"
                className="display grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--color-ink-3)] text-xl text-[var(--color-mint)]"
              >
                {initials(d.name)}
              </span>
              <span>
                <span className="block font-semibold">{d.name}</span>
                <span className="block text-[0.85rem] text-[var(--fg-mute)]">{d.role}</span>
                <span className="mono mt-1 block text-[var(--fg-mute)]">{d.years} yrs</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
