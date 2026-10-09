import * as THREE from "three";
import { rng } from "@/lib/anim";

/** Procedural canvas textures — painted at boot, nothing downloaded. */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, srgb = true, wrap = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/**
 * Hospital glazing band for one floor: pale blue-green glass with slim
 * mullions, plus an emissive map of ward windows that light up at night.
 */
export function glazingTextures(bays: number, seed: number) {
  const W = 1024;
  const H = 128;
  const [c, ctx] = canvas(W, H);
  const [e, ectx] = canvas(W, H);
  const r = rng(seed);
  const bw = W / bays;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#9fbfc2");
  g.addColorStop(0.55, "#5f8288");
  g.addColorStop(1, "#3c5a60");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ectx.fillStyle = "#000";
  ectx.fillRect(0, 0, W, H);

  for (let x = 0; x < bays; x++) {
    // blinds half-drawn in some rooms
    if (r() > 0.6) {
      ctx.fillStyle = "rgba(235,240,238,0.35)";
      ctx.fillRect(x * bw + 3, 4, bw - 6, 10 + r() * 40);
    }
    if (r() > 0.3) {
      const warm = r() > 0.35;
      ectx.fillStyle = warm ? `hsl(${36 + r() * 8}, 85%, ${62 + r() * 18}%)` : `hsl(185, 50%, ${70 + r() * 15}%)`;
      ectx.globalAlpha = 0.45 + r() * 0.55;
      ectx.fillRect(x * bw + 2, 6, bw - 4, H - 12);
    }
  }
  ectx.globalAlpha = 1;
  ctx.fillStyle = "#e8eeec";
  ectx.fillStyle = "#000";
  for (let x = 0; x <= bays; x++) {
    ctx.fillRect(x * bw - 1.5, 0, 3, H);
    ectx.fillRect(x * bw - 1.5, 0, 3, H);
  }
  return { map: tex(c), emissive: tex(e) };
}

/** distant city windows — dense grid (emissive) */
export function skylineTexture() {
  const [c, ctx] = canvas(128, 256);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 256);
  const r = rng(77);
  for (let y = 4; y < 256; y += 10) {
    for (let x = 4; x < 128; x += 9) {
      if (r() > 0.55) {
        ctx.fillStyle = r() > 0.3 ? "#ffcf8a" : "#bfe1ff";
        ctx.globalAlpha = 0.4 + r() * 0.6;
        ctx.fillRect(x, y, 5, 5);
      }
    }
  }
  return tex(c);
}

/** distant towers by day */
export function skylineDayTexture() {
  const [c, ctx] = canvas(128, 256);
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "#c9d2d6");
  g.addColorStop(1, "#9aa8ae");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const r = rng(91);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = "rgba(60,75,82,0.35)";
    ctx.fillRect(0, y, 128, 3);
    for (let x = 0; x < 128; x += 9) {
      ctx.fillStyle = `rgba(70,95,105,${0.1 + r() * 0.2})`;
      ctx.fillRect(x + 1, y + 3, 7, 7);
    }
  }
  return tex(c);
}

/** rooftop helipad: H in a circle with touchdown ring */
export function helipadTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = "#3d4547";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#f2f5f4";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#f2c94c";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f2f5f4";
  ctx.fillRect(176, 146, 40, 220);
  ctx.fillRect(296, 146, 40, 220);
  ctx.fillRect(216, 236, 80, 40);
  return tex(c, true, false);
}

/** illuminated fascia sign; white letters on transparent, used as alpha + emissive */
export function signTexture(text: string, w = 1024, h = 128, font = "600 78px Manrope, Arial, sans-serif") {
  const [c, ctx] = canvas(w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "18px";
  ctx.fillText(text, w / 2, h / 2 + 4);
  return tex(c, true, false);
}

/** a medical cross */
export function crossTexture() {
  const [c, ctx] = canvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#fff";
  ctx.fillRect(44, 12, 40, 104);
  ctx.fillRect(12, 44, 104, 40);
  return tex(c, true, false);
}

/** soft round sprite for lamps / stars */
export function softDot(inner = "rgba(255,255,255,1)", mid = "rgba(255,255,255,0.4)") {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return tex(c, true, false);
}
