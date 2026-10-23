import * as THREE from "three";
import type { Textures } from "./textures";

/*
 * Materials for the waterfront: painted siding, tin roofs, trim, decking, glass, foliage. Trees sway in
 * the wind in their vertex shaders, driven by the shared `wind` clock.
 */

export type WaterfrontMaterials = ReturnType<typeof createWaterfrontMaterials>;

const withWorldUV = <T extends THREE.Material>(material: T, scale: number) => {
  material.userData.worldUV = scale;
  return material;
};

/** Shared clock for the wind in the trees; advanced every frame by the scene. */
export const wind = { value: 0 };

/**
 * Sways geometry in the vertex shader: the higher a vertex sits, the further it
 * bends (trunks and fronds), or a whole crown rocks as one; leaves flutter on top.
 * Instances get their own phase from their position, so no two trees move in step.
 */
function withWind(material: THREE.MeshStandardMaterial, key: string, { bend, flutter, crown = false }: { bend: number; flutter: number; crown?: boolean }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = wind;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWindTime;").replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      float windPhase = 0.0;
      #ifdef USE_INSTANCING
        windPhase = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;
      #endif
      float gust = sin(uWindTime * 1.3 + windPhase) * 0.7 + sin(uWindTime * 2.9 + windPhase * 1.7) * 0.3;
      float reach = ${crown ? "1.0" : "max(transformed.y, 0.0) * max(transformed.y, 0.0)"};
      transformed.x += gust * reach * ${bend.toFixed(5)};
      transformed.z += cos(uWindTime * 1.1 + windPhase) * reach * ${(bend * 0.4).toFixed(5)};
      float leafReach = min(length(${crown ? "transformed" : "transformed.xz"}) / 4.0, 1.0);
      transformed.y += sin(uWindTime * 5.0 + transformed.x * 1.7 + transformed.z * 1.3 + windPhase) * ${flutter.toFixed(4)} * leafReach;`,
    );
  };
  material.customProgramCacheKey = () => `wind-${key}`;
  return material;
}

export function createWaterfrontMaterials(t: Textures) {
  const siding = (color: string) =>
    withWorldUV(new THREE.MeshStandardMaterial({ color, map: t.siding.map, bumpMap: t.siding.bump, bumpScale: 2, roughness: 0.82 }), 0.5);
  // The same board texture at a finer scale reads as louvre slats.
  const louvres = (color: string) =>
    withWorldUV(new THREE.MeshStandardMaterial({ color, map: t.siding.map, bumpMap: t.siding.bump, bumpScale: 1.5, roughness: 0.7 }), 1.9);
  // Roofs carry their own UVs, running down each slope so the corrugations do too.
  const tin = (color: string, metalness: number) =>
    new THREE.MeshStandardMaterial({ color, map: t.roof.map, bumpMap: t.roof.bump, bumpScale: 1.2, metalness, roughness: 0.38 });
  return {
    // Bocas town is famously colourful: every house its own bright paint, sun-softened.
    paint: {
      turquoise: siding("#3cc8c1"),
      aqua: siding("#86dcd5"),
      mint: siding("#a3e2c4"),
      coral: siding("#f4907a"),
      yellow: siding("#f7d56a"),
      lime: siding("#b7dc78"),
      lavender: siding("#bcaee4"),
      sky: siding("#72c4ec"),
      pink: siding("#f5a8bc"),
    },
    roofs: {
      silver: tin("#dfe4e6", 0.75),
      red: tin("#c0392b", 0.35),
      green: tin("#2d9d6f", 0.35),
      blue: tin("#2f6fde", 0.35),
    },
    shutters: {
      white: louvres("#f4f1e8"),
      teal: louvres("#1e8f88"),
      green: louvres("#2f6e55"),
      navy: louvres("#2c4a6e"),
    },
    trim: new THREE.MeshStandardMaterial({ color: "#f5f2ea", roughness: 0.55 }),
    // Stained-wood Chippendale railings, as on the real verandas.
    rail: new THREE.MeshStandardMaterial({ color: "#7b5034", roughness: 0.75 }),
    fretwork: new THREE.MeshStandardMaterial({ color: "#f5f2ea", map: t.fretwork.map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
    skirt: withWorldUV(new THREE.MeshStandardMaterial({ color: "#f0ece2", map: t.skirt.map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }), 1.6),
    soffit: new THREE.MeshStandardMaterial({ color: "#efe8da", roughness: 0.85 }),
    tank: new THREE.MeshStandardMaterial({ color: "#1d2023", roughness: 0.55 }),
    pot: new THREE.MeshStandardMaterial({ color: "#b8653f", roughness: 0.9 }),
    fabric: ["#e94f37", "#2bb6c4", "#f2c230"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide })),
    deck: withWorldUV(new THREE.MeshStandardMaterial({ color: "#ffffff", map: t.planks.map, roughness: 0.85 }), 0.4),
    stilt: new THREE.MeshStandardMaterial({ color: "#3e3026", roughness: 0.95 }),
    // Dark reflective glass that glows warm from inside after sunset (emissive driven by time of day).
    glass: new THREE.MeshStandardMaterial({ color: "#16242a", roughness: 0.05, metalness: 0.8, emissive: "#ffb257", emissiveIntensity: 0 }),
    lamp: new THREE.MeshStandardMaterial({ color: "#2a2620", emissive: "#ffc27a", emissiveIntensity: 0 }),
    canvas: new THREE.MeshStandardMaterial({ color: "#d9c6a2", roughness: 0.9, side: THREE.DoubleSide }),
    cushion: new THREE.MeshStandardMaterial({ color: "#f4f0e6", roughness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: "#2c2c2c", roughness: 0.5, metalness: 0.5 }),
    ac: new THREE.MeshStandardMaterial({ color: "#d8dadb", roughness: 0.6 }),
    boards: ["#2bb6c4", "#f2f2ee", "#f2c230", "#e8562e"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.35 })),
    terrain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    // Palm trunks and fronds bend together from the ground up; canopy crowns rock and rustle.
    bark: withWind(new THREE.MeshStandardMaterial({ color: "#a39280", map: t.bark.map, bumpMap: t.bark.bump, bumpScale: 3, roughness: 1 }), "bark", { bend: 0.003, flutter: 0 }),
    frond: withWind(new THREE.MeshStandardMaterial({ color: "#3f7d36", roughness: 0.7, side: THREE.DoubleSide }), "frond", { bend: 0.003, flutter: 0.13 }),
    frondDead: withWind(new THREE.MeshStandardMaterial({ color: "#8c7a4a", roughness: 0.9, side: THREE.DoubleSide }), "dead", { bend: 0.003, flutter: 0.05 }),
    foliage: withWind(new THREE.MeshStandardMaterial({ map: t.leaves.map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 }), "crown", {
      bend: 0.22,
      flutter: 0.09,
      crown: true,
    }),
    trunk: new THREE.MeshStandardMaterial({ color: "#4d3d30", roughness: 1 }),
  };
}
