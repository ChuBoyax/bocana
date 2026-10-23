import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import { createBoatMaterials, sailboat, waterTaxi } from "./boats";
import { CAY, LANES, LIFE_DISTANCE, MOORINGS, RANGES, SITE, SURF, type Lane } from "./config";
import { fallbackNormals, mountains } from "./landscape";
import { createWaterfrontMaterials, wind } from "./materials";
import { AdaptiveResolution, detectQuality } from "./quality";
import { createCay, createSurfSpot } from "./surf";
import { createTextures, disposeTextures } from "./textures";
import { cameraAt, lightAt } from "./timeline";
import { NO_REFLECTION, prng } from "./utils";
import { createWaterfront } from "./waterfront";

/**
 * A live 3D "film" for the homepage: dawn over open water, past sailboats and
 * jungle islands, to La Bocana's turquoise bungalows in the golden afternoon light.
 * Everything except the ripple normal map is generated in code; what the film is
 * made of (light, shots, placements) lives in `config.ts`.
 */
export type OceanScene = {
  /** 0 → 1: where we are in the film. Eased internally, so it can be fed raw scroll progress. */
  setProgress: (t: number) => void;
  /** Pointer position in -1…1, for a little hand-held camera drift. */
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

/** Gives the browser a moment to paint and handle input between the heavy steps of building the scene. */
function breathe() {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return scheduler?.yield ? scheduler.yield() : new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/**
 * Builds the scene a step at a time, so the page stays responsive while it does, compiles the shaders
 * before the first frame, then starts rendering. Resolves to null without WebGL, or if `cancelled()`
 * turns true along the way (the component unmounted).
 */
export async function createOceanScene(container: HTMLElement, cancelled: () => boolean = () => false): Promise<OceanScene | null> {
  const quality = detectQuality();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: quality.antialias, powerPreference: "high-performance" });
  } catch {
    // No WebGL: the caller shows the photo instead.
    return null;
  }
  renderer.setPixelRatio(quality.pixelRatio.max);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shadows only change with the sun, so they're re-rendered on demand rather than every frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#c7d9e0", 450, 4200);
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 20000);
  // The camera sees everything; the water's reflection pass only sees layer 0.
  camera.layers.enable(NO_REFLECTION);

  const textures = createTextures(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  const placeholderNormals = fallbackNormals();
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget: THREE.WebGLRenderTarget | null = null;
  // Anything not reached by walking the scene (textures, render targets, observers) goes here.
  const disposables: { dispose(): void }[] = [placeholderNormals, pmrem, { dispose: () => disposeTextures(textures) }];
  let disposed = false;

  function teardown() {
    disposed = true;
    renderer.setAnimationLoop(null);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const material = object.material as THREE.Material | THREE.Material[];
        (Array.isArray(material) ? material : [material]).forEach((mat) => mat.dispose());
      }
    });
    disposables.forEach((d) => d.dispose());
    envTarget?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }
  /** After each heavy step: let the page breathe, and stop if we're no longer wanted. */
  async function checkpoint() {
    await breathe();
    if (!cancelled()) return false;
    teardown();
    return true;
  }

  /* ── Sky, water, light ── */

  const sky = new Sky();
  sky.scale.setScalar(10000);
  sky.material.uniforms.mieCoefficient.value = 0.005;
  sky.material.uniforms.mieDirectionalG.value = 0.8;
  sky.material.uniforms.cloudSpeed.value = 0.00006;
  scene.add(sky);

  const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
    textureWidth: quality.reflection,
    textureHeight: quality.reflection,
    waterNormals: placeholderNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x0f5c63,
    distortionScale: 3.7,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms.size.value = 2.4;
  scene.add(water);

  const hemi = new THREE.HemisphereLight("#9ec7e0", "#2f4a44", 0.55);
  const sunLight = new THREE.DirectionalLight("#ffffff", 2);
  const siteWorld = new THREE.Vector3(SITE.x, 0, SITE.z);
  sunLight.target.position.copy(siteWorld);
  sunLight.castShadow = quality.shadows;
  // Wide enough for the shore houses either side of the deck too.
  sunLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  Object.assign(sunLight.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 900 });
  sunLight.shadow.camera.updateProjectionMatrix();
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.03;
  // Soft sky fill from the camera side, opposite the sun across the frame, so no house front goes flat.
  const fill = new THREE.DirectionalLight("#a9bfd8", 0.3);
  fill.target.position.copy(siteWorld);
  scene.add(hemi, sunLight, sunLight.target, fill, fill.target);
  if (await checkpoint()) return null;

  /* ── Landscape ── */

  for (const range of RANGES) {
    scene.add(mountains(range, range.near ? quality.terrainStep * 0.75 : quality.terrainStep));
    if (await checkpoint()) return null;
  }

  /* ── The waterfront ── */

  const siteMaterials = createWaterfrontMaterials(textures);
  const boatMaterials = createBoatMaterials(textures);
  if (boatMaterials.wake.map) disposables.push(boatMaterials.wake.map);
  // Built facing +z around the origin; turned so its front faces the incoming camera (+x).
  const { site, people, update: animatePeople } = await createWaterfront(siteMaterials, { shadows: quality.shadows, detail: quality.detail }, breathe);
  site.position.copy(siteWorld);
  site.rotation.y = Math.PI / 2;
  scene.add(site);
  if (await checkpoint()) return null;

  /* ── Boats, the cay, the surf ── */

  const rand = prng(9);
  const anchored = quality.mobile ? [...MOORINGS.slice(0, 4), MOORINGS[MOORINGS.length - 1]] : MOORINGS;
  const boats = anchored.map(([x, z]) => {
    const boat = sailboat(boatMaterials, rand);
    boat.position.set(x, 0, z);
    boat.rotation.y = rand() * Math.PI * 2;
    boat.userData.phase = rand() * Math.PI * 2;
    scene.add(boat);
    return boat;
  });

  const cay = createCay(siteMaterials, rand);
  cay.position.set(...CAY);
  scene.add(cay);

  const surf = createSurfSpot();
  surf.group.position.set(...SURF.position);
  surf.group.rotation.y = SURF.turn;
  scene.add(surf.group);

  const taxis = (quality.mobile ? LANES.slice(0, 2) : LANES).map((lane) => {
    const taxi = waterTaxi(boatMaterials, rand);
    taxi.position.set(lane.axis === "x" ? lane.start : lane.fixed, 0, lane.axis === "x" ? lane.fixed : lane.start);
    // Boats face +z; turn them to their direction of travel.
    taxi.rotation.y = lane.axis === "x" ? (lane.dir * Math.PI) / 2 : lane.dir > 0 ? 0 : Math.PI;
    taxi.userData = { lane, phase: rand() * 10 };
    scene.add(taxi);
    return taxi;
  });

  // The real ripple map (from the three.js examples) swaps in once loaded.
  new THREE.TextureLoader().load("/textures/waternormals.webp", (texture) => {
    if (disposed) return texture.dispose();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    disposables.push(texture);
    water.material.uniforms.normalSampler.value = texture;
    surf.setNormals(texture);
  });
  if (await checkpoint()) return null;

  /* ── Time of day ── */

  // Reflections and ambient light come from the sky itself, re-baked as the sun moves.
  const envScene = new THREE.Scene();
  let envSun = { elevation: -99, azimuth: -99, at: -1 };
  const sun = new THREE.Vector3();
  const sunColor = new THREE.Color();
  let elapsed = 0;

  function refreshEnvironment(elevation: number, azimuth: number) {
    const moved = Math.abs(elevation - envSun.elevation) > 1 || Math.abs(azimuth - envSun.azimuth) > 3;
    if (!moved || elapsed - envSun.at < 0.35) return;
    envSun = { elevation, azimuth, at: elapsed };
    sky.material.uniforms.showSunDisc.value = 0;
    envScene.add(sky);
    const next = pmrem.fromScene(envScene);
    scene.add(sky);
    sky.material.uniforms.showSunDisc.value = 1;
    envTarget?.dispose();
    envTarget = next;
    scene.environment = next.texture;
    renderer.shadowMap.needsUpdate = true;
  }

  function applyLight(t: number) {
    const l = lightAt(t);
    sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - l.elevation), THREE.MathUtils.degToRad(l.azimuth));
    const u = sky.material.uniforms;
    u.sunPosition.value.copy(sun);
    u.turbidity.value = l.turbidity;
    u.rayleigh.value = l.rayleigh;
    u.cloudCoverage.value = l.clouds;
    water.material.uniforms.sunDirection.value.copy(sun).normalize();
    water.material.uniforms.sunColor.value.copy(l.sun);
    water.material.uniforms.waterColor.value.copy(l.water);
    sunLight.position.copy(siteWorld).addScaledVector(sun, 400);
    fill.position.set(siteWorld.x + 300, 120, siteWorld.z - sun.z * 300);
    sunLight.color.copy(l.sun);
    sunLight.intensity = l.sunIntensity;
    hemi.color.copy(l.sky);
    hemi.groundColor.copy(l.ground);
    (scene.fog as THREE.Fog).color.copy(l.fog);
    siteMaterials.glass.emissiveIntensity = l.windows;
    siteMaterials.lamp.emissiveIntensity = l.windows * 1.6;
    renderer.toneMappingExposure = l.exposure;
    sunColor.copy(l.sun);
    refreshEnvironment(l.elevation, l.azimuth);
  }

  /* ── Rendering ── */

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait screens get a wider lens so the waterfront still fits at the end.
    camera.fov = camera.aspect < 1 ? 68 : 50;
    camera.updateProjectionMatrix();
  }
  const resolution = new AdaptiveResolution(quality.pixelRatio, (ratio) => {
    renderer.setPixelRatio(ratio);
    resize();
  });

  container.appendChild(renderer.domElement);
  resize();
  applyLight(0);
  cameraAt(0, camera.position, new THREE.Vector3());
  // Compile every shader now (in parallel where the browser can), not in the middle of the first frames.
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  if (await checkpoint()) return null;

  const pointer = new THREE.Vector2();
  const drift = new THREE.Vector2();
  const lookTarget = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const nearby = LIFE_DISTANCE * LIFE_DISTANCE;
  let target = 0;
  let current = 0;
  let appliedT = -1;
  let visible = true;
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const frame = clock.getDelta();
    if (!visible) return;
    resolution.sample(frame);
    const dt = Math.min(frame, 0.05);
    elapsed += dt;

    current += (target - current) * (1 - Math.exp(-dt * 3.5));
    if (Math.abs(current - appliedT) > 0.0005) {
      applyLight(current);
      appliedT = current;
    }

    drift.lerp(pointer, 1 - Math.exp(-dt * 2));
    cameraAt(current, camera.position, lookTarget);
    camera.position.y += -drift.y * 0.8 + Math.sin(elapsed * 0.6) * 0.15;
    camera.lookAt(lookTarget);
    // Hand-held drift follows the mouse, sideways to the current view.
    camera.translateX(drift.x * 1.6);

    water.material.uniforms.time.value = elapsed * 0.55;
    sky.material.uniforms.time.value = elapsed;
    wind.value = elapsed;

    // The surfers and the people about the waterfront are only animated, and drawn, once the camera is near.
    surf.group.visible = camera.position.distanceToSquared(surf.group.position) < nearby;
    if (surf.group.visible) surf.update(elapsed);
    people.visible = camera.position.distanceToSquared(siteWorld) < nearby;
    if (people.visible) animatePeople(elapsed);

    for (const boat of boats) {
      const ph = boat.userData.phase as number;
      boat.position.y = Math.sin(elapsed * 0.9 + ph) * 0.18;
      boat.rotation.z = Math.sin(elapsed * 0.7 + ph) * 0.04;
      boat.rotation.x = Math.sin(elapsed * 0.8 + ph * 1.3) * 0.025;
    }
    for (const taxi of taxis) {
      const { lane, phase } = taxi.userData as { lane: Lane; phase: number };
      const p = taxi.position;
      p[lane.axis] += lane.dir * lane.speed * dt;
      if (p[lane.axis] > lane.max) p[lane.axis] = lane.min;
      if (p[lane.axis] < lane.min) p[lane.axis] = lane.max;
      p.y = Math.sin(elapsed * 2.2 + phase) * 0.08;
      taxi.rotation.x = -0.06 + Math.sin(elapsed * 1.7 + phase) * 0.015;
    }

    // Backlit sailcloth glows: the more the camera faces the sun, the more light comes through.
    camera.getWorldDirection(forward);
    boatMaterials.sail.emissive.copy(sunColor).multiplyScalar(0.32 * Math.max(0, forward.dot(sun)));

    renderer.render(scene, camera);
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  // Don't spend GPU time while the film is off screen.
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  visibility.observe(container);
  disposables.push({ dispose: () => resizeObserver.disconnect() }, { dispose: () => visibility.disconnect() });

  return {
    setProgress(t) {
      target = THREE.MathUtils.clamp(t, 0, 1);
    },
    setPointer(x, y) {
      pointer.set(x, y);
    },
    dispose: teardown,
  };
}
