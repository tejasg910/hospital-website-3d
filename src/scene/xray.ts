import * as THREE from "three";
import { PODIUM, TOWER, TOWER_Y } from "./hospital";

/**
 * "Diagnostic scan": a horizontal front sweeps down the world; everything it
 * has passed renders as an x-ray — dark navy with glowing cyan edges and a
 * measurement grid. A second front sweeps it back to reality. Shared uniforms
 * mean one value drives every patched material.
 */
export const xray = {
  uIn: { value: 999 },
  uOut: { value: 999 },
  uTime: { value: 0 },
};

const patched = new WeakSet<THREE.Material>();

function patch(mat: THREE.Material) {
  if (patched.has(mat)) return;
  patched.add(mat);
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${prevKey()}|xray`;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, xray);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vXrWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 xrW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          xrW = instanceMatrix * xrW;
        #endif
        vXrWorld = (modelMatrix * xrW).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vXrWorld;
        uniform float uIn;
        uniform float uOut;
        uniform float uTime;
        float xrGrid(vec3 p, float s, float w) {
          vec3 g = abs(fract(p / s - 0.5) - 0.5) * s;
          float m = min(min(g.x, g.y), g.z);
          return 1.0 - smoothstep(0.0, w, m);
        }`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        {
          float y = vXrWorld.y;
          float k = smoothstep(uIn - 1.5, uIn + 1.5, y) * (1.0 - smoothstep(uOut - 1.5, uOut + 1.5, y));
          if (k > 0.001) {
            vec3 n = normalize(normal);
            float fres = pow(1.0 - abs(dot(n, normalize(vViewPosition))), 3.0) * 0.7;
            float major = xrGrid(vXrWorld, 4.0, 0.06);
            vec3 ink = vec3(0.45, 0.95, 0.9);
            vec3 xr = vec3(0.01, 0.05, 0.08) + ink * (fres * 0.9 + major * 0.22);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, xr, k);
            gl_FragColor.a = mix(gl_FragColor.a, max(gl_FragColor.a, 0.55), k);
          }
          float edge = exp(-abs(y - uIn) * 1.4) + exp(-abs(y - uOut) * 1.4);
          gl_FragColor.rgb += vec3(0.5, 1.0, 0.95) * edge * 1.4;
        }`,
      );
  };
  mat.needsUpdate = true;
}

/** patch every standard material under an object */
export function patchXray(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mat) => {
      if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) patch(mat);
    });
  });
}

/**
 * Wireframe holograms of the hospital's equipment, drawn through walls
 * (depthTest off) so the scan "sees inside": MRI, CT, robotic theatre,
 * cath lab, and a heartbeat trace running along the podium.
 */
export function buildEquipment() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color("#7ff5e8").multiplyScalar(1.6),
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), mat);
    l.position.set(x, y, z);
    l.rotation.y = ry;
    l.renderOrder = 10;
    group.add(l);
    geo.dispose();
    return l;
  };

  const y0 = 0.6;
  // MRI: thick ring + couch
  add(new THREE.TorusGeometry(2.0, 0.9, 10, 28), -18, y0 + 2.3, -4, Math.PI / 2);
  add(new THREE.BoxGeometry(0.9, 0.6, 5), -18, y0 + 1.1, -1.5);
  // CT: slim ring + couch
  add(new THREE.TorusGeometry(1.6, 0.35, 8, 28), -6, y0 + 2.0, -4, Math.PI / 2);
  add(new THREE.BoxGeometry(0.8, 0.5, 4.5), -6, y0 + 1.0, -1.8);
  // theatre (level 2): table, lamp discs, robot arms
  const ty = PODIUM.fh + y0;
  add(new THREE.BoxGeometry(1.0, 0.9, 2.6), 14, ty + 0.9, 0);
  add(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 18), 13, ty + 3.2, -0.6);
  add(new THREE.CylinderGeometry(0.9, 0.9, 0.25, 18), 15.2, ty + 3.3, 0.8);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.18, 0.25, 2.2, 8), 14 + s * 2, ty + 1.1, -2.4);
    const arm = add(new THREE.BoxGeometry(0.3, 0.3, 2.2), 14 + s * 1.5, ty + 2.3, -1.6);
    arm.rotation.x = 0.5;
  }
  // cath lab (tower level 4): C-arm
  const cy = TOWER_Y + y0;
  add(new THREE.TorusGeometry(1.5, 0.15, 6, 24, Math.PI * 1.2), TOWER.x - 8, cy + 1.8, TOWER.z, 0);
  add(new THREE.BoxGeometry(0.8, 0.8, 2.6), TOWER.x - 8, cy + 0.8, TOWER.z);

  // heartbeat trace wrapped around the podium
  const pts: number[] = [];
  const W = PODIUM.w + 4;
  const N = 220;
  const ecg = (u: number) => {
    const t = (u * 7) % 1;
    if (t > 0.42 && t < 0.46) return (t - 0.42) * 30;
    if (t > 0.46 && t < 0.5) return 1.2 - (t - 0.46) * 60;
    if (t > 0.5 && t < 0.54) return -1.2 + (t - 0.5) * 30;
    if (t > 0.62 && t < 0.72) return Math.sin(((t - 0.62) / 0.1) * Math.PI) * 0.35;
    return 0;
  };
  for (let i = 0; i < N; i++) {
    const a = i / N;
    const b = (i + 1) / N;
    pts.push(-W / 2 + a * W, 9 + ecg(a) * 2.4, PODIUM.d / 2 + 2, -W / 2 + b * W, 9 + ecg(b) * 2.4, PODIUM.d / 2 + 2);
  }
  const ecgGeo = new THREE.BufferGeometry();
  ecgGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const ecgMat = mat.clone();
  const trace = new THREE.LineSegments(ecgGeo, ecgMat);
  trace.renderOrder = 10;
  group.add(trace);
  group.visible = false;

  return {
    group,
    update(k: number, time: number) {
      group.visible = k > 0.01;
      mat.opacity = k;
      // trace "draws" by sliding the visible range
      ecgGeo.setDrawRange(0, Math.floor((((time * 0.35) % 1) * N + 30) * 2));
      ecgMat.opacity = k;
    },
  };
}
