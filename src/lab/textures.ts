import * as THREE from "three";
import type { CatId } from "./data";

export type TextureKind = Exclude<CatId, "spinal_cord"> | "cell" | "ecm";

type Pack = {
  alb: THREE.CanvasTexture;
  surf: THREE.CanvasTexture;
  scale: number;
  bump: number;
  alpha: number;
};

const SIZE = 256;
const KINDS: TextureKind[] = [
  "dura",
  "arachnoid",
  "meninges_dura",
  "cortex",
  "white_matter",
  "tracts",
  "deep_grey",
  "diencephalon",
  "ventricles",
  "brainstem",
  "cerebellum",
  "arteries",
  "veins_sinuses",
  "cranial_nerves",
  "cell",
  "ecm",
];

const TUNING: Record<TextureKind, { scale: number; bump: number; alpha: number }> = {
  dura: { scale: 16, bump: 5, alpha: 0 },
  arachnoid: { scale: 26, bump: 3, alpha: 0.62 },
  meninges_dura: { scale: 13, bump: 5, alpha: 0 },
  cortex: { scale: 58, bump: 4, alpha: 0 },
  white_matter: { scale: 30, bump: 2.5, alpha: 0 },
  tracts: { scale: 36, bump: 4, alpha: 0 },
  deep_grey: { scale: 50, bump: 3.5, alpha: 0 },
  diencephalon: { scale: 34, bump: 2.5, alpha: 0 },
  ventricles: { scale: 12, bump: 0.8, alpha: 0 },
  brainstem: { scale: 38, bump: 2.5, alpha: 0 },
  cerebellum: { scale: 46, bump: 7, alpha: 0 },
  arteries: { scale: 52, bump: 2.2, alpha: 0 },
  veins_sinuses: { scale: 32, bump: 2.4, alpha: 0 },
  cranial_nerves: { scale: 44, bump: 4.5, alpha: 0 },
  cell: { scale: 40, bump: 3, alpha: 0 },
  ecm: { scale: 24, bump: 2, alpha: 0 },
};

const cache = new Map<TextureKind, Pack>();

function hash(ix: number, iy: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function pnoise(x: number, y: number, period: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = (n: number) => ((n % period) + period) % period;
  const a = hash(w(xi), w(yi));
  const b = hash(w(xi + 1), w(yi));
  const c = hash(w(xi), w(yi + 1));
  const d = hash(w(xi + 1), w(yi + 1));
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(u: number, v: number, freq: number, oct: number) {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  let f = freq;
  for (let i = 0; i < oct; i++) {
    sum += amp * pnoise(u * f, v * f, f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

function sat(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smooth(e0: number, e1: number, x: number) {
  const t = sat((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

function fract(n: number) {
  return n - Math.floor(n);
}

type Ink = { r: number; g: number; b: number; rough: number; height: number; mask: number };

function shade(kind: TextureKind, u: number, v: number): Ink {
  const pu = u + 0.17;
  const pv = v + 0.41;
  if (kind === "cortex") {
    const blot = fbm(pu, pv, 5, 5);
    const pores = fbm(pu + 0.2, pv + 0.8, 18, 3);
    const vein = smooth(0.012, 0.07, Math.abs(fbm(pu, pv + 0.3, 8, 4) - 0.5));
    const cap = smooth(0.008, 0.04, Math.abs(fbm(pu + 0.6, pv, 16, 3) - 0.47));
    const open = vein * cap;
    const base = lerp(0.9, 1.06, blot);
    return {
      r: base * lerp(0.72, 1, open),
      g: base * lerp(0.58, 1, open) * lerp(0.96, 1.02, pores),
      b: base * lerp(0.55, 0.98, open),
      rough: lerp(0.72, 0.34, open) * lerp(0.9, 1.08, pores),
      height: 0.42 + (pores - 0.5) * 0.22 + (1 - vein) * 0.38 + (1 - cap) * 0.16,
      mask: 1,
    };
  }
  if (kind === "cerebellum") {
    const warp = fbm(pu, pv, 4, 3);
    const folia = Math.abs(Math.sin((v * 26 + warp * 1.6) * Math.PI * 2));
    const grain = fbm(pu + 0.4, pv, 20, 3);
    const groove = smooth(0.15, 0.55, folia);
    return {
      r: lerp(0.78, 1.05, groove),
      g: lerp(0.7, 1.02, groove),
      b: lerp(0.68, 0.98, groove),
      rough: lerp(0.85, 0.38, groove),
      height: 0.18 + folia * 0.72 + (grain - 0.5) * 0.08,
      mask: 1,
    };
  }
  if (kind === "brainstem") {
    const grain = fbm(pu, pv, 7, 4);
    const streak = 0.5 + 0.5 * Math.sin((v * 11 + u * 1.4) * Math.PI * 2);
    const pore = fbm(pu + 0.5, pv, 18, 2);
    return {
      r: lerp(0.9, 1.05, grain) * lerp(0.96, 1.02, streak),
      g: lerp(0.88, 1.02, grain),
      b: lerp(0.86, 0.99, grain),
      rough: lerp(0.55, 0.78, pore) * lerp(0.85, 1, 1 - streak),
      height: 0.48 + (grain - 0.5) * 0.18 + streak * 0.08,
      mask: 1,
    };
  }
  if (kind === "deep_grey") {
    const grain = fbm(pu, pv, 14, 4);
    const island = fbm(pu + 0.3, pv + 0.2, 4, 3);
    const stripe = 0.5 + 0.5 * Math.sin((u * 9 + warpish(pu, pv)) * Math.PI * 2);
    const speck = grain > 0.62 || grain < 0.38 ? 1 : 0;
    return {
      r: lerp(0.82, 1.08, island) * lerp(0.94, 1.04, stripe) * (speck ? 0.9 : 1),
      g: lerp(0.78, 1.02, island) * (speck ? 0.86 : 1),
      b: lerp(0.76, 0.98, island),
      rough: lerp(0.5, 0.9, grain),
      height: 0.4 + grain * 0.35 + (1 - stripe) * 0.12,
      mask: 1,
    };
  }
  if (kind === "diencephalon") {
    const domain = fbm(pu, pv, 3, 4);
    const grain = fbm(pu + 0.7, pv, 12, 3);
    return {
      r: lerp(0.9, 1.06, domain),
      g: lerp(0.86, 1.02, domain) * lerp(0.96, 1.03, grain),
      b: lerp(0.84, 0.99, domain),
      rough: lerp(0.48, 0.8, grain),
      height: 0.46 + (domain - 0.5) * 0.28 + (grain - 0.5) * 0.1,
      mask: 1,
    };
  }
  if (kind === "white_matter" || kind === "ecm") {
    const along = 0.5 + 0.5 * Math.sin((u * 2.0 + v) * 34 * Math.PI * 2);
    const cross = 0.5 + 0.5 * Math.sin((v * 2.0 - u * 0.4) * 14 * Math.PI * 2);
    const pearl = fbm(pu, pv, 4, 4);
    const sheen = along * 0.62 + cross * 0.38;
    const pale = kind === "ecm" ? 0.5 : 1;
    return {
      r: lerp(0.9, 1.08, pearl) * lerp(0.94, 1.04, sheen),
      g: lerp(0.9, 1.05, pearl) * lerp(0.95, 1.02, sheen),
      b: lerp(0.88, 1.0, pearl) * lerp(0.9, 0.98, sheen),
      rough: lerp(0.78, 0.32, sheen) * pale + (1 - pale) * 0.7,
      height: 0.5 + (sheen - 0.5) * 0.22 + (pearl - 0.5) * 0.08,
      mask: 1,
    };
  }
  if (kind === "tracts") {
    const bundle = Math.abs(Math.sin((u * 7 + fbm(pu, pv, 3, 2)) * Math.PI * 2));
    const fiber = 0.5 + 0.5 * Math.sin((v * 28 + u * 2) * Math.PI * 2);
    const core = smooth(0.2, 0.85, bundle);
    return {
      r: lerp(0.78, 1.08, core) * lerp(0.95, 1.04, fiber),
      g: lerp(0.74, 1.02, core),
      b: lerp(0.66, 0.94, core),
      rough: lerp(0.8, 0.36, fiber * core),
      height: 0.22 + bundle * 0.55 + fiber * 0.18,
      mask: 1,
    };
  }
  if (kind === "dura" || kind === "meninges_dura") {
    const warp = fbm(pu, pv, 4, 3);
    const bands = kind === "dura" ? 18 : 9;
    const w1 = Math.abs(Math.sin((u * bands + warp) * Math.PI * 2));
    const w2 = Math.abs(Math.sin((v * bands * 0.85 - warp * 1.3) * Math.PI * 2));
    const weave = Math.min(w1, w2);
    const stain = fbm(pu + 0.2, pv + 0.5, 3, 3);
    return {
      r: lerp(0.78, 1.08, stain) * lerp(0.86, 1.05, weave),
      g: lerp(0.76, 1.04, stain) * lerp(0.84, 1.02, weave),
      b: lerp(0.7, 0.96, stain) * lerp(0.8, 0.98, weave),
      rough: lerp(0.95, 0.55, weave),
      height: 0.2 + weave * 0.7 + stain * 0.1,
      mask: 1,
    };
  }
  if (kind === "arachnoid") {
    const web = Math.abs(fbm(pu, pv, 9, 4) - 0.5);
    const strand = 1 - smooth(0.015, 0.08, web);
    const film = fbm(pu + 0.4, pv, 3, 2);
    return {
      r: lerp(0.92, 1.12, strand) * lerp(0.96, 1.04, film),
      g: lerp(0.94, 1.14, strand),
      b: lerp(0.96, 1.16, strand),
      rough: lerp(0.55, 0.18, strand),
      height: 0.35 + strand * 0.6,
      mask: sat(strand),
    };
  }
  if (kind === "ventricles") {
    const caustic = fbm(pu, pv, 3, 4);
    const tuft = smooth(0.62, 0.82, fbm(pu + 0.8, pv, 8, 3));
    return {
      r: lerp(0.94, 1.04, caustic) * lerp(1, 0.9, tuft),
      g: lerp(0.96, 1.06, caustic) * lerp(1, 0.86, tuft),
      b: lerp(0.98, 1.08, caustic) * lerp(1, 0.84, tuft),
      rough: lerp(0.25, 0.7, tuft),
      height: 0.5 + (caustic - 0.5) * 0.06 + tuft * 0.28,
      mask: 1,
    };
  }
  if (kind === "arteries" || kind === "veins_sinuses") {
    const vein = kind === "veins_sinuses";
    const wall = fbm(pu, pv, vein ? 6 : 10, 4);
    const streak = 0.5 + 0.5 * Math.sin((v * (vein ? 14 : 24) + wall) * Math.PI * 2);
    const mott = fbm(pu + 0.3, pv, vein ? 4 : 8, 3);
    return {
      r: lerp(0.78, 1.08, mott) * lerp(0.92, 1.05, streak),
      g: lerp(vein ? 0.86 : 0.7, 1.02, mott),
      b: lerp(vein ? 0.9 : 0.68, 1.0, mott),
      rough: lerp(vein ? 0.7 : 0.55, vein ? 0.4 : 0.22, streak),
      height: 0.46 + streak * 0.2 + (wall - 0.5) * 0.16,
      mask: 1,
    };
  }
  if (kind === "cranial_nerves") {
    const fasc = Math.abs(fract(u * 7 + 0.12 * Math.sin(v * Math.PI * 2 * 3)) - 0.5) * 2;
    const fiber = 0.5 + 0.5 * Math.sin((v * 36) * Math.PI * 2);
    const edge = smooth(0.35, 0.9, fasc);
    return {
      r: lerp(0.75, 1.06, edge) * lerp(0.96, 1.03, fiber),
      g: lerp(0.72, 1.02, edge),
      b: lerp(0.62, 0.92, edge),
      rough: lerp(0.85, 0.4, fiber),
      height: 0.15 + fasc * 0.7 + fiber * 0.1,
      mask: 1,
    };
  }
  const membrane = fbm(pu, pv, 6, 4);
  const speck = fbm(pu + 0.5, pv + 0.2, 16, 3);
  return {
    r: lerp(0.82, 1.1, membrane),
    g: lerp(0.78, 1.05, membrane) * lerp(0.92, 1.04, speck),
    b: lerp(0.76, 1.02, membrane),
    rough: lerp(0.4, 0.85, speck),
    height: 0.4 + membrane * 0.35 + (speck - 0.5) * 0.2,
    mask: 1,
  };
}

function warpish(u: number, v: number) {
  return fbm(u, v, 3, 2) * 0.8;
}

function toTexture(data: Uint8ClampedArray, sizeX = SIZE, sizeY = SIZE) {
  const canvas = document.createElement("canvas");
  canvas.width = sizeX;
  canvas.height = sizeY;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("texture");
  const image = ctx.createImageData(sizeX, sizeY);
  image.data.set(data);
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makePack(kind: TextureKind): Pack {
  const alb = new Uint8ClampedArray(SIZE * SIZE * 4);
  const surf = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    const v = y / SIZE;
    for (let x = 0; x < SIZE; x++) {
      const ink = shade(kind, x / SIZE, v);
      const i = (y * SIZE + x) * 4;
      alb[i] = sat(ink.r) * 255;
      alb[i + 1] = sat(ink.g) * 255;
      alb[i + 2] = sat(ink.b) * 255;
      alb[i + 3] = 255;
      surf[i] = sat(ink.height) * 255;
      surf[i + 1] = sat(ink.rough) * 255;
      surf[i + 2] = sat(ink.mask) * 255;
      surf[i + 3] = 255;
    }
  }
  const tune = TUNING[kind];
  return { alb: toTexture(alb), surf: toTexture(surf), scale: tune.scale, bump: tune.bump, alpha: tune.alpha };
}

export function ensureTextures() {
  if (cache.size > 0) return;
  for (const kind of KINDS) cache.set(kind, makePack(kind));
}

export function tissueTextures() {
  ensureTextures();
  const out: THREE.Texture[] = [];
  for (const pack of cache.values()) out.push(pack.alb, pack.surf);
  const cord = spinalTextures();
  out.push(cord.alb, cord.surf);
  return out;
}

const TRIPLANAR = /* glsl */ `
varying vec3 vWPos;
varying vec3 vWNorm;
uniform sampler2D tAlb;
uniform sampler2D tSurf;
uniform float uScale;
uniform float uBump;
uniform float uAlpha;
vec3 gSurf;
vec3 triBlend(vec3 n) {
  vec3 b = pow(abs(n), vec3(4.0));
  return b / (b.x + b.y + b.z + 1e-4);
}
vec3 triRgb(sampler2D tex, vec3 p, vec3 b) {
  vec3 x = texture2D(tex, p.yz).rgb;
  vec3 y = texture2D(tex, p.xz).rgb;
  vec3 z = texture2D(tex, p.xy).rgb;
  return x * b.x + y * b.y + z * b.z;
}
`;

function compileTriplanar(shader: { vertexShader: string; fragmentShader: string; uniforms: Record<string, { value: unknown }> }, pack: Pack) {
  shader.uniforms.tAlb = { value: pack.alb };
  shader.uniforms.tSurf = { value: pack.surf };
  shader.uniforms.uScale = { value: pack.scale };
  shader.uniforms.uBump = { value: pack.bump };
  shader.uniforms.uAlpha = { value: pack.alpha };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;`)
    .replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNorm = mat3(modelMatrix) * objectNormal;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${TRIPLANAR}`)
    .replace(
      "#include <map_fragment>",
      `#include <map_fragment>
{
  vec3 b = triBlend(normalize(vWNorm) * (gl_FrontFacing ? 1.0 : -1.0));
  vec3 p = vWPos * uScale;
  gSurf = triRgb(tSurf, p, b);
  diffuseColor.rgb *= triRgb(tAlb, p, b);
  diffuseColor.a *= mix(1.0 - uAlpha, 1.0, gSurf.b);
}`,
    )
    .replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
{
  roughnessFactor = clamp(roughnessFactor * (0.55 + gSurf.g), 0.04, 1.0);
}`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
{
  normal = normalize(normal + vec3(dFdx(gSurf.r), dFdy(gSurf.r), 0.0) * uBump);
}`,
    );
}

export function applyTriplanar(mat: THREE.Material, kind: TextureKind) {
  ensureTextures();
  const pack = cache.get(kind);
  if (!pack) return;
  mat.customProgramCacheKey = () => "neurotome-triplanar-v3";
  mat.onBeforeCompile = (shader) => {
    compileTriplanar(shader, pack);
  };
}

export function applyRepeating(mat: THREE.MeshStandardMaterial, kind: TextureKind, bumpScale: number, repeat = 2) {
  ensureTextures();
  const pack = cache.get(kind);
  if (!pack) return;
  const alb = pack.alb.clone();
  alb.wrapS = alb.wrapT = THREE.RepeatWrapping;
  alb.repeat.set(repeat, repeat);
  alb.colorSpace = THREE.NoColorSpace;
  const surf = pack.surf.clone();
  surf.wrapS = surf.wrapT = THREE.RepeatWrapping;
  surf.repeat.set(repeat, repeat);
  surf.colorSpace = THREE.NoColorSpace;
  mat.map = alb;
  mat.roughnessMap = surf;
  mat.bumpMap = surf;
  mat.bumpScale = bumpScale;
}

const CORD_U = 256;
const CORD_V = 512;
let cordTex: { alb: THREE.CanvasTexture; surf: THREE.CanvasTexture } | null = null;

function wrapDist(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

function shadeCord(u: number, v: number): Ink {
  const wobble = (fbm(0.15, v * 5 + 0.2, 5, 3) - 0.5) * 0.015;
  const artery = smooth(0.02, 0.0035, wrapDist(u, wobble));
  const postL = smooth(0.012, 0.002, wrapDist(u, 0.36 + wobble * 0.4));
  const postR = smooth(0.012, 0.002, wrapDist(u, 0.64 - wobble * 0.4));
  const sulcus = Math.exp(-(((u - 0.5) / 0.018) ** 2));
  const fiber = 0.5 + 0.5 * Math.sin((v * 70 + u * 3) * Math.PI * 2);
  const grain = fbm(u * 2 + 0.4, v * 8, 8, 4);
  const corona = Math.pow(0.5 + 0.5 * Math.sin((v * 36 + grain * 0.15) * Math.PI * 2), 28);
  const blush = smooth(0.62, 0.84, fbm(u + 0.37, v * 3, 6, 3));
  const vessel = Math.max(artery, postL * 0.85, postR * 0.85);
  const base = lerp(0.9, 1.06, grain) * lerp(0.96, 1.03, fiber);
  let r = base * lerp(1, 0.78, sulcus * 0.65);
  let g = base * lerp(1, 0.8, sulcus * 0.5) * lerp(1, 0.9, blush * 0.35);
  let b = base * lerp(0.96, 0.9, grain) * lerp(1, 0.78, sulcus * 0.45);
  r = lerp(r, 0.58, vessel);
  g = lerp(g, artery > 0.4 ? 0.22 : 0.3, vessel);
  b = lerp(b, 0.2, vessel);
  r = lerp(r, 0.82, corona * 0.45);
  g = lerp(g, 0.62, corona * 0.45);
  b = lerp(b, 0.58, corona * 0.45);
  return {
    r,
    g,
    b,
    rough: lerp(0.62, 0.22, vessel) * lerp(0.85, 1.1, fiber) * lerp(1, 1.25, sulcus),
    height: 0.42 + fiber * 0.08 + vessel * 0.48 + corona * 0.12 - sulcus * 0.28 + (grain - 0.5) * 0.08,
    mask: 1,
  };
}

function spinalTextures() {
  if (cordTex) return cordTex;
  const alb = new Uint8ClampedArray(CORD_U * CORD_V * 4);
  const surf = new Uint8ClampedArray(CORD_U * CORD_V * 4);
  for (let y = 0; y < CORD_V; y++) {
    const v = y / CORD_V;
    for (let x = 0; x < CORD_U; x++) {
      const ink = shadeCord(x / CORD_U, v);
      const i = (y * CORD_U + x) * 4;
      alb[i] = sat(ink.r) * 255;
      alb[i + 1] = sat(ink.g) * 255;
      alb[i + 2] = sat(ink.b) * 255;
      alb[i + 3] = 255;
      surf[i] = sat(ink.height) * 255;
      surf[i + 1] = sat(ink.rough) * 255;
      surf[i + 2] = 255;
      surf[i + 3] = 255;
    }
  }
  cordTex = { alb: toTexture(alb, CORD_U, CORD_V), surf: toTexture(surf, CORD_U, CORD_V) };
  return cordTex;
}

export function applySpinalUv(mat: THREE.MeshStandardMaterial) {
  const pack = spinalTextures();
  mat.map = pack.alb;
  mat.roughnessMap = pack.surf;
  mat.bumpMap = pack.surf;
  mat.bumpScale = 0.001;
}
