import * as THREE from "three";
import { rng } from "@/lib/anim";
import { pbr } from "./pbr";
import { skylineDayTexture, skylineTexture, softDot } from "./textures";
import { PODIUM, TOWER } from "./hospital";

/**
 * Riverside health campus (metres). The hospital sits at the origin facing +z;
 * a city road runs east–west in front, and the ambulance route peels off it
 * into the emergency bay under the canopy at the podium's west end.
 */

export const MAIN_Z = 72;
export const ER_BAY = new THREE.Vector3(-24, 0, 25);

export const AMB_ROUTE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-320, 0, MAIN_Z + 3),
    new THREE.Vector3(-170, 0, MAIN_Z + 3),
    new THREE.Vector3(-80, 0, MAIN_Z + 3),
    new THREE.Vector3(-46, 0, MAIN_Z - 4),
    new THREE.Vector3(-30, 0, 52),
    new THREE.Vector3(-25, 0, 38),
    ER_BAY.clone(),
  ],
  false,
  "centripetal",
);

const PLAZA = { x0: -60, x1: 62, z0: -40, z1: 58 };

/** flat strip following a curve */
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, segs = 160) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const side = new THREE.Vector3();
  const len = curve.getLength();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(u, p);
    curve.getTangentAt(Math.min(u, 0.999), t);
    side.set(t.z, 0, -t.x).normalize().multiplyScalar(width / 2);
    pos.push(p.x - side.x, y, p.z - side.z, p.x + side.x, y, p.z + side.z);
    uv.push(0, (u * len) / width, 1, (u * len) / width);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildCampus(small: boolean) {
  const group = new THREE.Group();

  /* ground */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3200, 3200).rotateX(-Math.PI / 2),
    pbr("aerial_grass_rock", 160, 160, { color: "#a9c98a" }),
  );
  ground.receiveShadow = true;
  group.add(ground);

  /* plaza */
  const pw = PLAZA.x1 - PLAZA.x0;
  const pd = PLAZA.z1 - PLAZA.z0;
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(pw, 0.3, pd),
    pbr("rough_concrete", pw / 8, pd / 8, { color: "#e4e2dc" }),
  );
  plaza.position.set((PLAZA.x0 + PLAZA.x1) / 2, 0.15, (PLAZA.z0 + PLAZA.z1) / 2);
  plaza.receiveShadow = true;
  group.add(plaza);

  /* roads */
  const asphalt = pbr("asphalt_02", 4, 300, { color: "#8a8c8e" });
  const main = new THREE.Mesh(new THREE.PlaneGeometry(14, 2400).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), asphalt);
  main.position.set(0, 0.06, MAIN_Z);
  main.receiveShadow = true;
  const drive = new THREE.Mesh(ribbon(AMB_ROUTE, 8, 0.34), pbr("asphalt_02", 1, 1, { color: "#7d8083" }));
  drive.receiveShadow = true;
  group.add(main, drive);

  // emergency lane: coral chevrons painted on the drive's last stretch
  const laneMat = new THREE.MeshStandardMaterial({ color: "#e8574d", roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const u = 0.8 + i * 0.03;
    const p = AMB_ROUTE.getPointAt(u);
    const t = AMB_ROUTE.getTangentAt(u);
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 0.5), laneMat);
    m.position.set(p.x, 0.36, p.z);
    m.rotation.y = Math.atan2(t.x, t.z);
    group.add(m);
  }

  /* trees */
  const r = rng(11);
  const spots: THREE.Vector3[] = [];
  const free = (x: number, z: number) =>
    !(x > PLAZA.x0 - 4 && x < PLAZA.x1 + 4 && z > PLAZA.z0 - 4 && z < PLAZA.z1 + 4) &&
    Math.abs(z - MAIN_Z) > 11;
  // avenue along the road
  for (let x = -300; x <= 300; x += 14) {
    for (const z of [MAIN_Z - 10, MAIN_Z + 10]) if (Math.abs(x + 40) > 14 || z > MAIN_Z) spots.push(new THREE.Vector3(x, 0, z));
  }
  // healing garden + scattered parkland
  const scatter = small ? 220 : 420;
  for (let i = 0; i < scatter * 4 && spots.length < scatter + 90; i++) {
    const a = r() * Math.PI * 2;
    const d = 70 + Math.pow(r(), 0.7) * 300;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d - 20;
    if (free(x, z)) spots.push(new THREE.Vector3(x, 0, z));
  }
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 5).translate(0, 1.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1).translate(0, 1, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: "#5b4636", roughness: 1 }), spots.length);
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, flatShading: true }),
    spots.length,
  );
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  spots.forEach((s, i) => {
    const sc = 0.8 + r() * 0.7;
    o.position.copy(s);
    o.rotation.set(0, r() * 6, 0);
    o.scale.setScalar(sc);
    o.updateMatrix();
    trunks.setMatrixAt(i, o.matrix);
    o.position.y = 2.4 * sc;
    o.scale.set(3.2 * sc, 3.6 * sc * (0.9 + r() * 0.4), 3.2 * sc);
    o.updateMatrix();
    crowns.setMatrixAt(i, o.matrix);
    crowns.setColorAt(i, col.setHSL(0.25 + r() * 0.07, 0.45 + r() * 0.2, 0.17 + r() * 0.08));
  });
  trunks.castShadow = crowns.castShadow = true;
  crowns.receiveShadow = true;
  group.add(trunks, crowns);

  /* distant city */
  const CITY = small ? 110 : 200;
  const cityMat = new THREE.MeshStandardMaterial({
    map: skylineDayTexture(),
    emissiveMap: skylineTexture(),
    emissive: new THREE.Color("#ffffff"),
    emissiveIntensity: 0,
    roughness: 0.8,
  });
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), cityMat, CITY);
  for (let i = 0; i < CITY; i++) {
    const a = r() * Math.PI * 2;
    // the river side (north) stays open
    if (Math.sin(a) < -0.55) {
      i--;
      continue;
    }
    const d = 420 + r() * 520;
    o.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    o.rotation.set(0, r() * 3, 0);
    o.scale.set(18 + r() * 26, 14 + Math.pow(r(), 2) * 90, 18 + r() * 26);
    o.updateMatrix();
    city.setMatrixAt(i, o.matrix);
  }
  group.add(city);

  /* river to the north */
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 140).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#4f7f86", roughness: 0.08, metalness: 0.6 }),
  );
  river.position.set(0, 0.1, -260);
  group.add(river);

  /* street & path lamps */
  const lampPos: number[] = [];
  for (let x = -400; x <= 400; x += 22) lampPos.push(x, 6, MAIN_Z - 8, x + 11, 6, MAIN_Z + 8);
  for (let x = PLAZA.x0 + 4; x <= PLAZA.x1; x += 12) lampPos.push(x, 3.5, PLAZA.z1 - 2);
  for (let z = PLAZA.z0 + 6; z <= PLAZA.z1; z += 12) lampPos.push(PLAZA.x0 + 2, 3.5, z, PLAZA.x1 - 2, 3.5, z);
  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute("position", new THREE.Float32BufferAttribute(lampPos, 3));
  const lampMat = new THREE.PointsMaterial({
    size: 2.6,
    map: softDot("rgba(255,226,170,1)", "rgba(255,190,110,0.35)"),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lamps = new THREE.Points(lampGeo, lampMat);
  group.add(lamps);

  /* blueprint footprint drawn on the plaza before the building rises */
  const lines: number[] = [];
  const rect = (x: number, z: number, w: number, d: number) => {
    const a = [x - w / 2, z - d / 2];
    const b = [x + w / 2, z + d / 2];
    lines.push(a[0], 0, a[1], b[0], 0, a[1], b[0], 0, a[1], b[0], 0, b[1], b[0], 0, b[1], a[0], 0, b[1], a[0], 0, b[1], a[0], 0, a[1]);
  };
  rect(PODIUM.x, PODIUM.z, PODIUM.w, PODIUM.d);
  rect(TOWER.x, TOWER.z, TOWER.w, TOWER.d);
  rect(TOWER.x, TOWER.z, TOWER.w + 6, TOWER.d + 6);
  for (let x = PLAZA.x0; x <= PLAZA.x1; x += 6) lines.push(x, 0, PLAZA.z0, x, 0, PLAZA.z1);
  for (let z = PLAZA.z0; z <= PLAZA.z1; z += 6) lines.push(PLAZA.x0, 0, z, PLAZA.x1, 0, z);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const gridMat = new THREE.LineBasicMaterial({
    color: "#7fe3d6",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const grid = new THREE.LineSegments(gridGeo, gridMat);
  grid.position.y = 0.36;
  grid.renderOrder = 2;
  group.add(grid);

  function update(night: number, gridK: number) {
    cityMat.emissiveIntensity = night * 1.4;
    lampMat.opacity = night;
    gridMat.opacity = gridK * 0.85;
    grid.visible = gridK > 0.01;
  }

  return { group, update };
}
