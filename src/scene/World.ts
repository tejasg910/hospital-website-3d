import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { clamp, damp, lerp, range, track } from "@/lib/anim";
import { deptAt, stage } from "@/lib/stage";
import { DEPARTMENTS } from "@/lib/content";
import { AMB_ROUTE, buildCampus } from "./campus";
import { DEPT_FLOORS, FLOORS, TOWER, TOWER_TOP, buildHospital } from "./hospital";
import { initPbr } from "./pbr";
import { softDot } from "./textures";
import { buildAmbulance, buildHelicopter } from "./vehicles";
import { buildEquipment, patchXray, xray } from "./xray";

/**
 * The whole film. Every visual is a pure function of stage.progress (plus a
 * little time-based life), so scrolling backwards rewinds the build exactly.
 */

const DEG = Math.PI / 180;

/* ---------------------------------------------------------------- tracks */
// [p, elevation°, azimuth°]
const SUN = [
  [0, 3, 122],
  [0.1, 11, 132],
  [0.3, 34, 160],
  [0.5, 50, 190],
  [0.7, 38, 214],
  [0.78, 12, 232],
  [0.84, 2, 240],
  [0.9, -8, 246],
  [1, -12, 250],
];
// [p, r, g, b] horizon haze
const FOG = [
  [0, 0.9, 0.74, 0.62],
  [0.14, 0.8, 0.82, 0.85],
  [0.4, 0.76, 0.84, 0.9],
  [0.7, 0.8, 0.82, 0.84],
  [0.8, 0.92, 0.68, 0.52],
  [0.86, 0.3, 0.26, 0.36],
  [0.92, 0.04, 0.07, 0.1],
];
// [p, px, py, pz, lx, ly, lz, fov]
const CAM = [
  [0, -120, 64, 150, -34, 8, 0, 44],
  [0.08, -95, 50, 122, -16, 8, 0, 42],
  [0.16, 72, 46, 108, 0, 16, 0, 42],
  [0.24, 44, 32, 112, 4, 22, 0, 40],
  [0.28, -34, 18, 104, -10, 14, 10, 40],
  [0.38, -8, 5, 54, -24, 4, 22, 40],
  [0.415, -4, 4.5, 47, -24, 5, 22, 38],
  [0.45, 84, 34, 78, 6, 30, -2, 40],
  [0.6, 74, 52, 68, 6, 40, -2, 40],
  [0.635, 0, 32, 118, -24, 16, 0, 40],
  [0.73, -42, 26, 102, -26, 14, 0, 40],
  [0.77, -98, 16, 62, 0, 22, 0, 40],
  [0.83, -62, 11, 108, 0, 26, 0, 42],
  [0.865, 62, 72, 72, 13, 46, -2, 40],
  [0.93, 40, 57, 50, 13, 48, -2, 38],
  [1, -125, 38, 165, -26, 18, 0, 44],
];
// ambulance-relative orbit: [p, angle° (0 right, 90 ahead, 180 left, 270 behind), distance, height, lookUp]
const CHASE = [
  [0.3, 40, 13, 2.4, 1.5],
  [0.33, 120, 12, 3, 1.5],
  [0.36, 200, 14, 4.5, 1.8],
  [0.385, 255, 16, 6, 2],
];
// diagnostic scan fronts (world y)
const SCAN_IN = [
  [0.6, 400],
  [0.635, 112],
  [0.672, -14],
];
const SCAN_OUT = [
  [0.7, 400],
  [0.708, 112],
  [0.738, -14],
];

export interface WorldHandle {
  dispose: () => void;
}

export async function createWorld(host: HTMLElement, onProgress: (f: number) => void): Promise<WorldHandle> {
  const small = window.innerWidth < 768;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ renderer */
  const renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 4000);
  scene.fog = new THREE.Fog(0xd8c0a8, 280, 1600);

  /* ------------------------------------------------------------ sky + env */
  const sky = new Sky();
  sky.scale.setScalar(3000);
  const su = sky.material.uniforms;
  su.turbidity.value = 2.8;
  su.rayleigh.value = 1.2;
  su.mieCoefficient.value = 0.004;
  su.mieDirectionalG.value = 0.86;
  if (su.cloudCoverage) {
    su.cloudCoverage.value = 0.28;
    su.cloudDensity.value = 0.3;
  }
  scene.add(sky);

  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(50);
  envSky.material.uniforms.turbidity.value = 2.8;
  envSky.material.uniforms.rayleigh.value = 1.2;
  if (envSky.material.uniforms.cloudCoverage) envSky.material.uniforms.cloudCoverage.value = 0;
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT: THREE.WebGLRenderTarget | null = null;
  let envElev = 999;

  const sunDir = new THREE.Vector3();
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -90;
  sc.right = sc.top = 90;
  sc.near = 10;
  sc.far = 450;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xdcecff, 0x5d6a52, 0.8);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fb0ff, 0);
  moon.position.set(-100, 160, 80);
  scene.add(moon);

  // stars
  const STARS = 1600;
  const starPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.9 + 0.05;
    v.normalize().multiplyScalar(2400);
    starPos.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    sizeAttenuation: false,
    map: softDot(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // deep-navy "film" that replaces the sky while the scan runs
  const scanDome = new THREE.Mesh(
    new THREE.SphereGeometry(2800, 32, 16),
    new THREE.MeshBasicMaterial({ color: "#04141a", side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false }),
  );
  scene.add(scanDome);

  /* ------------------------------------------------------------ world */
  const manager = new THREE.LoadingManager();
  const texturesLoaded = new Promise<void>((res) => {
    manager.onLoad = () => res();
  });
  manager.onProgress = (_u, loaded, total) => onProgress((loaded / total) * 0.95);
  initPbr(manager);

  const campus = buildCampus(small);
  const hospital = buildHospital(small);
  const ambulance = buildAmbulance();
  const heli = buildHelicopter();
  const equipment = buildEquipment();
  scene.add(campus.group, hospital.group, ambulance.root, heli.root, equipment.group);
  patchXray(scene);

  // helicopter approach, ending on the pad
  const pad = new THREE.Vector3(TOWER.x + 5, TOWER_TOP + 3.95, TOWER.z);
  const HELI_PATH = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-300, 130, -260),
      new THREE.Vector3(-150, 100, -120),
      new THREE.Vector3(-45, 78, -35),
      pad.clone().add(new THREE.Vector3(-4, 24, 0)),
      pad.clone().add(new THREE.Vector3(0, 7, 0)),
      pad.clone(),
    ],
    false,
    "centripetal",
  );

  /* ------------------------------------------------------------ post */
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: small ? 0 : 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = small ? null : new GTAOPass(scene, camera, 1, 1);
  if (gtao) {
    gtao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 2, scale: 1.1, samples: 12 });
    gtao.blendIntensity = 0.7;
    composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ------------------------------------------------------------ sizing */
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    gtao?.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
  };
  resize();
  window.addEventListener("resize", resize);

  /* ------------------------------------------------------------ choreography state */
  const routeLen = AMB_ROUTE.getLength();
  const ambPos = new THREE.Vector3();
  const ambTan = new THREE.Vector3();
  const ambRight = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const heliPos = new THREE.Vector3();
  const heliTan = new THREE.Vector3();

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const curPos = new THREE.Vector3(-120, 64, 150);
  const curLook = new THREE.Vector3(-34, 8, 0);
  const camRight = new THREE.Vector3();
  const chasePos = new THREE.Vector3();
  const chaseLook = new THREE.Vector3();
  const out8 = new Array(8).fill(0);
  const out4 = new Array(4).fill(0);
  const out3 = new Array(3).fill(0);
  const fogCol = new THREE.Color();
  const scanCol = new THREE.Color("#04141a");
  const sunWarm = new THREE.Color("#ffa060");
  const sunNoon = new THREE.Color("#fff6ea");

  const glow = new Array(TOWER.floors).fill(0);
  const colors: (string | null)[] = new Array(TOWER.floors).fill(null);
  DEPT_FLOORS.forEach((f, i) => (colors[f] = DEPARTMENTS[i].color));

  // dev aid: ?p=0.5 freezes the film at a progress value
  const pinned = new URLSearchParams(location.search).get("p");
  const pinnedP = pinned === null ? null : Number(pinned);

  let time = 0;
  const portrait = () => (camera.aspect < 1 ? 1.6 : 1);
  let curP = pinnedP ?? stage.progress;
  let vel = 0;
  let lastAmbD = 0;
  let heliYaw = 0;

  /* ------------------------------------------------------------ frame */
  const timer = new THREE.Timer();
  let raf = 0;

  const frame = (ts?: number) => {
    raf = requestAnimationFrame(frame);
    timer.update(ts);
    if (stage.paused) return;
    const dt = Math.min(timer.getDelta(), 0.1);
    time += dt;
    if (pinnedP !== null) stage.progress = pinnedP;
    curP += (stage.progress - curP) * damp(reduce ? 20 : 5, dt);
    vel += (stage.velocity - vel) * damp(4, dt);
    const p = curP;

    /* ---------- sky & light */
    track(SUN, p, out3);
    const elev = out3[0];
    sunDir.setFromSphericalCoords(1, (90 - elev) * DEG, out3[1] * DEG);
    su.sunPosition.value.copy(sunDir);
    if (su.time) su.time.value = time;
    envSky.material.uniforms.sunPosition.value.copy(sunDir);

    const day = clamp((elev + 6) / 20);
    const night = range(p, 0.84, 0.885);
    sun.position.copy(sunDir).multiplyScalar(240);
    sun.target.position.set(0, 0, 0);
    sun.intensity = Math.sin(Math.max(elev, 0) * DEG) * 2 + day * 0.6;
    sun.color.copy(sunWarm).lerp(sunNoon, clamp(elev / 30));
    hemi.intensity = lerp(0.14, 0.32, day);
    moon.intensity = night * 0.8;
    starMat.opacity = night;

    if (Math.abs(elev - envElev) > 1.5) {
      envElev = elev;
      envRT?.dispose();
      envRT = pmrem.fromScene(envScene, 0.02);
      scene.environment = envRT.texture;
    }
    scene.environmentIntensity = lerp(0.12, 0.45, day);

    /* ---------- diagnostic scan */
    xray.uIn.value = track(SCAN_IN, p, out3)[0];
    xray.uOut.value = track(SCAN_OUT, p, out3)[0];
    xray.uTime.value = time;
    const scan = range(p, 0.64, 0.665) * (1 - range(p, 0.712, 0.735));
    (scanDome.material as THREE.MeshBasicMaterial).opacity = scan;
    equipment.update(scan, time);

    track(FOG, p, out4);
    fogCol.setRGB(out4[0], out4[1], out4[2]).lerp(scanCol, scan);
    (scene.fog as THREE.Fog).color.copy(fogCol);
    renderer.toneMappingExposure = lerp(0.6, 0.9, night) + scan * 0.1;

    /* ---------- hospital */
    const sF = FLOORS * range(p, 0.075, 0.25);
    const explode = range(p, 0.43, 0.47) * (1 - range(p, 0.585, 0.62));
    const a = deptAt(p);
    for (let i = 0; i < glow.length; i++) glow[i] = 0;
    DEPT_FLOORS.forEach((f, i) => {
      glow[f] = (1 - range(Math.abs(a - i), 0.15, 0.75)) * explode;
    });
    hospital.update(sF, range(p, 0.235, 0.275), range(p, 0.2, 0.26), explode, glow, colors, night, time);
    campus.update(night, range(p, 0, 0.02) * (1 - range(p, 0.12, 0.2)) + scan * 0.6);

    /* ---------- ambulance */
    const tt = range(p, 0.29, 0.385);
    const d = tt * routeLen;
    AMB_ROUTE.getPointAt(tt, ambPos);
    AMB_ROUTE.getTangentAt(Math.min(tt, 0.999), ambTan);
    ambulance.root.position.copy(ambPos);
    ambulance.root.position.y = 0.34;
    ambulance.root.rotation.y = Math.atan2(ambTan.x, ambTan.z);
    const speed = Math.abs(d - lastAmbD) / Math.max(dt, 1e-3);
    lastAmbD = d;
    ambulance.root.position.y += Math.sin(time * 16) * Math.min(speed, 20) * 0.0012;
    ambulance.roll(d);
    ambulance.lights(time, range(p, 0.27, 0.3) * (1 - range(p, 0.45, 0.48)) + night * 0.35);
    ambRight.crossVectors(ambTan, up).normalize();

    /* ---------- helicopter */
    const ht = range(p, 0.845, 0.915);
    heli.root.visible = p > 0.83;
    HELI_PATH.getPointAt(ht, heliPos);
    HELI_PATH.getTangentAt(Math.min(ht, 0.999), heliTan);
    heli.root.position.copy(heliPos);
    if (ht < 0.8) heliYaw = Math.atan2(heliTan.x, heliTan.z);
    heli.root.rotation.y = heliYaw;
    heli.root.rotation.x = ht < 0.85 ? 0.12 * (1 - range(ht, 0.6, 0.85)) : 0;
    heli.root.position.y += ht < 0.98 ? Math.sin(time * 1.3) * 0.25 : 0;
    heli.update(dt, 1 - range(p, 0.93, 0.98) * 0.85, night, time);

    /* ---------- post */
    bloom.strength = night * 0.85 + scan * 0.55;
    bloom.enabled = bloom.strength > 0.01;

    /* ---------- camera */
    track(CAM, p, out8);
    camPos.set(out8[0], out8[1], out8[2]);
    camLook.set(out8[3], out8[4], out8[5]);
    const follow = range(p, 0.285, 0.305) * (1 - range(p, 0.37, 0.395));
    if (follow > 0) {
      track(CHASE, p, out4);
      const ang = out4[0] * DEG;
      const reach = out4[1] * portrait();
      chasePos
        .copy(ambPos)
        .addScaledVector(ambRight, Math.cos(ang) * reach)
        .addScaledVector(ambTan, Math.sin(ang) * reach)
        .addScaledVector(up, out4[2]);
      chaseLook.copy(ambPos).addScaledVector(up, out4[3]).addScaledVector(ambTan, 3);
      camPos.lerp(chasePos, follow);
      camLook.lerp(chaseLook, follow);
    }
    // departments: ride up the tower with the lit floor
    if (explode > 0) {
      const fy = hospital.floorY(DEPT_FLOORS[0] + a, explode);
      camLook.y = lerp(camLook.y, fy, explode);
      camPos.y = lerp(camPos.y, fy + 9, explode);
    }
    camRight.subVectors(camLook, camPos).cross(up).normalize();
    // wide screens: copy sits on the left, so push the subject right of centre
    if (camera.aspect > 1.1) camLook.addScaledVector(camRight, -(follow * 4 + explode * 13));
    const par = reduce ? 0 : 1;
    camPos.addScaledVector(camRight, stage.px * 2.4 * par);
    camPos.y += stage.py * 1.5 * par;
    const shake = reduce ? 0 : Math.min(Math.abs(vel), 60) * 0.003;
    camPos.y += Math.sin(time * 31) * shake;
    camPos.x += Math.cos(time * 27) * shake;
    camPos.y = Math.max(camPos.y, 2);

    const e = pinnedP !== null ? 1 : damp(6, dt);
    curPos.lerp(camPos, e);
    curLook.lerp(camLook, e);
    camera.position.copy(curPos);
    camera.lookAt(curLook);
    const fov = out8[6] * (camera.aspect < 1 ? 1.4 : 1);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    composer.render();
  };

  // never hang the loader on a slow texture
  await Promise.race([texturesLoaded, new Promise((r) => setTimeout(r, 10000))]);
  renderer.compile(scene, camera);
  onProgress(1);
  frame();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
      });
      envRT?.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    },
  };
}
