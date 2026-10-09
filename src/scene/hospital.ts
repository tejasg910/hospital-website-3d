import * as THREE from "three";
import { clamp, smooth } from "@/lib/anim";
import { crossTexture, glazingTextures, helipadTexture, signTexture } from "./textures";

/**
 * Kavira Hospital: a three-storey podium (emergency, imaging, theatres) with an
 * eight-storey ward tower on top. Floors drop into place one by one, the
 * tower can "explode" vertically to reveal a department, and everything glows
 * at night.
 */

export const PODIUM = { x: 0, z: 0, w: 66, d: 34, floors: 3, fh: 4.4 };
export const TOWER = { x: 8, z: -2, w: 38, d: 20, floors: 8, fh: 3.8 };
export const TOWER_Y = PODIUM.floors * PODIUM.fh;
export const TOWER_TOP = TOWER_Y + TOWER.floors * TOWER.fh;
export const FLOORS = PODIUM.floors + TOWER.floors;
/** tower floor of each department, in DEPARTMENTS order */
export const DEPT_FLOORS = [0, 1, 2, 3, 4];
/** vertical gap added between tower floors when fully exploded */
export const GAP = 3.4;

const SLAB = 0.55;

interface Floor {
  group: THREE.Group;
  baseY: number;
  glass: THREE.Mesh;
  fins: THREE.InstancedMesh;
  inner: THREE.Mesh;
  innerMat: THREE.MeshBasicMaterial;
  glassMats: THREE.MeshStandardMaterial[];
}

export function buildHospital(small: boolean) {
  const group = new THREE.Group();

  const white = new THREE.MeshStandardMaterial({ color: "#eef1ef", roughness: 0.55 });
  const slabMat = new THREE.MeshStandardMaterial({ color: "#e9ecea", roughness: 0.6 });
  const finMat = new THREE.MeshStandardMaterial({ color: "#f6f7f4", roughness: 0.4 });
  const hidden = new THREE.MeshBasicMaterial({ visible: false });

  const floors: Floor[] = [];
  const o = new THREE.Object3D();

  function makeFloor(b: typeof PODIUM, level: number, baseY: number, seed: number) {
    const fg = new THREE.Group();
    fg.position.set(b.x, baseY, b.z);
    const gh = b.fh - SLAB;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w + 1.4, SLAB, b.d + 1.4).translate(0, SLAB / 2, 0), slabMat);
    slab.castShadow = slab.receiveShadow = true;

    const glassMats: THREE.MeshStandardMaterial[] = [];
    const mk = (bays: number, s: number) => {
      const t = glazingTextures(bays, s);
      const m = new THREE.MeshStandardMaterial({
        map: t.map,
        emissiveMap: t.emissive,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0,
        metalness: 0.4,
        roughness: 0.12,
        envMapIntensity: 1.3,
        transparent: true,
        opacity: 0.86,
      });
      glassMats.push(m);
      return m;
    };
    const long = mk(Math.round(b.w / 3), seed);
    const short = mk(Math.round(b.d / 3), seed + 50);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, gh, b.d).translate(0, gh / 2, 0),
      [short, short, hidden, hidden, long, long],
    );
    glass.position.y = SLAB;
    glass.castShadow = true;
    glass.renderOrder = 1;

    // interior volume: seen through the glass, lit per department
    const innerMat = new THREE.MeshBasicMaterial({
      color: "#fff4e0",
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      toneMapped: false,
    });
    const inner = new THREE.Mesh(new THREE.BoxGeometry(b.w - 1.6, gh - 0.4, b.d - 1.6).translate(0, gh / 2, 0), innerMat);
    inner.position.y = SLAB + 0.2;

    // vertical brise-soleil fins every 3 m — the building's signature
    const fx = Math.floor(b.w / 3) + 1;
    const fz = Math.floor(b.d / 3) + 1;
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, gh, 1.1).translate(0, gh / 2, 0), finMat, fx * 2 + fz * 2);
    let k = 0;
    for (let i = 0; i < fx; i++) {
      const x = -b.w / 2 + (i * b.w) / (fx - 1);
      for (const s of [-1, 1]) {
        o.position.set(x, 0, s * (b.d / 2 + 0.55));
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        fins.setMatrixAt(k++, o.matrix);
      }
    }
    for (let i = 0; i < fz; i++) {
      const z = -b.d / 2 + (i * b.d) / (fz - 1);
      for (const s of [-1, 1]) {
        o.position.set(s * (b.w / 2 + 0.55), 0, z);
        o.rotation.set(0, Math.PI / 2, 0);
        o.updateMatrix();
        fins.setMatrixAt(k++, o.matrix);
      }
    }
    fins.position.y = SLAB;
    fins.castShadow = true;

    fg.add(slab, inner, glass, fins);
    group.add(fg);
    floors[level] = { group: fg, baseY, glass, fins, inner, innerMat, glassMats };
  }

  for (let i = 0; i < PODIUM.floors; i++) makeFloor(PODIUM, i, i * PODIUM.fh, 10 + i);
  for (let i = 0; i < TOWER.floors; i++) makeFloor(TOWER, PODIUM.floors + i, TOWER_Y + i * TOWER.fh, 40 + i);

  /* podium roof: healing garden */
  const podRoof = new THREE.Group();
  const podSlab = new THREE.Mesh(new THREE.BoxGeometry(PODIUM.w + 1.4, 0.7, PODIUM.d + 1.4), white);
  podSlab.position.y = 0.35;
  podSlab.receiveShadow = true;
  const lawn = new THREE.Mesh(
    new THREE.BoxGeometry(PODIUM.w - 4, 0.3, PODIUM.d - 4),
    new THREE.MeshStandardMaterial({ color: "#7d9a5f", roughness: 1 }),
  );
  lawn.position.y = 0.85;
  lawn.receiveShadow = true;
  podRoof.add(podSlab, lawn);
  podRoof.position.set(PODIUM.x, TOWER_Y - 0.01, PODIUM.z);
  group.add(podRoof);

  /* stair & lift core on the tower's east end — leads the structure up */
  const coreMat = new THREE.MeshStandardMaterial({ color: "#f0f2ef", roughness: 0.7 });
  const core = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 12).translate(0, 0.5, 0), coreMat);
  core.position.set(TOWER.x + TOWER.w / 2 + 3.4, 0, TOWER.z);
  core.castShadow = core.receiveShadow = true;
  group.add(core);

  /* roof crown + helipad */
  const roof = new THREE.Group();
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(TOWER.w + 1.4, 0.8, TOWER.d + 1.4), white);
  roofSlab.position.y = 0.4;
  roofSlab.castShadow = true;
  const plant = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 8), white);
  plant.position.set(-12, 2.3, 0);
  plant.castShadow = true;
  const PAD_R = 10.5;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(PAD_R, PAD_R, 0.6, 48), white);
  deck.position.set(5, 3.6, 0);
  deck.castShadow = true;
  const padTop = new THREE.Mesh(
    new THREE.CircleGeometry(PAD_R - 0.3, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: helipadTexture(), roughness: 0.8 }),
  );
  padTop.position.set(5, 3.92, 0);
  padTop.receiveShadow = true;
  const struts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.25, 3.2, 6), white, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    o.position.set(5 + Math.cos(a) * 7, 1.9, Math.sin(a) * 7);
    o.rotation.set(0, 0, 0);
    o.updateMatrix();
    struts.setMatrixAt(i, o.matrix);
  }
  const padLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#7fe3d6") });
  const padLights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), padLightMat, 16);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    o.position.set(5 + Math.cos(a) * (PAD_R - 0.1), 4.05, Math.sin(a) * (PAD_R - 0.1));
    o.updateMatrix();
    padLights.setMatrixAt(i, o.matrix);
  }
  // brand sign on the crown's south face
  const brandMat = new THREE.MeshBasicMaterial({ map: signTexture("KAVIRA", 1024, 160, "500 120px Fraunces, Georgia, serif"), transparent: true, depthWrite: false });
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.1), brandMat);
  brand.position.set(-6, 2.4, TOWER.d / 2 + 0.75);
  const crossMat = new THREE.MeshBasicMaterial({ map: crossTexture(), transparent: true, depthWrite: false, color: "#7fe3d6" });
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), crossMat);
  cross.position.set(-19.5 + 2.6, 2.4, TOWER.d / 2 + 0.75);
  roof.add(roofSlab, plant, deck, padTop, struts, padLights, brand, cross);
  roof.position.set(TOWER.x, TOWER_TOP, TOWER.z);
  group.add(roof);
  const HELI_LOCAL = new THREE.Vector3(5, 3.95, 0);

  /* emergency canopy at the podium's west end */
  const canopy = new THREE.Group();
  const cw = 20;
  const cd = 13;
  const canopySlab = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.7, cd), white);
  canopySlab.position.set(0, 5.6, cd / 2);
  canopySlab.castShadow = true;
  const soffit = new THREE.Mesh(
    new THREE.PlaneGeometry(cw - 2, cd - 2).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#eaf6ff") }),
  );
  soffit.position.set(0, 5.24, cd / 2);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.28, 5.4, 8).translate(0, 2.7, 0), white, 2);
  [-cw / 2 + 1.2, cw / 2 - 1.2].forEach((x, i) => {
    o.position.set(x, 0, cd - 1);
    o.updateMatrix();
    posts.setMatrixAt(i, o.matrix);
  });
  const coral = new THREE.Color("#ff5a4e");
  const erMat = new THREE.MeshBasicMaterial({ map: signTexture("EMERGENCY"), transparent: true, depthWrite: false, color: coral.clone() });
  const erSign = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.75), erMat);
  erSign.position.set(0, 5.6, cd + 0.37);
  const erCrossMat = new THREE.MeshBasicMaterial({ map: crossTexture(), transparent: true, depthWrite: false, color: coral.clone() });
  const erCross = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), erCrossMat);
  erCross.position.set(-8.4, 5.6, cd + 0.37);
  canopy.add(canopySlab, soffit, posts, erSign, erCross);
  canopy.position.set(-24, 0, PODIUM.d / 2 + 0.7);
  group.add(canopy);

  /* main entrance: a wide white portico centred on the tower */
  const portico = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 7), white);
  portico.position.set(TOWER.x, 4.6, PODIUM.d / 2 + 4.2);
  portico.castShadow = true;
  group.add(portico);

  const allGlass = floors.flatMap((f) => f.glassMats);
  const white3 = new THREE.Color("#ffffff");
  const deptCol = new THREE.Color();
  const warm = new THREE.Color("#fff1d6");
  const tmpC = new THREE.Color();

  /**
   * @param sF      structure progress in floors (0..FLOORS)
   * @param top     0..1 roof crown + helipad
   * @param entry   0..1 canopy & portico
   * @param explode 0..1 tower floors spread apart
   * @param glow    per tower floor 0..1 department highlight
   * @param colors  per tower floor highlight colour (hex) or null
   */
  function update(
    sF: number,
    top: number,
    entry: number,
    explode: number,
    glow: number[],
    colors: (string | null)[],
    night: number,
    time: number,
  ) {
    for (let i = 0; i < FLOORS; i++) {
      const f = floors[i];
      const local = clamp(sF - i);
      const drop = smooth(clamp(local * 1.6));
      const clad = smooth(clamp(local * 2 - 0.9));
      const t = i - PODIUM.floors;
      const lift = t >= 0 ? t * GAP * explode : 0;
      f.group.visible = local > 0.001;
      f.group.position.y = f.baseY + (1 - drop) * 14 + lift;
      f.glass.scale.y = Math.max(clad, 0.0001);
      f.fins.scale.y = Math.max(clad, 0.0001);
      f.inner.visible = clad > 0.05;

      const g = t >= 0 ? glow[t] ?? 0 : 0;
      const c = t >= 0 ? colors[t] : null;
      if (c) deptCol.set(c);
      else deptCol.copy(warm);
      tmpC.copy(warm).lerp(deptCol, g);
      f.innerMat.color.copy(tmpC).multiplyScalar(0.55 + g * 0.9 + night * 0.4);
      f.innerMat.opacity = 0.06 + g * 0.9 + night * 0.15 + explode * 0.1;
      const op = 0.86 - g * 0.5;
      for (const m of f.glassMats) m.opacity = op;
    }

    const t = smooth(clamp(top));
    roof.visible = t > 0.001;
    roof.scale.setScalar(Math.max(t, 0.0001));
    roof.position.y = TOWER_TOP + TOWER.floors * GAP * explode;
    podRoof.visible = sF > PODIUM.floors - 0.3;

    // core leads the floors up by ~1.5 storeys
    const coreH = sF <= PODIUM.floors ? (sF + 1.5) * PODIUM.fh : TOWER_Y + (sF - PODIUM.floors + 1.5) * TOWER.fh;
    core.scale.y = Math.max(Math.min(coreH, TOWER_TOP + 5) + TOWER.floors * GAP * explode, 0.01);

    const e = smooth(clamp(entry));
    canopy.visible = portico.visible = e > 0.001;
    canopy.scale.set(1, Math.max(e, 0.0001), 1);
    portico.scale.set(Math.max(e, 0.0001), 1, 1);

    for (const m of allGlass) m.emissiveIntensity = night * 1.25;

    const pulse = 0.65 + 0.35 * Math.sin(time * 2.2);
    erMat.color.copy(coral).multiplyScalar(1 + night * 4 * pulse);
    erCrossMat.color.copy(coral).multiplyScalar(1 + night * 4 * pulse);
    brandMat.color.copy(white3).multiplyScalar(0.9 + night * 1.6);
    crossMat.color.set("#7fe3d6").multiplyScalar(1 + night * 2);
    padLightMat.color.set("#7fe3d6").multiplyScalar(0.4 + night * 3 * (Math.sin(time * 4) > 0 ? 1 : 0.35));
  }

  /** world position of the helipad touchdown point */
  const helipad = (out: THREE.Vector3) => out.copy(HELI_LOCAL).multiply(roof.scale).add(roof.position);

  /** world-space centre height of a tower floor (with explode) */
  const floorY = (t: number, explode: number) => TOWER_Y + (t + 0.5) * TOWER.fh + t * GAP * explode;

  update(0, 0, 0, 0, [], [], 0, 0);
  void small;
  return { group, update, helipad, floorY };
}
