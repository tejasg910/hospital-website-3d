import { PILLARS } from "@/lib/content";

export default function Build() {
  return (
    <section id="building" data-beat="build" className="relative min-h-[260svh] px-5 md:px-12">
      <div className="flex md:sticky md:top-0 min-h-[100svh] flex-col justify-center py-28">
        <div className="max-w-xl">
          <p className="eyebrow" data-fade>
            The building
          </p>
          <h2 data-reveal className="display mt-6 text-5xl md:text-[4.6vw]">
            Designed from the bed outwards.
          </h2>
          <p data-fade className="mt-6 max-w-md leading-relaxed text-[var(--fg-mute)]">
            Architects started with a single patient room and built the hospital around it. Every decision followed:
            where the light falls, how far a nurse walks, how fast a stretcher reaches theatre.
          </p>
        </div>
        <ul className="mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
          {PILLARS.map(([title, body], i) => (
            <li key={title} data-fade className="panel p-6">
              <p className="mono text-[var(--color-mint)]">0{i + 1}</p>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--fg-mute)]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
