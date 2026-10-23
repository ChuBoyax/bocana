import * as THREE from "three";

/** Per-device settings for the film: the one place to trade looks for speed. */
export type Quality = {
  mobile: boolean;
  antialias: boolean;
  /** Pixel ratio to start at and never exceed, and the floor adaptive resolution may drop to. */
  pixelRatio: { max: number; min: number };
  shadows: boolean;
  shadowMapSize: number;
  /** Width and height of the water's reflection texture. */
  reflection: number;
  /** Metres between terrain vertices on the distant ranges (nearer ones get 3/4 of it). */
  terrainStep: number;
  /** 0…1: vegetation density, and how many people and boats are about. */
  detail: number;
};

export function detectQuality(): Quality {
  const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  // Few cores or little memory: a budget laptop or an older phone.
  const modest = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  const dpr = window.devicePixelRatio || 1;
  if (mobile) {
    return {
      mobile,
      antialias: false,
      pixelRatio: { max: Math.min(dpr, modest ? 1 : 1.25), min: 0.75 },
      shadows: false,
      shadowMapSize: 0,
      reflection: 256,
      terrainStep: 28,
      detail: 0.6,
    };
  }
  return {
    mobile,
    antialias: !modest,
    pixelRatio: { max: Math.min(dpr, modest ? 1.25 : 1.5), min: 0.75 },
    shadows: true,
    shadowMapSize: modest ? 2048 : 3072,
    reflection: modest ? 256 : 512,
    terrainStep: modest ? 20 : 16,
    detail: modest ? 0.8 : 1,
  };
}

/**
 * Keeps the film smooth on slower GPUs by drawing fewer pixels: every second it looks at how long
 * frames took, steps the pixel ratio down when the film runs below about 45 fps, and back up, slowly,
 * once there is headroom again.
 */
export class AdaptiveResolution {
  ratio: number;
  private readonly range: { max: number; min: number };
  private readonly apply: (ratio: number) => void;
  private time = 0;
  private frames = 0;
  private calm = 0;

  constructor(range: { max: number; min: number }, apply: (ratio: number) => void) {
    this.range = range;
    this.apply = apply;
    this.ratio = range.max;
  }

  /** Feed it every frame's duration in seconds. */
  sample(seconds: number) {
    // A pause (hidden tab, a long task elsewhere) says nothing about how fast we render.
    if (seconds > 0.25) return;
    this.time += seconds;
    this.frames++;
    if (this.time < 1) return;
    const frame = this.time / this.frames;
    this.time = this.frames = 0;
    if (frame > 1 / 45 && this.ratio > this.range.min) {
      this.calm = 0;
      this.set(this.ratio - 0.25);
    } else if (frame < 1 / 55 && this.ratio < this.range.max) {
      if (++this.calm >= 3) {
        this.calm = 0;
        this.set(this.ratio + 0.25);
      }
    } else {
      this.calm = 0;
    }
  }

  private set(ratio: number) {
    this.ratio = THREE.MathUtils.clamp(ratio, this.range.min, this.range.max);
    this.apply(this.ratio);
  }
}
