/**
 * Shared, mutable state between the scroll system (GSAP) and the WebGL world.
 * Written by ScrollTriggers, read every frame by the scene — kept outside React
 * so scrolling never triggers a re-render.
 */
export const stage = {
  /** 0 → 1 across the whole page; the scene derives everything from this */
  progress: 0,
  /** Lenis scroll velocity, px/frame */
  velocity: 0,
  /** pointer in -1..1 */
  px: 0,
  py: 0,
  /** set once the loader curtain lifts */
  ready: false,
  /** "simple view": the world stops rendering */
  paused: false,
};

/**
 * Story beats — each <section data-beat="key"> maps its scroll range onto one
 * of these progress windows. Scene choreography keys off them.
 */
export const BEATS = {
  hero: [0, 0.08],
  build: [0.08, 0.28],
  emergency: [0.28, 0.42],
  departments: [0.42, 0.62],
  technology: [0.62, 0.74],
  doctors: [0.74, 0.84],
  night: [0.84, 0.94],
  contact: [0.94, 1],
} as const;

export type Beat = keyof typeof BEATS;

/**
 * Which department is in focus at progress p, as a float 0..4 — shared by the
 * scene (lit floor) and the HTML list so both always agree.
 */
export function deptAt(p: number) {
  const t = (p - 0.455) / (0.6 - 0.455);
  return Math.min(Math.max(t * 5 - 0.5, 0), 4);
}
