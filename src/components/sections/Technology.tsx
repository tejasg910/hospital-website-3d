import { TECH } from "@/lib/content";

export default function Technology() {
  return (
    <section id="technology" data-beat="technology" className="relative min-h-[240svh] px-5 md:px-12">
      <div className="flex md:sticky md:top-0 min-h-[100svh] flex-col justify-center py-28">
        <p className="eyebrow" data-fade>
          Diagnostics & technology
        </p>
        <h2 data-reveal className="display mt-6 max-w-2xl text-5xl md:text-[4.4vw]">
          See inside, <em>before</em> a single incision.
        </h2>
        <ul className="mt-10 grid max-w-2xl gap-px overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          {TECH.map(([name, body], i) => (
            <li key={name} data-fade className={`bg-[rgba(4,20,26,0.72)] p-6 backdrop-blur-md ${i === 0 ? "md:col-span-2" : ""}`}>
              <h3 className="flex items-baseline gap-3 text-lg font-semibold">
                <span className="mono text-[var(--color-mint)]">0{i + 1}</span>
                {name}
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--fg-mute)]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
