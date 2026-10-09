import { BRAND } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" data-beat="hero" className="relative flex h-[100svh] flex-col justify-end px-5 pb-[9vh] md:px-12">
      <p className="hero-fade eyebrow">Multispeciality hospital · Pune · Open 24×7</p>
      <h1 className="display mt-6 text-[15vw] md:text-[7.6vw]">
        <span className="line-mask"><span className="hero-line block">Care, built</span></span>
        <span className="line-mask"><span className="hero-line block"><em>around you.</em></span></span>
      </h1>
      <p className="hero-fade mt-7 max-w-md text-[1.02rem] leading-relaxed text-[var(--fg-mute)]">
        A 420-bed hospital where every corridor, ward and theatre was designed around one person: the patient.
      </p>
      <div className="hero-fade mt-8 flex flex-wrap gap-3">
        <a href="#contact" className="btn btn-mint">
          Book a visit <span className="arrow" aria-hidden="true">→</span>
        </a>
        <a href={BRAND.emergencyHref} className="btn btn-ghost">
          24×7 Emergency · {BRAND.emergency}
        </a>
      </div>
      <p className="hero-fade mono mt-12 text-[var(--fg-mute)]">Scroll to watch it rise ↓</p>
    </section>
  );
}
