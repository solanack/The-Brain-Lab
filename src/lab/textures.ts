import * as THREE from "three";
import type { CatId } from "./data";

export type TextureKind = Exclude<CatId, "spinal_cord" | "spinal_nerves" | "peripheral" | "sympathetic" | "heart" | "veins" | "lungs" | "pericardium" | "pleura" | "diaphragm" | "airway" | "hn_bone" | "hn_muscle" | "hn_vessel" | "hn_nerve" | "hn_gland" | "hn_viscera"> | "cell" | "ecm";

type Pack = {
  alb: THREE.CanvasTexture;
  surf: THREE.CanvasTexture;
  scale: number;
  bump: number;
  alpha: number;
};

const SIZE = 512;
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
  "globe",
  "orbit",
  "cell",
  "ecm",
];

const TUNING: Record<TextureKind, { scale: number; bump: number; alpha: number }> = {
  dura: { scale: 16, bump: 6.5, alpha: 0.48 },
  arachnoid: { scale: 34, bump: 9, alpha: 0.72 },
  meninges_dura: { scale: 13, bump: 5, alpha: 0 },
  cortex: { scale: 46, bump: 4.2, alpha: 0 },
  white_matter: { scale: 30, bump: 2.5, alpha: 0 },
  tracts: { scale: 36, bump: 4, alpha: 0 },
  deep_grey: { scale: 50, bump: 3.5, alpha: 0 },
  diencephalon: { scale: 34, bump: 2.5, alpha: 0 },
  ventricles: { scale: 12, bump: 0.8, alpha: 0 },
  brainstem: { scale: 38, bump: 2.5, alpha: 0 },
  cerebellum: { scale: 62, bump: 8.5, alpha: 0 },
  arteries: { scale: 52, bump: 2.2, alpha: 0 },
  veins_sinuses: { scale: 32, bump: 2.4, alpha: 0 },
  cranial_nerves: { scale: 44, bump: 4.5, alpha: 0 },
  globe: { scale: 22, bump: 1.6, alpha: 0 },
  orbit: { scale: 40, bump: 3.2, alpha: 0 },
  cell: { scale: 40, bump: 3, alpha: 0 },
  ecm: { scale: 24, bump: 2, alpha: 0 },
};

const cache = new Map<TextureKind, Pack>();
const TEX_VERSION = 18;

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
    const blot = fbm(pu, pv, 3, 4);
    const pores = fbm(pu + 0.2, pv + 0.8, 11, 2);
    const vein = smooth(0.018, 0.08, Math.abs(fbm(pu * 0.65, pv + 0.3, 5, 4) - 0.5));
    const cap = smooth(0.012, 0.05, Math.abs(fbm(pu + 0.55, pv, 11, 3) - 0.48));
    const open = Math.min(vein, cap);
    const base = lerp(0.52, 0.68, blot);
    return {
      r: Math.min(0.75, base * lerp(0.78, 1, open)),
      g: Math.min(0.66, base * lerp(0.6, 0.86, open) * lerp(0.98, 1.02, pores)),
      b: Math.min(0.6, base * lerp(0.55, 0.8, open)),
      rough: lerp(0.7, 0.4, open),
      height: 0.66 + (pores - 0.5) * 0.06 - (1 - vein) * 0.2 - (1 - cap) * 0.08,
      mask: 1,
    };
  }
  if (kind === "cerebellum") {
    const warp = fbm(pu, pv, 4, 3);
    const folia = Math.abs(Math.sin((v * 26 + warp * 1.6) * Math.PI * 2));
    const grain = fbm(pu + 0.4, pv, 20, 3);
    const groove = smooth(0.15, 0.55, folia);
    return {
      r: Math.min(0.75, lerp(0.66, 0.78, groove)),
      g: Math.min(0.66, lerp(0.58, 0.74, groove)),
      b: Math.min(0.6, lerp(0.54, 0.68, groove)),
      rough: lerp(0.78, 0.4, groove),
      height: 0.18 + folia * 0.72 + (grain - 0.5) * 0.08,
      mask: 1,
    };
  }
  if (kind === "brainstem") {
    const grain = fbm(pu, pv, 7, 4);
    const streak = 0.5 + 0.5 * Math.sin((v * 11 + u * 1.4) * Math.PI * 2);
    const pore = fbm(pu + 0.5, pv, 18, 2);
    const cells = fbm(pu + 0.15, pv + 0.4, 14, 3);
    return {
      r: Math.min(0.92, lerp(0.76, 0.9, grain) * lerp(0.96, 1.02, streak)),
      g: Math.min(0.86, lerp(0.72, 0.86, grain)),
      b: Math.min(0.8, lerp(0.68, 0.82, grain)),
      rough: lerp(0.55, 0.78, pore) * lerp(0.85, 1, 1 - streak),
      height: 0.48 + (grain - 0.5) * 0.18 + streak * 0.08 + cells * 0.16,
      mask: 1,
    };
  }
  if (kind === "deep_grey") {
    const grain = fbm(pu, pv, 14, 4);
    const island = fbm(pu + 0.3, pv + 0.2, 4, 3);
    const stripe = 0.5 + 0.5 * Math.sin((u * 9 + warpish(pu, pv)) * Math.PI * 2);
    const speck = grain > 0.62 || grain < 0.38 ? 1 : 0;
    return {
      r: Math.min(0.9, lerp(0.7, 0.88, island) * (speck ? 0.9 : 1)),
      g: Math.min(0.82, lerp(0.64, 0.82, island) * (speck ? 0.86 : 1)),
      b: Math.min(0.76, lerp(0.6, 0.78, island)),
      rough: lerp(0.5, 0.9, grain),
      height: 0.4 + grain * 0.35 + (1 - stripe) * 0.12,
      mask: 1,
    };
  }
  if (kind === "diencephalon") {
    const domain = fbm(pu, pv, 3, 4);
    const grain = fbm(pu + 0.7, pv, 12, 3);
    return {
      r: lerp(0.76, 0.92, domain),
      g: lerp(0.7, 0.86, domain) * lerp(0.96, 1.02, grain),
      b: lerp(0.66, 0.8, domain),
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
    const tone = lerp(0.6, 0.74, pearl);
    return {
      r: Math.min(0.8, tone * lerp(0.96, 1.02, sheen * 0.2)),
      g: Math.min(0.68, tone * 0.84),
      b: Math.min(0.62, tone * 0.76),
      rough: (lerp(0.88, 0.7, sheen) * pale) + (1 - pale) * 0.72,
      height: 0.5 + (sheen - 0.5) * 0.22 + (pearl - 0.5) * 0.08,
      mask: 1,
    };
  }
  if (kind === "tracts") {
    const bundle = Math.abs(Math.sin((u * 7 + fbm(pu, pv, 3, 2)) * Math.PI * 2));
    const fiber = 0.5 + 0.5 * Math.sin((v * 28 + u * 2) * Math.PI * 2);
    const core = smooth(0.2, 0.85, bundle);
    const endGrain = fbm(pu + 0.2, pv + 0.6, 16, 3);
    return {
      r: Math.min(0.88, lerp(0.74, 0.86, core) * lerp(0.98, 1.04, fiber * 0.3)),
      g: Math.min(0.72, lerp(0.62, 0.74, core)),
      b: Math.min(0.66, lerp(0.56, 0.68, core)),
      rough: lerp(0.86, 0.68, fiber * core),
      height: 0.22 + bundle * 0.55 + fiber * 0.18 + endGrain * 0.2,
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
    const ridge = fbm(pu, pv, 2, 3);
    return {
      r: lerp(0.62, 0.8, stain) * lerp(0.9, 1, weave),
      g: lerp(0.5, 0.68, stain) * lerp(0.88, 0.98, weave),
      b: lerp(0.46, 0.62, stain) * lerp(0.86, 0.96, weave),
      rough: lerp(0.95, 0.55, weave),
      height: 0.12 + weave * 0.5 + ridge * 0.38,
      mask: 0.25 + weave * 0.75,
    };
  }
  if (kind === "arachnoid") {
    const web = Math.abs(fbm(pu, pv, 9, 4) - 0.5);
    const strand = 1 - smooth(0.015, 0.08, web);
    return {
      r: lerp(0.42, 0.94, strand),
      g: lerp(0.3, 0.72, strand),
      b: lerp(0.26, 0.64, strand),
      rough: lerp(0.88, 0.48, strand),
      height: 0.12 + strand * 0.84,
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
    const fasc = Math.abs(fract(u * 9 + 0.08 * Math.sin(v * Math.PI * 6)) - 0.5) * 2;
    const fiber = 0.5 + 0.5 * Math.sin(v * 48 * Math.PI * 2);
    const edge = smooth(0.28, 0.86, fasc);
    return {
      r: lerp(0.72, 0.94, edge) * lerp(0.96, 1.02, fiber),
      g: lerp(0.66, 0.88, edge),
      b: lerp(0.52, 0.74, edge),
      rough: lerp(0.72, 0.38, fiber),
      height: 0.18 + fasc * 0.62 + fiber * 0.08,
      mask: 1,
    };
  }
  if (kind === "globe") {
    const mott = fbm(pu, pv, 5, 3);
    const vessel = smooth(0.01, 0.05, Math.abs(fbm(pu + 0.2, pv, 9, 3) - 0.5));
    return {
      r: lerp(0.9, 1.02, mott) * lerp(0.78, 1, vessel),
      g: lerp(0.86, 0.98, mott) * lerp(0.7, 1, vessel),
      b: lerp(0.82, 0.96, mott) * lerp(0.72, 1, vessel),
      rough: lerp(0.55, 0.32, vessel),
      height: 0.46 + (mott - 0.5) * 0.08 + (1 - vessel) * 0.2,
      mask: 1,
    };
  }
  if (kind === "orbit") {
    const fiber = 0.5 + 0.5 * Math.sin((v * 22 + u * 1.4) * Math.PI * 2);
    const grain = fbm(pu, pv, 8, 3);
    return {
      r: lerp(0.78, 1.05, grain) * lerp(0.9, 1.04, fiber),
      g: lerp(0.62, 0.92, grain),
      b: lerp(0.55, 0.82, grain),
      rough: lerp(0.72, 0.4, fiber),
      height: 0.3 + fiber * 0.45 + grain * 0.16,
      mask: 1,
    };
  }
  if (kind === "cell") {
    const grain = fbm(pu, pv, 10, 3);
    const membrane = fbm(pu + 0.3, pv, 5, 3);
    return {
      r: Math.min(0.76, lerp(0.6, 0.74, membrane)),
      g: Math.min(0.62, lerp(0.46, 0.6, membrane) * lerp(0.96, 1.02, grain)),
      b: Math.min(0.56, lerp(0.42, 0.54, membrane)),
      rough: lerp(0.74, 0.92, grain),
      height: 0.45 + (membrane - 0.5) * 0.18,
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
  tex.anisotropy = 8;
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

let builtVersion = 0;

export function ensureTextures() {
  if (builtVersion === TEX_VERSION && cache.size > 0) return;
  cache.clear();
  builtVersion = TEX_VERSION;
  for (const kind of KINDS) cache.set(kind, makePack(kind));
}

export function tissueTextures() {
  ensureTextures();
  const out: THREE.Texture[] = [];
  for (const pack of cache.values()) out.push(pack.alb, pack.surf);
  const cord = spinalTextures();
  out.push(cord.alb, cord.surf);
  const nerve = nerveTextures();
  out.push(nerve.alb, nerve.surf);
  const heart = heartTextures();
  out.push(heart.alb, heart.surf);
  return out;
}

const TRIPLANAR = /* glsl */ `
varying vec3 vWPos;
varying vec3 vWNorm;
varying vec3 vFiber;
uniform sampler2D tAlb;
uniform sampler2D tSurf;
uniform float uScale;
uniform float uBump;
uniform float uAlpha;
uniform float uClose;
uniform float uAniso;
uniform float uScatter;
uniform float uDetail;
uniform float uPink;
vec3 gSurf;
vec3 gBlend;
vec3 gP;
float gCavity;
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
  shader.uniforms.uClose = { value: 0 };
  shader.uniforms.uAniso = { value: 0 };
  shader.uniforms.uScatter = { value: 0 };
  shader.uniforms.uDetail = { value: 1 };
  shader.uniforms.uPink = { value: 0 };
  shader.uniforms.uFiber = { value: new THREE.Vector3(0, 1, 0) };
  shader.uniforms.uPulse = { value: 0 };
  shader.uniforms.uDisplace = { value: 0 };
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
varying vec3 vWPos;
varying vec3 vWNorm;
varying vec3 vFiber;
uniform vec3 uFiber;
uniform float uPulse;
uniform float uDisplace;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
{
  float ridge = sin(transformed.x * 46.0 + transformed.y * 15.0) * sin(transformed.z * 34.0 + transformed.y * 8.0);
  transformed += objectNormal * (ridge * uDisplace + uPulse);
}`,
    )
    .replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNorm = mat3(modelMatrix) * objectNormal;
vFiber = mat3(modelMatrix) * uFiber;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${TRIPLANAR}`)
    .replace(
      "#include <map_fragment>",
      `#include <map_fragment>
{
  vec3 wn = normalize(vWNorm) * (gl_FrontFacing ? 1.0 : -1.0);
  gBlend = triBlend(wn);
  gP = vWPos * uScale;
  gSurf = triRgb(tSurf, gP, gBlend);
  vec3 alb = min(triRgb(tAlb, gP, gBlend), vec3(0.75));
  if (uClose > 0.04) {
    vec3 hi = triRgb(tAlb, gP * 2.5, gBlend);
    alb = min(mix(alb, alb * (0.92 + hi * 0.1), uClose * 0.55), vec3(0.75));
  }
  diffuseColor.rgb *= alb * 0.65;
  gCavity = smoothstep(0.55, 0.28, gSurf.r);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.82, 0.74, 0.7), gCavity * 0.45);
  diffuseColor.a *= mix(1.0, mix(1.0 - uAlpha, 1.0, gSurf.b), uDetail);
  if (uPink > 0.5) {
    float tone = clamp(0.82 + alb.r * 0.18, 0.82, 1.0);
    diffuseColor.rgb = vec3(0.66, 0.37, 0.30) * tone;
  }
}`,
    )
    .replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
{
  float mapped = clamp(roughnessFactor * (0.55 + gSurf.g), 0.04, 1.0);
  float align = abs(dot(normalize(vWNorm), normalize(vFiber + vec3(1e-5))));
  mapped = clamp(mapped * mix(1.0, 0.62, align * uAniso), 0.04, 1.0);
  if (uClose > 0.04) {
    float fine = triRgb(tSurf, gP * 4.2, gBlend).g;
    mapped = clamp(mix(mapped, mapped * (0.62 + fine * 0.7), uClose), 0.04, 1.0);
  }
  roughnessFactor = mix(roughnessFactor, mapped, uDetail);
}`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
{
  float hi = triRgb(tSurf, gP * 3.2, gBlend).r;
  vec3 fine = vec3(dFdx(gSurf.r), dFdy(gSurf.r), 0.0) + vec3(dFdx(hi), dFdy(hi), 0.0) * uClose;
  normal = normalize(normal + fine * uBump * uDetail * (1.0 + uClose * 1.35) * (1.0 + gCavity * 0.35));
}`,
    )
    .replace(
      "#include <lights_physical_fragment>",
      `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  material.clearcoatRoughness = clamp(material.clearcoatRoughness * (0.88 + gSurf.g * 0.28), 0.2, 1.0);
#endif`,
    )
    .replace(
      "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
      `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
{
  float gShade = smoothstep(0.58, 0.22, gSurf.r);
  float wrap = pow(clamp(dot(normal, vec3(0.15, 0.95, 0.25)) * 0.55 + 0.45, 0.0, 1.0), 1.5);
  outgoingLight += vec3(0.42, 0.18, 0.14) * wrap * uScatter * (0.012 + gShade * 0.012);
  outgoingLight *= mix(vec3(1.0), vec3(0.9, 0.84, 0.8), gShade * 0.16);
  outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.05 + vec3(0.012));
}`,
    );
}

export function applyTriplanar(mat: THREE.Material, kind: TextureKind) {
  ensureTextures();
  const pack = cache.get(kind);
  if (!pack) return;
  mat.customProgramCacheKey = () => "neurotome-triplanar-v20";
  mat.onBeforeCompile = (shader) => {
    compileTriplanar(shader, pack);
    const fiber = mat.userData.fiber as THREE.Vector3 | undefined;
    if (fiber) (shader.uniforms.uFiber.value as THREE.Vector3).copy(fiber);
    shader.uniforms.uAniso.value = (mat.userData.aniso as number) ?? 0;
    shader.uniforms.uScatter.value = (mat.userData.scatter as number) ?? 0;
    shader.uniforms.uPink.value = (mat.userData.pink as number) ?? 0;
    mat.userData.tri = shader.uniforms;
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

const CORD_U = 512;
const CORD_V = 1024;
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

const HEART_U = 256;
const HEART_V = 256;
let heartTex: { alb: THREE.CanvasTexture; surf: THREE.CanvasTexture } | null = null;

function shadeHeart(u: number, v: number): Ink {
  const fiber = 0.5 + 0.5 * Math.sin((v * 36 + u * 8) * Math.PI * 2);
  const grain = fbm(u * 3, v * 4, 4, 3);
  const vessel = smooth(0.01, 0.002, wrapDist(u, 0.31 + 0.04 * Math.sin(v * Math.PI * 4)));
  let r = lerp(0.82, 0.96, fiber) * lerp(0.94, 1.02, grain);
  let g = lerp(0.74, 0.9, fiber);
  let b = lerp(0.7, 0.86, fiber);
  r = lerp(r, 0.55, vessel * 0.65);
  g = lerp(g, 0.28, vessel * 0.65);
  b = lerp(b, 0.26, vessel * 0.65);
  return {
    r,
    g,
    b,
    rough: lerp(0.58, 0.36, fiber),
    height: 0.4 + fiber * 0.22 + (grain - 0.5) * 0.08 + vessel * 0.12,
    mask: 1,
  };
}

function heartTextures() {
  if (heartTex) return heartTex;
  const alb = new Uint8ClampedArray(HEART_U * HEART_V * 4);
  const surf = new Uint8ClampedArray(HEART_U * HEART_V * 4);
  for (let y = 0; y < HEART_V; y++) {
    for (let x = 0; x < HEART_U; x++) {
      const ink = shadeHeart(x / HEART_U, y / HEART_V);
      const i = (y * HEART_U + x) * 4;
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
  const albTex = toTexture(alb, HEART_U, HEART_V);
  const surfTex = toTexture(surf, HEART_U, HEART_V);
  albTex.wrapS = albTex.wrapT = THREE.RepeatWrapping;
  surfTex.wrapS = surfTex.wrapT = THREE.RepeatWrapping;
  albTex.repeat.set(1, 2);
  surfTex.repeat.set(1, 2);
  heartTex = { alb: albTex, surf: surfTex };
  return heartTex;
}

export function applyHeartMap(mat: THREE.MeshStandardMaterial) {
  const pack = heartTextures();
  mat.map = pack.alb;
  mat.roughnessMap = pack.surf;
  mat.bumpMap = pack.surf;
  mat.bumpScale = 0.00025;
}

const LUNG_U = 256;
const LUNG_V = 256;
let lungTex: { alb: THREE.CanvasTexture; surf: THREE.CanvasTexture } | null = null;

function shadeLung(u: number, v: number): Ink {
  const grain = fbm(u * 4, v * 5, 4, 4);
  const cu = fract(u * 8);
  const cv = fract(v * 10);
  const edge = Math.min(cu, 1 - cu, cv, 1 - cv);
  const septum = 1 - smooth(0.015, 0.11, edge);
  const lobule = 0.5 + 0.5 * Math.sin((Math.floor(u * 8) * 1.7 + Math.floor(v * 10) * 2.3) * 3.1);
  const vessel = smooth(0.01, 0.002, wrapDist(u, 0.22 + 0.05 * Math.sin(v * Math.PI * 4)));
  const vessel2 = smooth(0.007, 0.0014, wrapDist(v, 0.71 + 0.04 * Math.sin(u * Math.PI * 5)));
  const blood = Math.max(vessel, vessel2 * 0.65);
  const soot = hash(Math.floor(u * 90), Math.floor(v * 90));
  const speck = soot > 0.94 ? (soot - 0.94) / 0.06 : 0;
  let r = lerp(0.8, 0.98, grain) * lerp(0.92, 1.04, lobule);
  let g = lerp(0.7, 0.88, grain);
  let b = lerp(0.68, 0.84, grain);
  r = lerp(r, r * 0.72, septum);
  g = lerp(g, g * 0.7, septum);
  b = lerp(b, b * 0.72, septum);
  r = lerp(r, 0.52, blood * 0.7);
  g = lerp(g, 0.24, blood * 0.7);
  b = lerp(b, 0.24, blood * 0.7);
  r = lerp(r, 0.42, speck * 0.65);
  g = lerp(g, 0.42, speck * 0.65);
  b = lerp(b, 0.46, speck * 0.65);
  return {
    r,
    g,
    b,
    rough: lerp(0.62, 0.34, grain) * lerp(1, 0.75, septum),
    height: 0.42 + grain * 0.22 + (1 - septum) * 0.16 + blood * 0.12 - speck * 0.08,
    mask: 1,
  };
}

function lungTextures() {
  if (lungTex) return lungTex;
  const alb = new Uint8ClampedArray(LUNG_U * LUNG_V * 4);
  const surf = new Uint8ClampedArray(LUNG_U * LUNG_V * 4);
  for (let y = 0; y < LUNG_V; y++) {
    for (let x = 0; x < LUNG_U; x++) {
      const ink = shadeLung(x / LUNG_U, y / LUNG_V);
      const i = (y * LUNG_U + x) * 4;
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
  const albTex = toTexture(alb, LUNG_U, LUNG_V);
  const surfTex = toTexture(surf, LUNG_U, LUNG_V);
  albTex.wrapS = albTex.wrapT = THREE.RepeatWrapping;
  surfTex.wrapS = surfTex.wrapT = THREE.RepeatWrapping;
  albTex.repeat.set(1, 1);
  surfTex.repeat.set(1, 1);
  lungTex = { alb: albTex, surf: surfTex };
  return lungTex;
}

export function applyLungMap(mat: THREE.MeshStandardMaterial) {
  const pack = lungTextures();
  mat.map = pack.alb;
  mat.roughnessMap = pack.surf;
  mat.bumpMap = pack.surf;
  mat.bumpScale = 0.00045;
}

let periTex: { alb: THREE.CanvasTexture; surf: THREE.CanvasTexture } | null = null;

function shadePericardium(u: number, v: number): Ink {
  const fiber = 0.5 + 0.5 * Math.sin((u * 28 + v * 3) * Math.PI * 2);
  const cross = 0.5 + 0.5 * Math.sin((v * 22 + u * 2) * Math.PI * 2);
  const grain = fbm(u * 4, v * 4, 3, 3);
  const weave = Math.max(fiber, cross * 0.65);
  return {
    r: lerp(0.86, 1, weave) * lerp(0.96, 1.02, grain),
    g: lerp(0.82, 0.96, weave),
    b: lerp(0.76, 0.9, weave),
    rough: lerp(0.72, 0.46, weave),
    height: 0.3 + weave * 0.4 + (grain - 0.5) * 0.08,
    mask: 1,
  };
}

function pericardiumTextures() {
  if (periTex) return periTex;
  const alb = new Uint8ClampedArray(LUNG_U * LUNG_V * 4);
  const surf = new Uint8ClampedArray(LUNG_U * LUNG_V * 4);
  for (let y = 0; y < LUNG_V; y++) {
    for (let x = 0; x < LUNG_U; x++) {
      const ink = shadePericardium(x / LUNG_U, y / LUNG_V);
      const i = (y * LUNG_U + x) * 4;
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
  const albTex = toTexture(alb, LUNG_U, LUNG_V);
  const surfTex = toTexture(surf, LUNG_U, LUNG_V);
  albTex.wrapS = albTex.wrapT = THREE.RepeatWrapping;
  surfTex.wrapS = surfTex.wrapT = THREE.RepeatWrapping;
  albTex.repeat.set(3, 2);
  surfTex.repeat.set(3, 2);
  periTex = { alb: albTex, surf: surfTex };
  return periTex;
}

export function applyPericardiumMap(mat: THREE.MeshStandardMaterial) {
  const pack = pericardiumTextures();
  mat.map = pack.alb;
  mat.roughnessMap = pack.surf;
  mat.bumpMap = pack.surf;
  mat.bumpScale = 0.0003;
}

const NERVE_U = 256;
const NERVE_V = 512;
let nerveTex: { alb: THREE.CanvasTexture; surf: THREE.CanvasTexture } | null = null;

function shadeNerve(u: number, v: number): Ink {
  const fasc = Math.pow(0.35 + 0.65 * Math.abs(Math.sin(u * Math.PI * 4)), 0.8);
  const fiber = 0.5 + 0.5 * Math.sin((v * 42 + u * 1.6) * Math.PI * 2);
  const vessel = smooth(0.012, 0.0018, wrapDist(u, 0.22 + 0.05 * Math.sin(v * Math.PI * 6)));
  const vessel2 = smooth(0.008, 0.0014, wrapDist(u, 0.71 + 0.03 * Math.sin(v * Math.PI * 4 + 1.2)));
  const blood = Math.max(vessel, vessel2 * 0.75);
  let r = lerp(0.72, 0.94, fasc) * lerp(0.96, 1.02, fiber);
  let g = lerp(0.66, 0.88, fasc) * lerp(0.97, 1.01, fiber);
  let b = lerp(0.52, 0.74, fasc);
  r = lerp(r, 0.62, blood);
  g = lerp(g, 0.28, blood);
  b = lerp(b, 0.24, blood);
  return {
    r,
    g,
    b,
    rough: lerp(0.62, 0.32, fasc) * lerp(1, 0.86, fiber),
    height: 0.28 + fasc * 0.55 + fiber * 0.06 + blood * 0.18,
    mask: 1,
  };
}

function nerveTextures() {
  if (nerveTex) return nerveTex;
  const alb = new Uint8ClampedArray(NERVE_U * NERVE_V * 4);
  const surf = new Uint8ClampedArray(NERVE_U * NERVE_V * 4);
  for (let y = 0; y < NERVE_V; y++) {
    const v = y / NERVE_V;
    for (let x = 0; x < NERVE_U; x++) {
      const ink = shadeNerve(x / NERVE_U, v);
      const i = (y * NERVE_U + x) * 4;
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
  const albTex = toTexture(alb, NERVE_U, NERVE_V);
  const surfTex = toTexture(surf, NERVE_U, NERVE_V);
  albTex.wrapS = albTex.wrapT = THREE.RepeatWrapping;
  surfTex.wrapS = surfTex.wrapT = THREE.RepeatWrapping;
  nerveTex = { alb: albTex, surf: surfTex };
  return nerveTex;
}

export function nerveMaterial(color: THREE.Color) {
  const pack = nerveTextures();
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.4,
    metalness: 0.02,
    map: pack.alb,
    roughnessMap: pack.surf,
    bumpMap: pack.surf,
    bumpScale: 0.00035,
    clearcoat: 0.14,
    clearcoatRoughness: 0.46,
    sheen: 0.16,
    sheenColor: new THREE.Color("#e4a898"),
    sheenRoughness: 0.55,
    envMapIntensity: 0.1,
  });
  return mat;
}
