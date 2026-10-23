import * as THREE from "three";
import { prng } from "./utils";

/** Textures painted on canvases at start-up: no image downloads. */
export type Textures = ReturnType<typeof createTextures>;

function canvas(width: number, height: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return [c, c.getContext("2d")!] as const;
}

function texture(c: HTMLCanvasElement, { color, anisotropy }: { color: boolean; anisotropy: number }) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropy;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lap siding: overlapping horizontal boards with a shadow line under each. Grey, tinted by the material colour. */
function siding(anisotropy: number) {
  const size = 256;
  const boards = 12;
  const h = size / boards;
  const rand = prng(1);
  const [map, ctx] = canvas(size, size);
  const [bump, bctx] = canvas(size, size);
  for (let i = 0; i < boards; i++) {
    const y = i * h;
    const tone = 222 + rand() * 26;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(0, y, size, h);
    const shade = ctx.createLinearGradient(0, y, 0, y + h);
    shade.addColorStop(0, "rgba(255,255,255,0.18)");
    shade.addColorStop(0.82, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, y, size, h);
    const ramp = bctx.createLinearGradient(0, y, 0, y + h);
    ramp.addColorStop(0, "#ffffff");
    ramp.addColorStop(0.9, "#808080");
    ramp.addColorStop(1, "#000000");
    bctx.fillStyle = ramp;
    bctx.fillRect(0, y, size, h);
  }
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand() * 0.06})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 4, 1);
  }
  return { map: texture(map, { color: true, anisotropy }), bump: texture(bump, { color: false, anisotropy }) };
}

/** Corrugated tin: sine ridges in the bump map, faint streaks and spots in the colour. */
function corrugated(anisotropy: number) {
  const size = 256;
  const rand = prng(2);
  const [map, ctx] = canvas(size, size);
  const [bump, bctx] = canvas(size, size);
  for (let x = 0; x < size; x++) {
    const ridge = 0.5 + 0.5 * Math.sin((x / size) * Math.PI * 2 * 16);
    const b = Math.round(ridge * 255);
    bctx.fillStyle = `rgb(${b},${b},${b})`;
    bctx.fillRect(x, 0, 1, size);
    const tone = 200 + ridge * 40;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(x, 0, 1, size);
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(${90 + rand() * 40},${70 + rand() * 30},${60 + rand() * 20},${rand() * 0.12})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 6 + rand() * 40);
  }
  return { map: texture(map, { color: true, anisotropy }), bump: texture(bump, { color: false, anisotropy }) };
}

/** Deck planks with grain and dark gaps. */
function planks(anisotropy: number) {
  const size = 256;
  const rows = 8;
  const h = size / rows;
  const rand = prng(3);
  const [map, ctx] = canvas(size, size);
  for (let i = 0; i < rows; i++) {
    const y = i * h;
    const r = 150 + rand() * 30;
    ctx.fillStyle = `rgb(${r},${r * 0.74},${r * 0.5})`;
    ctx.fillRect(0, y, size, h);
    for (let g = 0; g < 14; g++) {
      ctx.strokeStyle = `rgba(70,45,25,${0.08 + rand() * 0.15})`;
      ctx.lineWidth = 0.6 + rand();
      ctx.beginPath();
      const gy = y + rand() * h;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.3, gy + (rand() - 0.5) * 4, size * 0.7, gy + (rand() - 0.5) * 4, size, gy);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(25,15,8,0.85)";
    ctx.fillRect(0, y + h - 2, size, 2);
    const joint = rand() * size;
    ctx.fillRect(joint, y, 2, h);
  }
  return { map: texture(map, { color: true, anisotropy }) };
}

/** Palm trunk: ring scars around a grey-brown trunk. */
function bark(anisotropy: number) {
  const [map, ctx] = canvas(64, 256);
  const [bump, bctx] = canvas(64, 256);
  const rand = prng(4);
  for (let y = 0; y < 256; y++) {
    const ring = Math.pow(0.5 + 0.5 * Math.sin((y / 256) * Math.PI * 2 * 18), 6);
    const t = 128 + rand() * 18 - ring * 60;
    ctx.fillStyle = `rgb(${t},${t * 0.9},${t * 0.78})`;
    ctx.fillRect(0, y, 64, 1);
    const b = Math.round(255 - ring * 200);
    bctx.fillStyle = `rgb(${b},${b},${b})`;
    bctx.fillRect(0, y, 64, 1);
  }
  return { map: texture(map, { color: true, anisotropy }), bump: texture(bump, { color: false, anisotropy }) };
}

/** A cluster of broad tropical leaves on transparent ground, for foliage cards. */
function leaves(anisotropy: number) {
  const size = 256;
  const rand = prng(5);
  const [map, ctx] = canvas(size, size);
  for (let i = 0; i < 110; i++) {
    const r = Math.sqrt(rand()) * size * 0.42;
    const a = rand() * Math.PI * 2;
    const x = size / 2 + Math.cos(a) * r;
    const y = size / 2 + Math.sin(a) * r;
    const len = 14 + rand() * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI * 2);
    const light = 22 + rand() * 24;
    ctx.fillStyle = `hsl(${100 + rand() * 35}, ${38 + rand() * 25}%, ${light}%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.38, len, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `hsla(90, 40%, ${light + 15}%, 0.6)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
  }
  const t = texture(map, { color: true, anisotropy });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return { map: t };
}

/** Gingerbread fretwork for veranda valances: a band with hanging scallops, each pierced, on transparent ground. */
function fretwork(anisotropy: number) {
  const [map, ctx] = canvas(256, 64);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 16);
  for (let x = 16; x < 256; x += 32) {
    ctx.beginPath();
    ctx.arc(x, 16, 15, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 4, 30);
    ctx.lineTo(x, 46);
    ctx.lineTo(x + 4, 30);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "destination-out";
  for (let x = 16; x < 256; x += 32) {
    ctx.beginPath();
    ctx.arc(x, 18, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let x = 0; x <= 256; x += 32) ctx.fillRect(x - 2, 4, 4, 8);
  const t = texture(map, { color: true, anisotropy });
  t.wrapT = THREE.ClampToEdgeWrapping;
  return { map: t };
}

/** Diagonal lattice, as used to skirt the space under raised houses. */
function latticeSkirt(anisotropy: number) {
  const [map, ctx] = canvas(64, 64);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 9;
  for (let k = -64; k <= 128; k += 32) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + 64, 64);
    ctx.moveTo(k + 64, 0);
    ctx.lineTo(k, 64);
    ctx.stroke();
  }
  return { map: texture(map, { color: true, anisotropy }) };
}

/** Sailcloth: off-white with horizontal panel seams. */
function sailcloth(anisotropy: number) {
  const [map, ctx] = canvas(128, 256);
  ctx.fillStyle = "#f1eee6";
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "rgba(120,110,95,0.25)";
  for (let y = 0; y < 256; y += 28) ctx.fillRect(0, y, 128, 1.5);
  return { map: texture(map, { color: true, anisotropy }) };
}

export function createTextures(anisotropy: number) {
  return {
    siding: siding(anisotropy),
    roof: corrugated(anisotropy),
    planks: planks(anisotropy),
    bark: bark(anisotropy),
    leaves: leaves(anisotropy),
    fretwork: fretwork(anisotropy),
    skirt: latticeSkirt(anisotropy),
    sail: sailcloth(anisotropy),
  };
}

export function disposeTextures(textures: Textures) {
  for (const set of Object.values(textures)) for (const t of Object.values(set)) (t as THREE.Texture).dispose();
}
