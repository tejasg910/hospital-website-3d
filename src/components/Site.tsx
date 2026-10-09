"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { BEATS, deptAt, stage, type Beat } from "@/lib/stage";
import { clamp } from "@/lib/anim";
import SceneCanvas from "./SceneCanvas";
import Header from "./Header";
import Hero from "./sections/Hero";
import Build from "./sections/Build";
import Emergency from "./sections/Emergency";
import Departments from "./sections/Departments";
import Technology from "./sections/Technology";
import Doctors from "./sections/Doctors";
import Night from "./sections/Night";
import Contact from "./sections/Contact";

gsap.registerPlugin(ScrollTrigger, SplitText);

const SIMPLE_KEY = "kavira-simple";

/* "simple view" lives on <html class="simple">; React just subscribes to it */
const simpleListeners = new Set<() => void>();
const subscribeSimple = (cb: () => void) => {
  simpleListeners.add(cb);
  return () => simpleListeners.delete(cb);
};
const isSimple = () => document.documentElement.classList.contains("simple");
function setSimpleView(on: boolean) {
  stage.paused = on;
  document.documentElement.classList.toggle("simple", on);
  try {
    localStorage.setItem(SIMPLE_KEY, on ? "1" : "0");
  } catch {}
  simpleListeners.forEach((cb) => cb());
}

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  const loadTarget = useRef(0);
  const simple = useSyncExternalStore(subscribeSimple, isSimple, () => false);

  const onProgress = useCallback((f: number) => {
    loadTarget.current = Math.max(loadTarget.current, f);
  }, []);

  const toggleSimple = useCallback(() => setSimpleView(!stage.paused), []);

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(SIMPLE_KEY) === "1";
    } catch {}
    if (saved) setSimpleView(true);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // dev aid: ?scene hides the HTML layer to inspect the 3D world
    if (new URLSearchParams(location.search).has("scene")) document.documentElement.classList.add("scene-only");
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    /* ------------------------------------------------ smooth scroll */
    const lenis = reduce ? null : new Lenis({ lerp: 0.08, wheelMultiplier: 0.85 });
    const onTick = (t: number) => lenis?.raf(t * 1000);
    if (lenis) {
      lenis.on("scroll", (l: Lenis) => {
        stage.velocity = l.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    } else {
      document.documentElement.style.overflow = "hidden";
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const target = a.getAttribute("href")!;
      const el = target === "#top" ? document.body : document.querySelector<HTMLElement>(target);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target === "#top" ? 0 : el, { duration: 2.2 });
      else el.scrollIntoView();
    };
    document.addEventListener("click", onAnchor);

    const onPointer = (e: PointerEvent) => {
      stage.px = (e.clientX / window.innerWidth) * 2 - 1;
      stage.py = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const ctx = gsap.context(() => {
      /* ------------------------------------------------ cursor */
      const ring = document.querySelector<HTMLElement>(".cursor-ring")!;
      const dot = document.querySelector<HTMLElement>(".cursor-dot")!;
      const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
      const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
      const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
      const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
      const move = (e: PointerEvent) => {
        rx(e.clientX);
        ry(e.clientY);
        dx(e.clientX);
        dy(e.clientY);
        ring.classList.toggle("is-hover", !!(e.target as HTMLElement).closest("a, button, input, select, textarea, label"));
      };
      window.addEventListener("pointermove", move);

      /* ------------------------------------------------ loader → hero */
      gsap.set(".hero-line", { yPercent: 110 });
      gsap.set(".hero-fade", { autoAlpha: 0, y: 24 });
      const shown = { v: 0 };
      const countEl = document.querySelector(".loader-count");
      const barEl = document.querySelector<HTMLElement>(".loader-bar");
      const started = performance.now();
      let lifted = false;
      const lift = () => {
        if (lifted) return;
        lifted = true;
        gsap.ticker.remove(loadTick);
        gsap
          .timeline()
          .to(".loader-inner", { autoAlpha: 0, y: -20, duration: 0.5 })
          .to(".loader", { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=0.1")
          .add(() => {
            stage.ready = true;
            if (lenis) lenis.start();
            else document.documentElement.style.overflow = "";
          }, "-=0.6")
          .to(".hero-line", { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12 }, "-=0.6")
          .to(".hero-fade", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, "-=1");
      };
      const loadTick = () => {
        // simple view needs no world: count straight up
        if (stage.paused) loadTarget.current = 1;
        shown.v += (loadTarget.current - shown.v) * 0.08;
        if (countEl) countEl.textContent = String(Math.round(shown.v * 100)).padStart(3, "0");
        if (barEl) barEl.style.transform = `scaleX(${shown.v})`;
        const elapsed = performance.now() - started;
        if ((shown.v > 0.985 && elapsed > 1200) || elapsed > 12000) lift();
      };
      gsap.ticker.add(loadTick);

      /* ------------------------------------------------ generic reveals */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 105,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 36,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = Math.round(o.v).toLocaleString("en-IN");
          },
        });
      });

      /* ------------------------------------------------ departments follow the lit floor */
      const deptItems = gsap.utils.toArray<HTMLElement>(".dept-item");
      const deptCards = gsap.utils.toArray<HTMLElement>(".dept-card");
      let deptActive = -1;
      const deptSync = () => {
        const i = Math.round(deptAt(stage.progress));
        if (i === deptActive) return;
        deptActive = i;
        deptItems.forEach((el, k) => el.classList.toggle("is-active", k === i));
        deptCards.forEach((el, k) => {
          el.setAttribute("aria-hidden", String(k !== i));
          gsap.to(el, { autoAlpha: k === i ? 1 : 0, y: k === i ? 0 : 14, duration: 0.6, ease: "power3.out" });
        });
      };
      gsap.ticker.add(deptSync);

      /* ------------------------------------------------ footer wordmark */
      const word = SplitText.create(".footer-word", { type: "chars" });
      gsap.from(word.chars, {
        yPercent: 100,
        stagger: 0.05,
        ease: "expo.out",
        duration: 1.4,
        scrollTrigger: { trigger: ".footer-word", start: "top 98%" },
      });

      /* ------------------------------------------------ scroll → world progress */
      // created last so every layout change above is already measured
      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]").map((sec, i, all) => {
        const key = sec.dataset.beat as Beat;
        const last = i === all.length - 1;
        const nextToLast = i === all.length - 2;
        const st = ScrollTrigger.create({
          trigger: sec,
          start: last ? "top bottom" : "top top",
          end: last || nextToLast ? "bottom bottom" : "bottom top",
        });
        return { st, range: BEATS[key] };
      });
      const sync = () => {
        const y = lenis ? lenis.scroll : window.scrollY;
        for (let i = 0; i < beats.length; i++) {
          const { st, range } = beats[i];
          if (y <= st.end || i === beats.length - 1) {
            const f = clamp((y - st.start) / Math.max(st.end - st.start, 1));
            stage.progress = range[0] + (range[1] - range[0]) * f;
            break;
          }
        }
        if (!lenis) stage.velocity = 0;
      };
      gsap.ticker.add(sync);

      return () => {
        window.removeEventListener("pointermove", move);
        gsap.ticker.remove(sync);
        gsap.ticker.remove(loadTick);
        gsap.ticker.remove(deptSync);
      };
    }, root);

    // fonts change line metrics → re-measure
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      document.removeEventListener("click", onAnchor);
      window.removeEventListener("pointermove", onPointer);
      if (lenis) {
        gsap.ticker.remove(onTick);
        lenis.destroy();
      }
    };
  }, []);

  return (
    <div ref={root}>
      <SceneCanvas onProgress={onProgress} />
      <div className="world-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="cursor-dot" aria-hidden="true" />

      {/* ---------------------------------------------------------- loader */}
      <div className="loader fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-ink)]">
        <div className="loader-inner w-[min(360px,76vw)]">
          <div className="flex items-end justify-between">
            <p className="display text-4xl">Kavira</p>
            <p className="loader-count mono text-base tabular-nums text-[var(--color-mint)]">000</p>
          </div>
          <div className="mt-5 h-[2px] w-full overflow-hidden rounded bg-white/10">
            <div className="loader-bar h-full origin-left scale-x-0 bg-[var(--color-mint)]" />
          </div>
          <p className="mono mt-4 text-[0.6rem] text-[var(--fg-mute)]">Preparing your visit</p>
        </div>
      </div>

      <Header simple={simple} onSimple={toggleSimple} />

      <main>
        <Hero />
        <Build />
        <Emergency />
        <Departments />
        <Technology />
        <Doctors />
        <Night />
        <Contact />
      </main>
    </div>
  );
}
