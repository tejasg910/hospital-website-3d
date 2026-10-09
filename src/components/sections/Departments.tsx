import { DEPARTMENTS } from "@/lib/content";

export default function Departments() {
  return (
    <section id="departments" data-beat="departments" className="relative min-h-[420svh] px-5 md:px-12">
      <div className="sticky top-0 flex min-h-[100svh] flex-col justify-center pt-24 pb-6 md:py-28">
        <p className="eyebrow" data-fade>
          Centres of excellence
        </p>
        <h2 data-reveal className="display mt-4 max-w-xl text-4xl md:mt-6 md:text-[4.2vw]">
          One floor, one speciality, one team.
        </h2>
        <div className="mt-6 grid max-w-4xl gap-4 md:mt-10 md:gap-6 md:grid-cols-[1fr_1.3fr]">
          <ol className="space-y-1" aria-label="Departments">
            {DEPARTMENTS.map((d) => (
              <li key={d.name} className="dept-item flex items-center gap-4 py-1.5">
                <span className="dot h-3 w-3 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                <span className="mono w-14 text-[var(--fg-mute)]">L{d.no}</span>
                <span className="display text-2xl md:text-3xl">{d.name}</span>
              </li>
            ))}
          </ol>
          <div className="panel relative min-h-[18rem] overflow-hidden p-7 md:min-h-[15rem]">
            {DEPARTMENTS.map((d, i) => (
              <article
                key={d.name}
                className="dept-card absolute inset-0 flex flex-col justify-between p-7"
                style={{ opacity: i === 0 ? 1 : 0 }}
                aria-hidden={i !== 0}
              >
                <div>
                  <p className="mono" style={{ color: d.color }}>
                    Level {d.no}
                  </p>
                  <h3 className="display mt-3 text-3xl">{d.name}</h3>
                  <p className="mt-3 text-[0.94rem] leading-relaxed text-[var(--fg-mute)]">{d.body}</p>
                </div>
                <p className="mt-5 flex items-baseline gap-3 border-t border-[var(--line)] pt-4">
                  <span className="display text-3xl" style={{ color: d.color }}>
                    {d.stat}
                  </span>
                  <span className="text-[0.82rem] text-[var(--fg-mute)]">{d.statLabel}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
