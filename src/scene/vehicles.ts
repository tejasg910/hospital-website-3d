import * as THREE from "three";
import { crossTexture } from "./textures";

/** Procedural ambulance and air-ambulance. Each `root` faces +Z. */

const WHITE = "#f4f6f5";
const CORAL = "#ff5a4e";

function shadowAll(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) m.castShadow = m.receiveShadow = true;
  });
}

export function buildAmbulance() {
  const root = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.35, metalness: 0.1 });
  const stripe = new THREE.MeshStandardMaterial({ color: CORAL, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1d2629", roughness: 0.15, metalness: 0.5 });
  const tyre = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 4.4), body);
  box.position.set(0, 1.85, -0.9);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.9), body);
  cab.position.set(0, 1.45, 2.25);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.8), body);
  hood.position.set(0, 1.05, 3.5);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.1), dark);
  glass.position.set(0, 1.95, 3.18);
  glass.rotation.x = -0.25;
  const side = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.32, 6.6), stripe);
  side.position.set(0, 1.25, 0.15);
  root.add(box, cab, hood, glass, side);

  // red crosses on the box sides
  const crossMat = new THREE.MeshBasicMaterial({ map: crossTexture(), transparent: true, color: CORAL });
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), crossMat);
    c.position.set(s * 1.21, 2.25, -0.9);
    c.rotation.y = (s * Math.PI) / 2;
    root.add(c);
  }

  // light bar: alternating red / blue
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff2a2a") });
  const blue = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2a7bff") });
  const lr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.35), red);
  lr.position.set(-0.5, 2.42, 2.4);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.35), blue);
  lb.position.set(0.5, 2.42, 2.4);
  root.add(lr, lb);
  const flash = new THREE.PointLight("#ff3a3a", 0, 18, 2);
  flash.position.set(0, 3.2, 2.4);
  root.add(flash);

  const wheels: THREE.Mesh[] = [];
  const wg = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16).rotateZ(Math.PI / 2);
  for (const z of [2.6, -2.2]) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(wg, tyre);
      w.position.set(s * 1.08, 0.48, z);
      wheels.push(w);
      root.add(w);
    }
  }
  shadowAll(root);

  const cRed = new THREE.Color("#ff2a2a");
  const cBlue = new THREE.Color("#2a7bff");
  return {
    root,
    roll(d: number) {
      for (const w of wheels) w.rotation.x = d / 0.48;
    },
    /** siren lights; k 0..1 overall intensity */
    lights(time: number, k: number) {
      const a = Math.sin(time * 14) > 0 ? 1 : 0;
      red.color.copy(cRed).multiplyScalar(0.3 + k * a * 4);
      blue.color.copy(cBlue).multiplyScalar(0.3 + k * (1 - a) * 4);
      flash.color.copy(a ? cRed : cBlue);
      flash.intensity = k * 40;
    },
  };
}

export function buildHelicopter() {
  const root = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.3, metalness: 0.2 });
  const band = new THREE.MeshStandardMaterial({ color: CORAL, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1a2427", roughness: 0.1, metalness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: "#5c6669", roughness: 0.5, metalness: 0.7 });

  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 3.2, 8, 16).rotateX(Math.PI / 2), body);
  fus.position.y = 1.9;
  fus.scale.set(1, 1.05, 1);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), dark);
  nose.position.set(0, 2.05, 2.55);
  nose.scale.set(1, 0.85, 0.7);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.27, 1.27, 0.5, 20).rotateX(Math.PI / 2), band);
  stripe.position.set(0, 1.9, -0.6);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 5.5, 10).rotateX(Math.PI / 2), body);
  boom.position.set(0, 2.25, -4.6);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.9), band);
  fin.position.set(0, 2.9, -7.2);
  root.add(fus, nose, stripe, boom, fin);

  // skids
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 6).rotateX(Math.PI / 2), metal);
    skid.position.set(s * 1.1, 0.08, 0.2);
    root.add(skid);
    for (const z of [1.2, -0.9]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), metal);
      leg.position.set(s * 0.95, 0.5, z);
      leg.rotation.z = s * 0.3;
      root.add(leg);
    }
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8), metal);
  mast.position.y = 3.35;
  root.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 3.62;
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 5.4).translate(0, 0, 2.7), metal);
    blade.rotation.y = (i * Math.PI) / 2;
    rotor.add(blade);
  }
  // motion-blur disc, fades in with rotor speed
  const discMat = new THREE.MeshBasicMaterial({ color: "#cfd6d8", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(5.4, 40).rotateX(-Math.PI / 2), discMat);
  rotor.add(disc);
  root.add(rotor);
  const tail = new THREE.Group();
  tail.position.set(0.2, 2.9, -7.3);
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.14), metal);
    b.rotation.x = (i * Math.PI) / 2;
    tail.add(b);
  }
  root.add(tail);

  const navMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff3030") });
  const nav = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), navMat);
  nav.position.set(0, 3.0, -7.65);
  root.add(nav);
  const beam = new THREE.SpotLight("#fff6e0", 0, 70, 0.4, 0.6, 1.5);
  beam.position.set(0, 1, 2.6);
  beam.target.position.set(0, -20, 8);
  root.add(beam, beam.target);
  shadowAll(root);

  let spin = 0;
  return {
    root,
    /** speed 0..1 rotor rpm; night 0..1 */
    update(dt: number, speed: number, night: number, time: number) {
      spin += dt * speed * 38;
      rotor.rotation.y = spin;
      tail.rotation.x = spin * 1.6;
      discMat.opacity = speed * 0.22;
      navMat.color.set("#ff3030").multiplyScalar(Math.sin(time * 5) > 0.6 ? 4 : 0.4);
      beam.intensity = night * speed * 300;
    },
  };
}
