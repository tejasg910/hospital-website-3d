import { NIGHT } from "@/lib/content";

export default function Night() {
  return (
    <section id="night" data-beat="night" className="relative min-h-[220svh] px-5 md:px-12">
      <div className="flex md:sticky md:top-0 min-h-[100svh] flex-col justify-center py-28">
        <p className="eyebrow" data-fade>
          Night care
        </p>
        <h2 data-reveal className="display mt-6 max-w-xl text-5xl md:text-[4.6vw]">
          The lights <em>never</em> go off.
        </h2>
        <ul className="mt-10 max-w-md space-y-5">
          {NIGHT.map(([title, body]) => (
            <li key={title} data-fade className="border-l border-[var(--color-mint)] pl-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-[0.92rem] leading-relaxed text-[var(--fg-mute)]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
