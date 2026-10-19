import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  CAT_BY_ID,
  CAT_IDS,
  RECIPES,
  RECIPE_BY_ID,
  pearlFor,
  type CatId,
  type Recipe,
  type SampleId,
  type Stratum,
} from "./data";
import { useLab, type Axis, type Meta } from "./store";
import { applyRepeating, applySpinalUv, applyTriplanar, tissueTextures } from "./textures";

type Side = "left" | "right" | "median";

type Rec = {
  key: string;
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  cat: CatId;
  side: Side;
  label: string;
  region: string;
  hay: string;
  restCenter: THREE.Vector3;
  restPosition: THREE.Vector3;
  dir: THREE.Vector3;
  radius: number;
  weight: number;
  glassy: boolean;
  specimen: THREE.Color;
  parcel: THREE.Color;
  placed: boolean;
};

type Anchor = {
  mesh: THREE.Mesh;
  localPoint: THREE.Vector3;
  normal: THREE.Vector3;
};

type Frame = {
  center: THREE.Vector3;
  superior: THREE.Vector3;
  anterior: THREE.Vector3;
  right: THREE.Vector3;
  span: number;
  maxDim: number;
  unitToMm: number;
  box: THREE.Box3;
  proj: Record<Axis, { min: number; max: number }>;
  homeCam: THREE.Vector3;
  homeTarget: THREE.Vector3;
  tray: THREE.Vector3;
  records: Rec[];
  anchors: Partial<Record<SampleId, Anchor>>;
};

const Y_UP = new THREE.Vector3(0, 1, 0);
const _desired = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _view = new THREE.Vector3();
const WARM = new THREE.Color("#ffd2b4");
const COOL = new THREE.Color("#dce9ff");
const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const NO_CLIP: THREE.Plane[] = [];
const CLIP_ON = [CLIP];

const JUNK = new Set([
  "Bonus collection",
  "Scene Collection",
  "Regions of human body",
  "Head",
  "Main divisions",
  "Nervous system",
  "Central nervous system",
]);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function asCat(value: unknown): CatId | null {
  return typeof value === "string" && (CAT_IDS as readonly string[]).includes(value) ? (value as CatId) : null;
}

function asSide(value: unknown): Side {
  return value === "left" || value === "right" || value === "median" ? value : "median";
}

function meshCenter(mesh: THREE.Mesh, target = new THREE.Vector3()) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox!.getCenter(target);
}

function meshRadius(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  return mesh.geometry.boundingSphere?.radius ?? 0.01;
}

function projectBox(box: THREE.Box3, axis: THREE.Vector3) {
  const min = box.min;
  const max = box.max;
  let lo = Infinity;
  let hi = -Infinity;
  for (let xi = 0; xi < 2; xi++) {
    for (let yi = 0; yi < 2; yi++) {
      for (let zi = 0; zi < 2; zi++) {
        const x = xi ? max.x : min.x;
        const y = yi ? max.y : min.y;
        const z = zi ? max.z : min.z;
        const p = axis.x * x + axis.y * y + axis.z * z;
        if (p < lo) lo = p;
        if (p > hi) hi = p;
      }
    }
  }
  return { min: lo, max: hi };
}

function varyColor(hex: string, id: number) {
  const color = new THREE.Color(hex);
  const wobble = ((id * 17) % 9) - 4;
  color.offsetHSL(0, 0, wobble * 0.01);
  return color;
}

function parcelColor(cat: CatId, index: number) {
  const span: Record<CatId, [number, number]> = {
    dura: [0.07, 0.11],
    arachnoid: [0.46, 0.52],
    meninges_dura: [0.07, 0.12],
    cortex: [0.01, 0.08],
    white_matter: [0.09, 0.13],
    tracts: [0.08, 0.14],
    deep_grey: [0.98, 1.04],
    diencephalon: [0.02, 0.07],
    ventricles: [0.45, 0.53],
    brainstem: [0.03, 0.09],
    spinal_cord: [0.08, 0.12],
    cerebellum: [0.015, 0.06],
    arteries: [0.99, 1.02],
    veins_sinuses: [0.58, 0.67],
    cranial_nerves: [0.1, 0.15],
  };
  const [a, b] = span[cat];
  const h = a + ((index * 0.61803398875) % 1) * (b - a);
  const pale = cat === "white_matter" || cat === "tracts";
  const sat = pale ? 0.14 : cat === "arteries" ? 0.58 : cat === "ventricles" ? 0.22 : 0.34;
  const light = pale ? 0.78 : cat === "ventricles" ? 0.74 : 0.56;
  return new THREE.Color().setHSL(h % 1, sat, light);
}

function hashUnit(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function makeMaterial(cat: CatId, specimen: THREE.Color, seed = 1) {
  const meta = CAT_BY_ID[cat];
  const glassy = cat === "dura" || cat === "arachnoid" || cat === "ventricles";
  const sheet = cat === "dura" || cat === "arachnoid" || cat === "meninges_dura" || cat === "ventricles";
  const wet =
    cat === "cortex" ||
    cat === "cerebellum" ||
    cat === "brainstem" ||
    cat === "spinal_cord" ||
    cat === "deep_grey" ||
    cat === "diencephalon";
  const flesh = cat === "cortex" || cat === "cerebellum" || cat === "deep_grey" || cat === "brainstem";
  const vessel = cat === "arteries" || cat === "veins_sinuses";
  const physical = wet || vessel || cat === "ventricles" || cat === "arachnoid";
  const roughJitter = (hashUnit(seed) - 0.5) * 0.08;
  if (flesh) specimen.offsetHSL((hashUnit(seed + 3) - 0.5) * 0.02, (hashUnit(seed + 9) - 0.5) * 0.05, 0);
  const roughness = flesh
    ? THREE.MathUtils.clamp(0.46 + roughJitter, 0.4, 0.55)
    : vessel
      ? 0.28
      : wet
        ? THREE.MathUtils.clamp(0.42 + roughJitter * 0.4, 0.36, 0.52)
        : meta.rough;
  const mat = new (physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({
    color: specimen,
    roughness,
    metalness: vessel ? 0.12 : 0.02,
    envMapIntensity: vessel ? 0.7 : cat === "cortex" || cat === "cerebellum" ? 0.38 : wet ? 0.32 : 0.4,
    side: sheet ? THREE.DoubleSide : THREE.FrontSide,
    transparent: glassy || meta.transparent,
    opacity: meta.opacity,
    depthWrite: !glassy && meta.opacity > 0.6,
  });
  if (physical) {
    const phys = mat as THREE.MeshPhysicalMaterial;
    phys.clearcoat = wet || vessel ? 0.16 : 0;
    phys.clearcoatRoughness = wet ? 0.42 : 0.5;
    phys.sheen = wet ? 0.12 : 0;
    phys.sheenRoughness = 0.55;
    phys.sheenColor.set("#a87468");
    if (vessel) {
      phys.emissive.copy(specimen).multiplyScalar(0.12);
      phys.emissiveIntensity = cat === "arteries" ? 0.08 : 0.05;
    }
    if (flesh) {
      phys.emissive.set("#3d1816");
      phys.emissiveIntensity = 0.025;
    }
    if (cat === "ventricles") {
      phys.transmission = 0.72;
      phys.thickness = 0.08;
      phys.ior = 1.33;
      phys.roughness = 0.06;
      phys.attenuationDistance = 0.12;
      phys.attenuationColor = new THREE.Color("#d5ece8");
    }
    if (cat === "spinal_cord") {
      phys.roughness = 0.36;
      phys.clearcoat = 0.24;
      phys.clearcoatRoughness = 0.32;
      phys.sheen = 0.16;
      phys.sheenColor.set("#f0e2d6");
      phys.envMapIntensity = 0.45;
      mat.roughness = 0.36;
    }
    if (cat === "arachnoid") {
      phys.iridescence = 0.14;
      phys.iridescenceIOR = 1.36;
      phys.iridescenceThicknessRange = [80, 280];
      phys.roughness = 0.18;
      phys.clearcoat = 0.35;
      phys.clearcoatRoughness = 0.22;
      phys.transmission = 0.04;
      phys.thickness = 0.00035;
      phys.ior = 1.38;
      phys.attenuationDistance = 0.008;
      phys.attenuationColor = new THREE.Color("#e4eef2");
      mat.roughness = 0.18;
    }
  }
  mat.userData.rough0 = mat.roughness;
  mat.userData.coat0 = (mat as THREE.MeshPhysicalMaterial).clearcoat ?? 0;
  mat.userData.aniso = cat === "tracts" ? 0.34 : cat === "white_matter" ? 0.24 : cat === "brainstem" ? 0.12 : 0;
  mat.userData.scatter = cat === "cortex" || cat === "cerebellum" ? 0.55 : cat === "brainstem" ? 0.34 : cat === "deep_grey" ? 0.16 : 0;
  mat.userData.fiber = new THREE.Vector3(0, 1, 0);
  if (vessel) {
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -2;
    mat.polygonOffsetUnits = -2;
  }
  if (cat === "spinal_cord") applySpinalUv(mat);
  else applyTriplanar(mat, cat);
  return mat;
}

function buildHull(points: THREE.Vector3[], center: THREE.Vector3, scale: number, smoothPasses: number) {
  const latN = 40;
  const lonN = 64;
  const maxR = new Float32Array(latN * lonN);
  let radiusSum = 0;
  let radiusCount = 0;
  const tmp = new THREE.Vector3();
  for (const p of points) {
    tmp.copy(p).sub(center);
    const r = tmp.length();
    if (r < 1e-8) continue;
    radiusSum += r;
    radiusCount++;
    const lat = Math.acos(THREE.MathUtils.clamp(tmp.y / r, -1, 1));
    let lon = Math.atan2(tmp.z, tmp.x);
    if (lon < 0) lon += Math.PI * 2;
    const i = Math.min(latN - 1, Math.floor((lat / Math.PI) * (latN - 1)));
    const j = Math.min(lonN - 1, Math.floor((lon / (Math.PI * 2)) * lonN));
    const k = i * lonN + j;
    if (r > maxR[k]) maxR[k] = r;
  }
  const mean = radiusCount ? radiusSum / radiusCount : 0.1;
  const next = new Float32Array(maxR.length);
  for (let pass = 0; pass < 8; pass++) {
    let holes = 0;
    for (let i = 0; i < latN; i++) {
      for (let j = 0; j < lonN; j++) {
        const k = i * lonN + j;
        if (maxR[k] > 0) {
          next[k] = maxR[k];
          continue;
        }
        holes++;
        let m = 0;
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          if (ii < 0 || ii >= latN) continue;
          for (let dj = -1; dj <= 1; dj++) {
            const jj = (j + dj + lonN) % lonN;
            m = Math.max(m, maxR[ii * lonN + jj]);
          }
        }
        next[k] = m;
      }
    }
    maxR.set(next);
    if (!holes) break;
  }
  for (let pass = 0; pass < smoothPasses; pass++) {
    for (let i = 0; i < latN; i++) {
      for (let j = 0; j < lonN; j++) {
        let s = 0;
        let c = 0;
        for (let di = -1; di <= 1; di++) {
          const ii = Math.min(latN - 1, Math.max(0, i + di));
          for (let dj = -1; dj <= 1; dj++) {
            const jj = (j + dj + lonN) % lonN;
            const v = maxR[ii * lonN + jj];
            if (v > 0) {
              s += v;
              c++;
            }
          }
        }
        next[i * lonN + j] = c ? s / c : mean;
      }
    }
    maxR.set(next);
  }
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < latN; i++) {
    const lat = (i / (latN - 1)) * Math.PI;
    const sl = Math.sin(lat);
    const cl = Math.cos(lat);
    for (let j = 0; j < lonN; j++) {
      const lon = (j / lonN) * Math.PI * 2;
      const r = (maxR[i * lonN + j] || mean) * scale;
      positions.push(r * sl * Math.cos(lon), r * cl, r * sl * Math.sin(lon));
    }
  }
  for (let i = 0; i < latN - 1; i++) {
    for (let j = 0; j < lonN; j++) {
      const j2 = (j + 1) % lonN;
      const a = i * lonN + j;
      const b = i * lonN + j2;
      const c = (i + 1) * lonN + j;
      const d = (i + 1) * lonN + j2;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function collectPoints(meshes: THREE.Mesh[], cap: number) {
  let total = 0;
  for (const mesh of meshes) {
    const attr = mesh.geometry.getAttribute("position");
    if (attr) total += attr.count;
  }
  const step = Math.max(1, Math.ceil(total / cap));
  const out: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    const attr = mesh.geometry.getAttribute("position");
    if (!attr) continue;
    for (let i = 0; i < attr.count; i += step) {
      v.fromBufferAttribute(attr, i);
      out.push(v.clone());
    }
  }
  return out;
}

function orientAndBake(root: THREE.Object3D, meshes: THREE.Mesh[]) {
  const centerOf = (label: string, side?: Side) => {
    const found = meshes.filter((mesh) => {
      const data = mesh.userData as { bx_label?: string; bx_side?: string };
      return data.bx_label === label && (side == null || data.bx_side === side);
    });
    if (!found.length) return null;
    const acc = new THREE.Vector3();
    for (const mesh of found) acc.add(new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()));
    return acc.multiplyScalar(1 / found.length);
  };
  const pre = centerOf("Precentral gyrus", "left");
  const med = centerOf("Medulla oblongata");
  if (pre && med) {
    const delta = pre.clone().sub(med);
    const ax = Math.abs(delta.x);
    const ay = Math.abs(delta.y);
    const az = Math.abs(delta.z);
    if (az >= ay && az >= ax) root.rotateX(delta.z > 0 ? -Math.PI / 2 : Math.PI / 2);
    else if (ax > ay && ax >= az) root.rotateZ(delta.x > 0 ? Math.PI / 2 : -Math.PI / 2);
    else if (delta.y < 0) root.rotateX(Math.PI);
  }
  root.updateMatrixWorld(true);
  const doomed = new Set<THREE.BufferGeometry>();
  for (const mesh of meshes) {
    const previous = mesh.geometry;
    const baked = previous.clone();
    baked.applyMatrix4(mesh.matrixWorld);
    mesh.geometry = baked;
    doomed.add(previous);
    mesh.position.set(0, 0, 0);
    mesh.quaternion.identity();
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();
  }
  for (const geo of doomed) geo.dispose();
  root.position.set(0, 0, 0);
  root.quaternion.identity();
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
}

function outerHit(mesh: THREE.Mesh, modelCenter: THREE.Vector3, span: number) {
  const center = meshCenter(mesh);
  const outward = center.clone().sub(modelCenter);
  if (outward.lengthSq() < 1e-10) outward.copy(Y_UP);
  outward.normalize();
  const origin = center.clone().addScaledVector(outward, span);
  const ray = new THREE.Raycaster(origin, modelCenter.clone().sub(origin).normalize());
  const hits = ray.intersectObject(mesh, false);
  if (!hits[0] || !hits[0].face) return { point: center, normal: outward };
  const normal = hits[0].face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
  if (normal.dot(ray.ray.direction) > 0) normal.negate();
  return { point: hits[0].point.clone(), normal };
}

function tagSprite(text: string, tint: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = tint;
  ctx.font = "600 64px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 68);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
  sprite.renderOrder = 10;
  return sprite;
}

const UNIT = {
  soma: new THREE.SphereGeometry(1, 12, 10),
  cone: new THREE.ConeGeometry(1, 1, 9),
  glia: new THREE.IcosahedronGeometry(1, 0),
};

function cellScale(kind: Stratum["cells"], betz: boolean) {
  if (kind === "betz" || betz) return { soma: 0.00115, cone: 0.00042, coneH: 0.0036 };
  if (kind === "purkinje") return { soma: 0.00105, cone: 0.0016, coneH: 0.0042 };
  if (kind === "granule") return { soma: 0.00042, cone: 0, coneH: 0 };
  if (kind === "glia") return { soma: 0.00048, cone: 0, coneH: 0 };
  if (kind === "small-pyramid") return { soma: 0.00055, cone: 0.00026, coneH: 0.0018 };
  if (kind === "fusiform") return { soma: 0.00058, cone: 0.00022, coneH: 0.002 };
  if (kind === "pyramid") return { soma: 0.00072, cone: 0.00032, coneH: 0.0025 };
  return { soma: 0.0005, cone: 0, coneH: 0 };
}

function buildTissue(recipe: Recipe) {
  const H = 0.016;
  const W = 0.013;
  const D = 0.009;
  const root = new THREE.Group();
  root.name = `tissue-${recipe.id}`;
  const rnd = mulberry32(recipe.id === "m1" ? 11 : recipe.id === "v1" ? 29 : recipe.id === "cb" ? 47 : 71);
  const layers: THREE.Group[] = [];
  const axonMat = new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.45, metalness: 0.02 });
  applyRepeating(axonMat, "white_matter", 0.00005, 3);
  const capMat = new THREE.MeshStandardMaterial({
    color: "#a33b3e",
    roughness: 0.35,
    metalness: 0.05,
    emissive: "#5a1618",
    emissiveIntensity: 0.35,
  });
  applyRepeating(capMat, "arteries", 0.00004, 4);
  const veinMat = new THREE.MeshStandardMaterial({
    color: "#5c4d78",
    roughness: 0.4,
    emissive: "#24182e",
    emissiveIntensity: 0.2,
  });
  applyRepeating(veinMat, "veins_sinuses", 0.00004, 3);

  recipe.strata.forEach((stratum, index) => {
    const layer = new THREE.Group();
    layer.name = stratum.name;
    layer.userData.stratum = stratum.name;
    const height = Math.max(0.0004, (stratum.to - stratum.from) * H);
    const mid = ((stratum.from + stratum.to) / 2) * H;
    const slabMat = new THREE.MeshStandardMaterial({
      color: stratum.tint,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      roughness: 0.6,
    });
    applyRepeating(slabMat, "ecm", 0.00025, 2);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W, height, D), slabMat);
    slab.position.y = mid;
    slab.renderOrder = 1;
    layer.add(slab);

    if (stratum.cells !== "none" && stratum.count > 0) {
      const somaMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45 });
      const coneMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 });
      applyRepeating(somaMat, "cell", 0.00012, 2);
      applyRepeating(coneMat, "cell", 0.00008, 2);
      const soma = new THREE.InstancedMesh(UNIT.soma, somaMat, stratum.count);
      const cones = new THREE.InstancedMesh(UNIT.cone, coneMat, stratum.count);
      const dummy = new THREE.Object3D();
      const somaColor = new THREE.Color(
        stratum.cells === "granule" ? "#d7c094" : stratum.cells === "glia" ? "#ddd0c2" : stratum.cells === "purkinje" ? "#a86a5c" : "#c48b80",
      );
      const dendColor = somaColor.clone().offsetHSL(0, -0.05, 0.06);
      for (let i = 0; i < stratum.count; i++) {
        const betz = stratum.cells === "betz" && i % 3 === 0;
        const size = cellScale(stratum.cells, betz);
        let x = 0;
        let z = 0;
        let y = mid;
        if (stratum.cells === "purkinje") {
          x = (i - (stratum.count - 1) / 2) * W * 0.11;
          z = (rnd() - 0.5) * D * 0.08;
          y = mid;
        } else {
          const ang = (i + 1) * 2.399;
          const rad = (0.12 + (i % 4) * 0.16) * Math.min(W, D) * 0.42;
          x = Math.cos(ang) * rad;
          z = Math.sin(ang) * rad * 0.72;
          y = H * (stratum.from + (stratum.to - stratum.from) * (0.28 + rnd() * 0.5));
        }
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, stratum.cells === "fusiform" ? Math.PI / 2 : 0);
        dummy.scale.setScalar(size.soma);
        dummy.updateMatrix();
        soma.setMatrixAt(i, dummy.matrix);
        soma.setColorAt(i, betz ? new THREE.Color("#8e3e38") : somaColor);
        if (size.cone > 0) {
          dummy.position.set(x, y + (stratum.cells === "fusiform" ? 0 : size.coneH * 0.55), z);
          dummy.rotation.set(0, rnd() * 0.4, stratum.cells === "fusiform" ? Math.PI / 2 : (rnd() - 0.5) * 0.25);
          dummy.scale.set(size.cone, size.coneH, size.cone);
          dummy.updateMatrix();
          cones.setMatrixAt(i, dummy.matrix);
          cones.setColorAt(i, dendColor);
        } else {
          dummy.scale.setScalar(0.00001);
          dummy.updateMatrix();
          cones.setMatrixAt(i, dummy.matrix);
          cones.setColorAt(i, dendColor);
        }
      }
      soma.instanceMatrix.needsUpdate = true;
      cones.instanceMatrix.needsUpdate = true;
      if (soma.instanceColor) soma.instanceColor.needsUpdate = true;
      if (cones.instanceColor) cones.instanceColor.needsUpdate = true;
      layer.add(soma, cones);
    }
    if (index === recipe.strata.length - 1) {
      for (let i = 0; i < 8; i++) {
        const h = H * 0.22;
        const axon = new THREE.Mesh(new THREE.CylinderGeometry(0.00008, 0.00008, h, 5), axonMat);
        axon.position.set((i - 3.5) * W * 0.09, h * 0.5, ((i % 3) - 1) * D * 0.12);
        layer.add(axon);
      }
    }
    root.add(layer);
    layers.push(layer);
  });

  const ecmMat = new THREE.MeshStandardMaterial({
    color: "#f6f1ea",
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    roughness: 0.9,
  });
  applyRepeating(ecmMat, "ecm", 0.0002, 3);
  const ecm = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, H, D * 1.02), ecmMat);
  ecm.position.y = H / 2;
  ecm.renderOrder = 0;
  root.add(ecm);

  const wire = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, D),
    new THREE.MeshBasicMaterial({ color: "#3cbfa3", wireframe: true, transparent: true, opacity: 0.16 }),
  );
  wire.position.y = H / 2;
  root.add(wire);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(Math.min(W, D) * 0.62, Math.min(W, D) * 0.035, 8, 28),
    new THREE.MeshBasicMaterial({ color: "#3cbfa3" }),
  );
  ring.rotation.x = Math.PI / 2;
  root.add(ring);

  for (let i = 0; i < 4; i++) {
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 6; s++) {
      pts.push(
        new THREE.Vector3((rnd() - 0.5) * W * 0.7, (s / 6) * H, (rnd() - 0.5) * D * 0.7),
      );
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, i === 3 ? W * 0.012 : W * 0.016, 5, false),
      i === 3 ? veinMat : capMat,
    );
    root.add(tube);
  }

  root.userData.layers = layers;
  root.userData.tissue = true;
  root.userData.sample = recipe.id;
  root.traverse((obj) => {
    obj.userData.tissue = true;
    obj.userData.sample = recipe.id;
  });
  return root;
}

function disposeObject(root: THREE.Object3D) {
  const shared = new Set<THREE.BufferGeometry>([UNIT.soma, UNIT.cone, UNIT.glia]);
  const seen = new Set<THREE.Material>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.geometry && !shared.has(mesh.geometry)) mesh.geometry.dispose();
    const mat = mesh.material;
    const list = Array.isArray(mat) ? mat : [mat];
    for (const material of list) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      material.dispose();
    }
  });
}

function TissueMount({ anchor, recipe, scale }: { anchor: Anchor; recipe: Recipe; scale: number }) {
  const ref = useRef<THREE.Group | null>(null);
  useEffect(() => {
    const group = buildTissue(recipe);
    group.position.copy(anchor.localPoint);
    const normal = anchor.normal.clone();
    if (normal.lengthSq() < 1e-8) normal.copy(Y_UP);
    group.quaternion.setFromUnitVectors(Y_UP, normal.normalize());
    group.scale.setScalar(scale);
    anchor.mesh.add(group);
    ref.current = group;
    return () => {
      anchor.mesh.remove(group);
      disposeObject(group);
      ref.current = null;
    };
  }, [anchor, recipe, scale]);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const d = Math.min(delta, 0.05);
    const state = useLab.getState();
    const show = state.tissue && state.sample === recipe.id;
    const target = show ? 1 : 0;
    const current = group.userData.fade ?? (show ? 1 : 0);
    const fade = THREE.MathUtils.damp(current as number, target, 6, d);
    group.userData.fade = fade;
    group.visible = fade > 0.02;
    const layers = group.userData.layers as THREE.Group[];
    layers.forEach((layer, index) => {
      const name = layer.userData.stratum as string;
      layer.visible = state.strataOn[name] !== false;
      const spread = (index - (layers.length - 1) / 2) * state.explode * 0.0045 * scale;
      layer.position.y = THREE.MathUtils.damp(layer.position.y, spread, 6, d);
    });
  });
  return null;
}

function MeasureReadout({ unitToMm }: { unitToMm: number }) {
  const pts = useLab((s) => s.measure);
  const thick = 0.8 / unitToMm;
  const a = pts[0];
  const b = pts[1];
  const geo = useMemo(() => {
    if (!a || !b) return null;
    const av = new THREE.Vector3(...a);
    const bv = new THREE.Vector3(...b);
    const len = av.distanceTo(bv);
    const mid = av.clone().add(bv).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(Y_UP, bv.clone().sub(av).normalize());
    return { len, mid, q, av, bv };
  }, [a, b]);
  if (!geo) {
    return a ? (
      <mesh position={a}>
        <sphereGeometry args={[thick * 2.2, 12, 10]} />
        <meshBasicMaterial color="#3cbfa3" />
      </mesh>
    ) : null;
  }
  const mm = geo.len * unitToMm;
  return (
    <group>
      <mesh position={geo.mid} quaternion={geo.q}>
        <cylinderGeometry args={[thick, thick, Math.max(geo.len, thick), 8]} />
        <meshBasicMaterial color="#3cbfa3" />
      </mesh>
      <mesh position={geo.av}>
        <sphereGeometry args={[thick * 2.2, 12, 10]} />
        <meshBasicMaterial color="#3cbfa3" />
      </mesh>
      <mesh position={geo.bv}>
        <sphereGeometry args={[thick * 2.2, 12, 10]} />
        <meshBasicMaterial color="#3cbfa3" />
      </mesh>
      <Html position={geo.mid} center style={{ pointerEvents: "none" }} zIndexRange={[4, 0]}>
        <span className="rounded-md bg-bg/85 px-2 py-1 font-mono text-xs text-primary tabular-nums">
          {mm.toFixed(1)} mm
        </span>
      </Html>
    </group>
  );
}

function visualTarget(rec: Rec, frame: Frame, explode: number, retract: number, excised: string[], out: THREE.Vector3) {
  if (excised.includes(rec.key)) {
    const index = excised.indexOf(rec.key);
    const col = (index % 3) - 1;
    const row = Math.floor(index / 3) - 1;
    return out.set(
      frame.tray.x + col * frame.maxDim * 0.28,
      frame.tray.y + rec.radius * 0.15,
      frame.tray.z + row * frame.maxDim * 0.26,
    );
  }
  const e = explode;
  const md = frame.maxDim;
  out.copy(rec.restCenter);

  switch (rec.cat) {
    case "dura":
    case "meninges_dura":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.55);
      out.addScaledVector(frame.superior, e * md * 0.42 + retract * md * 0.22);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.28);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.28);
      break;
    case "arachnoid":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.38);
      out.addScaledVector(frame.superior, e * md * 0.26 + retract * md * 0.12);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.18);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.18);
      break;
    case "cortex":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.48);
      out.addScaledVector(frame.superior, e * md * 0.18);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.32);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.32);
      out.addScaledVector(frame.anterior, e * md * 0.06 * (rec.restCenter.dot(frame.anterior) > 0 ? 1 : -0.4));
      break;
    case "white_matter":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.22);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.14);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.14);
      break;
    case "tracts":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.36);
      out.addScaledVector(frame.superior, e * md * 0.08);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.2);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.2);
      break;
    case "deep_grey":
    case "diencephalon":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.12);
      out.addScaledVector(frame.superior, e * md * 0.04);
      break;
    case "ventricles":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.08);
      out.addScaledVector(frame.superior, e * md * 0.03);
      break;
    case "brainstem":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.28);
      out.addScaledVector(frame.superior, -e * md * 0.12);
      out.addScaledVector(frame.anterior, -e * md * 0.08);
      break;
    case "spinal_cord":
      out.addScaledVector(frame.superior, -e * md * 0.42);
      out.addScaledVector(frame.anterior, -e * md * 0.06);
      break;
    case "cerebellum":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.42);
      out.addScaledVector(frame.superior, -e * md * 0.16);
      out.addScaledVector(frame.anterior, -e * md * 0.18);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.22);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.22);
      break;
    case "arteries":
    case "veins_sinuses":
    case "cranial_nerves":
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.5);
      out.addScaledVector(frame.superior, e * md * 0.14);
      if (rec.side === "left") out.addScaledVector(frame.right, -e * md * 0.24);
      if (rec.side === "right") out.addScaledVector(frame.right, e * md * 0.24);
      break;
    default:
      out.addScaledVector(rec.dir, e * rec.weight * md * 0.3);
  }

  const parsed = Number.parseInt(rec.key.slice(-4), 16);
  const jitter = (Number.isFinite(parsed) ? parsed % 100 : rec.key.length * 17) / 100 - 0.5;
  out.addScaledVector(rec.dir, e * md * 0.015 * jitter);
  out.addScaledVector(frame.right, e * md * 0.01 * jitter);

  return out;
}

function smoothstep01(e0: number, e1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildSpinalCord(
  origin: THREE.Vector3,
  inferior: THREE.Vector3,
  anterior: THREE.Vector3,
  right: THREE.Vector3,
  unitToMm: number,
  startMm: number,
) {
  const mm = (n: number) => n / unitToMm;
  const length = mm(420);
  const rings = 96;
  const segs = 48;
  const centerAt = (t: number) => {
    const sag = Math.sin(t * Math.PI) * mm(t < 0.42 ? 12 : -8);
    const lat = Math.sin(t * Math.PI * 2) * mm(2.2);
    return origin
      .clone()
      .addScaledVector(inferior, t * length)
      .addScaledVector(anterior, sag)
      .addScaledVector(right, lat);
  };
  const frameAt = (t: number) => {
    const p = centerAt(t);
    const tangent = centerAt(Math.min(1, t + 0.008)).sub(p);
    if (tangent.lengthSq() < 1e-12) tangent.copy(inferior);
    tangent.normalize();
    const r = right.clone().addScaledVector(tangent, -right.dot(tangent));
    if (r.lengthSq() < 1e-10) r.copy(right);
    r.normalize();
    const a = new THREE.Vector3().crossVectors(r, tangent);
    if (a.dot(anterior) < 0) {
      a.negate();
      r.negate();
    }
    a.normalize();
    return { p, tangent, right: r, anterior: a };
  };
  const radii = (t: number) => {
    const cerv = Math.exp(-(((t - 0.13) / 0.1) ** 2));
    const lumb = Math.exp(-(((t - 0.74) / 0.065) ** 2));
    const conus = smoothstep01(0.82, 1, t);
    let trans = 4.7 + cerv * 1.9 + lumb * 1.45;
    let ap = trans * 0.76;
    const taper = 1 - conus * 0.9;
    trans *= taper;
    ap *= taper;
    const join = smoothstep01(0, 0.05, t);
    return {
      trans: mm(THREE.MathUtils.lerp(startMm, trans, join)),
      ap: mm(THREE.MathUtils.lerp(startMm * 0.84, ap, join)),
    };
  };
  const groove = (ang: number) => {
    const fromAnt = Math.min(ang, Math.PI * 2 - ang);
    const fissure = Math.exp(-((fromAnt / 0.2) ** 2));
    const fromPost = Math.abs(ang - Math.PI);
    const sulcus = Math.exp(-((fromPost / 0.18) ** 2));
    const dent = Math.exp(-((Math.abs(fromPost - 0.7) / 0.12) ** 2));
    return 1 - fissure * 0.3 - sulcus * 0.11 - dent * 0.045;
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const fr = frameAt(t);
    const rad = radii(t);
    for (let j = 0; j <= segs; j++) {
      const ang = (j / segs) * Math.PI * 2;
      const g = groove(ang);
      const p = fr.p
        .clone()
        .addScaledVector(fr.right, Math.sin(ang) * rad.trans * g)
        .addScaledVector(fr.anterior, Math.cos(ang) * rad.ap * g);
      positions.push(p.x, p.y, p.z);
      uvs.push(j / segs, 1 - t);
    }
  }
  const row = segs + 1;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * row + j;
      const b = a + row;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const cordGeo = new THREE.BufferGeometry();
  cordGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  cordGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  cordGeo.setIndex(indices);
  cordGeo.computeVertexNormals();

  const rp: number[] = [];
  const ri: number[] = [];
  const addStrand = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, radius: number) => {
    const steps = 6;
    const sides = 5;
    const base = rp.length / 3;
    const bez = (t: number) => {
      const u = 1 - t;
      return a
        .clone()
        .multiplyScalar(u * u)
        .add(b.clone().multiplyScalar(2 * u * t))
        .add(c.clone().multiplyScalar(t * t));
    };
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = bez(t);
      const tan = bez(Math.min(1, t + 0.08)).sub(p);
      if (tan.lengthSq() < 1e-12) tan.copy(inferior);
      tan.normalize();
      const ref = Math.abs(tan.dot(right)) > 0.85 ? anterior : right;
      const n1 = new THREE.Vector3().crossVectors(tan, ref).normalize();
      const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
      const rad = radius * (1 - t * 0.4);
      for (let j = 0; j <= sides; j++) {
        const ang = (j / sides) * Math.PI * 2;
        const q = p.clone().addScaledVector(n1, Math.cos(ang) * rad).addScaledVector(n2, Math.sin(ang) * rad);
        rp.push(q.x, q.y, q.z);
      }
    }
    const stride = sides + 1;
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < sides; j++) {
        const s0 = base + i * stride + j;
        const s1 = s0 + stride;
        ri.push(s0, s0 + 1, s1, s0 + 1, s1 + 1, s1);
      }
    }
  };

  for (let s = 0; s < 28; s++) {
    const t = 0.04 + (s / 27) * 0.9;
    const fr = frameAt(t);
    const rad = radii(t);
    for (const side of [-1, 1]) {
      for (const dorsal of [0, 1]) {
        const ang = side * (dorsal ? 2.2 : 0.72);
        const start = fr.p
          .clone()
          .addScaledVector(fr.right, Math.sin(ang) * rad.trans * 0.96)
          .addScaledVector(fr.anterior, Math.cos(ang) * rad.ap * 0.96);
        const travel = mm(9 + t * 36);
        const dir = fr.right
          .clone()
          .multiplyScalar(side * 0.7)
          .addScaledVector(fr.tangent, 0.28 + t * 1.4)
          .addScaledVector(fr.anterior, dorsal ? -0.25 : 0.4)
          .normalize();
        const mid = start.clone().addScaledVector(dir, travel * 0.45);
        const end = start.clone().addScaledVector(dir, travel);
        addStrand(start, mid, end, mm(dorsal ? 0.42 : 0.36));
      }
    }
  }
  const tip = frameAt(0.97);
  for (let i = 0; i < 18; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const start = tip.p.clone().addScaledVector(tip.right, side * mm(0.8 + (i % 4) * 0.35));
    const end = tip.p
      .clone()
      .addScaledVector(inferior, mm(78 + (i % 6) * 16))
      .addScaledVector(right, side * mm(3.5 + (i % 5) * 1.4))
      .addScaledVector(anterior, mm(((i % 5) - 2) * 1.5));
    const mid = start.clone().lerp(end, 0.42).addScaledVector(right, side * mm(1.6));
    addStrand(start, mid, end, mm(0.34));
  }
  const rootGeo = new THREE.BufferGeometry();
  rootGeo.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3));
  rootGeo.setIndex(ri);
  rootGeo.computeVertexNormals();
  return { cordGeo, rootGeo };
}

type Controls = {
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

function principalAxis(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
  if (size.y >= size.x && size.y >= size.z) return new THREE.Vector3(0, 1, 0);
  if (size.z >= size.x && size.z >= size.y) return new THREE.Vector3(0, 0, 1);
  return new THREE.Vector3(1, 0, 0);
}

const CAP_CATS = new Set<CatId>(["cortex", "cerebellum", "brainstem", "spinal_cord", "white_matter", "tracts", "deep_grey", "diencephalon"]);

function addSectionCaps(records: Rec[], scene: THREE.Scene, radius: number) {
  const backMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    clippingPlanes: CLIP_ON,
    depthWrite: false,
    depthTest: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.IncrementWrapStencilOp,
    stencilZFail: THREE.IncrementWrapStencilOp,
    stencilZPass: THREE.IncrementWrapStencilOp,
  });
  const frontMat = new THREE.MeshBasicMaterial({
    side: THREE.FrontSide,
    clippingPlanes: CLIP_ON,
    depthWrite: false,
    depthTest: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.DecrementWrapStencilOp,
    stencilZFail: THREE.DecrementWrapStencilOp,
    stencilZPass: THREE.DecrementWrapStencilOp,
  });
  const skip = () => {};
  for (const rec of records) {
    if (!CAP_CATS.has(rec.cat)) continue;
    const back = new THREE.Mesh(rec.mesh.geometry, backMat);
    const front = new THREE.Mesh(rec.mesh.geometry, frontMat);
    back.renderOrder = 1;
    front.renderOrder = 1;
    back.visible = false;
    front.visible = false;
    back.raycast = skip;
    front.raycast = skip;
    rec.mesh.add(back, front);
    rec.mesh.userData.caps = [back, front];
    rec.mesh.renderOrder = 3;
  }
  const capMat = new THREE.MeshStandardMaterial({
    color: "#b7c3c1",
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });
  applyRepeating(capMat, "white_matter", radius * 0.004, 5);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(radius * 2.4, 72), capMat);
  cap.name = "section-cap";
  cap.renderOrder = 2;
  cap.visible = false;
  cap.raycast = skip;
  scene.add(cap);
  return cap;
}

function Specimen() {
  const { camera, gl, scene } = useThree();
  const liveControls = useThree((s) => s.controls) as Controls | null;
  const controlsRef = useRef<Controls | null>(null);
  controlsRef.current = liveControls;
  const worldRef = useRef<Frame | null>(null);
  const [booted, setBooted] = useState(false);
  const [unit, setUnit] = useState(1000);
  const fly = useRef<{ cam: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const nonce = useRef(-1);
  const opticsTick = useRef(0);
  const modeRef = useRef<"specimen" | "parcellation">("specimen");
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const transRef = useRef<THREE.PointLight>(null);
  const rig = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Mesh | null>(null);
  const qualityRef = useRef(useLab.getState().quality);
  const _z = useRef(new THREE.Vector3(0, 0, 1)).current;
  const _q = useRef(new THREE.Quaternion()).current;

  useEffect(() => {
    const controls = controlsRef.current;
    const stop = () => {
      fly.current = null;
    };
    controls?.addEventListener("start", stop);
    return () => controls?.removeEventListener("start", stop);
  }, [booted]);

  useEffect(() => {
    let dead = false;
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const store = useLab.getState();
    store.setProgress(0.04, "Reading the atlas");

    loader.load(
      "/models/brain.glb",
      (gltf) => {
        if (dead) return;
        void (async () => {
          try {
            store.setProgress(0.88, "Fitting meninges and axes");
            const manifest = (await fetch("/models/manifest.json").then((r) => r.json())) as {
              nodes: { id: number; ta2?: string[] }[];
            };
            if (dead) return;
            const ta2ById = new Map<number, string>();
            for (const node of manifest.nodes) {
              const path = (node.ta2 ?? []).filter((part) => !JUNK.has(part));
              ta2ById.set(node.id, path.slice(-5).join(" › "));
            }
            const meshes: THREE.Mesh[] = [];
            gltf.scene.traverse((obj) => {
              const mesh = obj as THREE.Mesh;
              if (mesh.isMesh) meshes.push(mesh);
            });
            orientAndBake(gltf.scene, meshes);

            const records: Rec[] = [];
            const directory: Meta[] = [];
            let parcelIndex = 0;
            for (const mesh of meshes) {
              const data = mesh.userData as {
                bx_id?: number;
                bx_cat?: string;
                bx_label?: string;
                bx_side?: string;
                bx_region?: string;
              };
              const cat = asCat(data.bx_cat);
              if (!cat) continue;
              const label = data.bx_label || mesh.name || "Structure";
              const side = asSide(data.bx_side);
              const region = data.bx_region || CAT_BY_ID[cat].group;
              const ta2 = data.bx_id != null ? (ta2ById.get(data.bx_id) ?? "") : "";
              const id = data.bx_id ?? parcelIndex;
              const specimen = varyColor(CAT_BY_ID[cat].color, id);
              const parcel = parcelColor(cat, parcelIndex++);
              const mat = makeMaterial(cat, specimen, id);
              mat.userData.fiber = principalAxis(mesh);
              if (CAP_CATS.has(cat)) mesh.castShadow = true;
              const previous = mesh.material;
              mesh.material = mat;
              if (Array.isArray(previous)) previous.forEach((m) => m.dispose());
              else previous?.dispose?.();
              mesh.userData.key = mesh.uuid;
              const restCenter = meshCenter(mesh);
              const rec: Rec = {
                key: mesh.uuid,
                mesh,
                mat,
                cat,
                side,
                label,
                region,
                hay: `${label} ${region} ${cat} ${ta2}`.toLowerCase(),
                restCenter,
                restPosition: mesh.position.clone(),
                dir: new THREE.Vector3(),
                radius: meshRadius(mesh),
                weight: CAT_BY_ID[cat].explode,
                glassy: cat === "dura" || cat === "arachnoid" || cat === "ventricles",
                specimen,
                parcel,
                placed: false,
              };
              records.push(rec);
              directory.push({
                key: mesh.uuid,
                label,
                side,
                region,
                cat,
                ta2,
                blurb: pearlFor(label, cat),
              });
            }

            const hero = records.filter((r) => r.cat === "cortex" || r.cat === "cerebellum" || r.cat === "brainstem");
            const box = new THREE.Box3();
            for (const rec of hero) {
              if (!rec.mesh.geometry.boundingBox) rec.mesh.geometry.computeBoundingBox();
              box.union(rec.mesh.geometry.boundingBox!);
            }
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const span = size.length();
            const unitToMm = maxDim < 2 ? 1000 : maxDim > 50 ? 1 : 10;

            const mean = (cat: CatId, side: Side) => {
              const acc = new THREE.Vector3();
              let n = 0;
              for (const rec of records) {
                if (rec.cat === cat && rec.side === side) {
                  acc.add(rec.restCenter);
                  n++;
                }
              }
              return n ? acc.multiplyScalar(1 / n) : null;
            };
            const left = mean("cortex", "left");
            const right = mean("cortex", "right");
            const pre = records.find((r) => r.label === "Precentral gyrus" && r.side === "left");
            const cuneus = records.find((r) => r.label === "Cuneus" && r.side === "left");
            const medulla = records.find((r) => r.label === "Medulla oblongata");
            const superior = new THREE.Vector3(0, 1, 0);
            if (pre && medulla && pre.restCenter.y < medulla.restCenter.y) superior.set(0, -1, 0);
            const lr = new THREE.Vector3(1, 0, 0);
            if (left && right) lr.copy(right).sub(left);
            lr.addScaledVector(superior, -lr.dot(superior));
            if (lr.lengthSq() < 1e-8) lr.set(1, 0, 0);
            lr.normalize();
            let anterior = new THREE.Vector3().crossVectors(superior, lr).normalize();
            if (pre && cuneus && anterior.dot(pre.restCenter.clone().sub(cuneus.restCenter)) < 0) anterior.negate();
            const rightAxis = new THREE.Vector3().crossVectors(anterior, superior).normalize();
            if (right && rightAxis.dot(right.clone().sub(center)) < 0) rightAxis.negate();

            for (const rec of records) {
              rec.dir.copy(rec.restCenter).sub(center);
              if (rec.dir.lengthSq() < (maxDim * 0.03) ** 2) rec.dir.copy(superior);
              else rec.dir.normalize();
            }

            const hullPoints = collectPoints(
              hero.map((r) => r.mesh),
              70000,
            );
            const envelopes: { cat: CatId; label: string; blurb: string; scale: number; smooth: number }[] = [
              {
                cat: "dura",
                label: "Dura mater",
                blurb: CAT_BY_ID.dura.blurb,
                scale: 1.045,
                smooth: 4,
              },
              {
                cat: "arachnoid",
                label: "Arachnoid mater",
                blurb: CAT_BY_ID.arachnoid.blurb,
                scale: 1.012,
                smooth: 1,
              },
            ];
            for (const env of envelopes) {
              const geo = buildHull(hullPoints, center, env.scale, env.smooth);
              const specimen = new THREE.Color(CAT_BY_ID[env.cat].color);
              const mat = makeMaterial(env.cat, specimen, env.cat === "dura" ? 2 : 5);
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.copy(center);
              const key = `env:${env.cat}`;
              mesh.userData.key = key;
              gltf.scene.add(mesh);
              const rec: Rec = {
                key,
                mesh,
                mat,
                cat: env.cat,
                side: "median",
                label: env.label,
                region: "Meninges",
                hay: `${env.label} meninges dura arachnoid`.toLowerCase(),
                restCenter: center.clone(),
                restPosition: center.clone(),
                dir: superior.clone(),
                radius: maxDim * 0.5,
                weight: CAT_BY_ID[env.cat].explode,
                glassy: true,
                specimen,
                parcel: specimen.clone(),
                placed: false,
              };
              records.push(rec);
              directory.push({
                key,
                label: env.label,
                side: "median",
                region: "Meninges",
                cat: env.cat,
                ta2: "Meninges",
                blurb: env.blurb,
              });
            }

            const medullas = records.filter((r) => r.label === "Medulla oblongata");
            if (medullas.length) {
              const inferior = superior.clone().negate();
              let minS = Infinity;
              const tmp = new THREE.Vector3();
              for (const rec of medullas) {
                const pos = rec.mesh.geometry.getAttribute("position");
                for (let i = 0; i < pos.count; i++) {
                  tmp.fromBufferAttribute(pos, i);
                  const s = tmp.dot(superior);
                  if (s < minS) minS = s;
                }
              }
              const band = 8 / unitToMm;
              const caudal: THREE.Vector3[] = [];
              for (const rec of medullas) {
                const pos = rec.mesh.geometry.getAttribute("position");
                for (let i = 0; i < pos.count; i++) {
                  tmp.fromBufferAttribute(pos, i);
                  if (tmp.dot(superior) <= minS + band) caudal.push(tmp.clone());
                }
              }
              if (caudal.length) {
                const acc = new THREE.Vector3();
                for (const p of caudal) acc.add(p);
                acc.multiplyScalar(1 / caudal.length);
                let radial = 0;
                for (const p of caudal) {
                  const d = p.clone().sub(acc);
                  d.addScaledVector(superior, -d.dot(superior));
                  radial += d.length();
                }
                const startMm = THREE.MathUtils.clamp((radial / caudal.length) * unitToMm * 0.78, 4.2, 8.2);
                const origin = acc.clone().addScaledVector(superior, 2.5 / unitToMm);
                const built = buildSpinalCord(origin, inferior, anterior, rightAxis, unitToMm, startMm);
                const cordColor = new THREE.Color(CAT_BY_ID.spinal_cord.color);
                const cordMat = makeMaterial("spinal_cord", cordColor, 11);
                cordMat.bumpScale = 1.15 / unitToMm;
                const rootMat = makeMaterial("cranial_nerves", new THREE.Color("#efe0c4"), 19);
                const parts: [THREE.BufferGeometry, THREE.Material, string, string, string][] = [
                  [built.cordGeo, cordMat, "cord:spinal", "Spinal cord", CAT_BY_ID.spinal_cord.blurb],
                  [
                    built.rootGeo,
                    rootMat,
                    "cord:roots",
                    "Rootlets & cauda equina",
                    "Ventral and dorsal rootlets leave the cord and, below the conus, continue as the cauda equina.",
                  ],
                ];
                for (const [geo, mat, key, label, blurb] of parts) {
                  const mesh = new THREE.Mesh(geo, mat);
                  mesh.userData.key = key;
                  if (key === "cord:spinal") mesh.castShadow = true;
                  gltf.scene.add(mesh);
                  const restCenter = meshCenter(mesh);
                  const specimen = (mat as THREE.MeshStandardMaterial).color.clone();
                  records.push({
                    key,
                    mesh,
                    mat: mat as THREE.MeshStandardMaterial,
                    cat: "spinal_cord",
                    side: "median",
                    label,
                    region: "Spinal cord",
                    hay: `${label} spinal cord conus cauda equina cervical lumbar rootlets`.toLowerCase(),
                    restCenter,
                    restPosition: mesh.position.clone(),
                    dir: inferior.clone(),
                    radius: meshRadius(mesh),
                    weight: CAT_BY_ID.spinal_cord.explode,
                    glassy: false,
                    specimen,
                    parcel: parcelColor("spinal_cord", label.length),
                    placed: false,
                  });
                  directory.push({
                    key,
                    label,
                    side: "median",
                    region: "Spinal cord",
                    cat: "spinal_cord",
                    ta2: "Spinal cord",
                    blurb,
                  });
                }
              }
            }

            const anchors: Frame["anchors"] = {};
            for (const recipe of RECIPES) {
              let rec = records.find((r) => r.label === recipe.want.label && r.side === recipe.want.side);
              if (!rec && recipe.fallbackCat) {
                rec =
                  records.find((r) => r.cat === recipe.fallbackCat && r.side === "left" && /semilunar/i.test(r.label)) ??
                  records.find((r) => r.cat === recipe.fallbackCat && r.side === "left");
              }
              if (!rec) continue;
              const hit = recipe.internal
                ? {
                    point: rec.restCenter.clone().addScaledVector(rightAxis, -rec.radius * 0.2),
                    normal: rightAxis.clone().multiplyScalar(rec.side === "left" ? -1 : 1),
                  }
                : outerHit(rec.mesh, center, span);
              anchors[recipe.id] = { mesh: rec.mesh, localPoint: hit.point, normal: hit.normal };
              directory.push({
                key: `tissue:${recipe.id}`,
                label: recipe.title,
                side: "left",
                region: "Tissue window",
                cat: rec.cat,
                ta2: "Schematic column",
                blurb: `${recipe.note} The column is enlarged relative to the 2–4 mm cortical ribbon so each layer stays legible, and cell packing is thinned so individual classes can be told apart. Neurons, glia, myelinated axons, capillaries, and a pale extracellular matrix stay in anatomical order on this gyrus.`,
              });
            }

            const pia: Meta = {
              key: "pia",
              label: "Pia mater",
              side: "median",
              region: "Meninges",
              cat: "cortex",
              ta2: "Meninges",
              blurb:
                "Pia is the glistening film adherent to the cortical surface. It follows every gyrus and sulcus, so it is shown as the wet sheen on the cortex rather than a second shell. Turn it off to dull that film.",
            };
            directory.push(pia);

            const dist = maxDim * 3.7;
            const homeCam = center
              .clone()
              .addScaledVector(anterior, dist * 0.92)
              .addScaledVector(rightAxis, dist * 0.48)
              .addScaledVector(superior, dist * 0.36);
            const homeTarget = center.clone().addScaledVector(superior, -maxDim * 0.12);
            camera.position.copy(homeCam);
            camera.near = maxDim * 0.0015;
            camera.far = maxDim * 40;
            camera.lookAt(homeTarget);
            camera.updateProjectionMatrix();
            const controls = controlsRef.current;
            if (controls) {
              controls.target.copy(homeTarget);
              controls.minDistance = maxDim * 0.03;
              controls.maxDistance = maxDim * 18;
              controls.update();
            }

            const floorY = box.min.y - maxDim * 0.045;
            const room = new THREE.Group();
            const barLen = 20 / unitToMm;
            const bar = new THREE.Mesh(
              new THREE.BoxGeometry(barLen, maxDim * 0.008, maxDim * 0.008),
              new THREE.MeshStandardMaterial({ color: "#d5e4df", metalness: 0.2, roughness: 0.4 }),
            );
            bar.position.set(center.x, floorY + maxDim * 0.03, center.z + maxDim * 0.72);
            const barTag = tagSprite("20 mm", "#d7eeea");
            barTag.position.set(center.x + barLen * 0.9, floorY + maxDim * 0.08, center.z + maxDim * 0.72);
            barTag.scale.set(maxDim * 0.16, maxDim * 0.08, 1);
            bar.receiveShadow = true;
            room.add(bar, barTag);
            const dishMat = new THREE.MeshStandardMaterial({ color: "#1c2426", roughness: 0.62, metalness: 0.28 });
            const dish = new THREE.Mesh(new THREE.RingGeometry(maxDim * 0.16, maxDim * 1.28, 64), dishMat);
            dish.rotation.x = -Math.PI / 2;
            dish.position.set(center.x, floorY, center.z);
            dish.receiveShadow = true;
            const lip = new THREE.Mesh(new THREE.TorusGeometry(maxDim * 1.26, maxDim * 0.011, 8, 64), dishMat);
            lip.rotation.x = Math.PI / 2;
            lip.position.set(center.x, floorY, center.z);
            lip.receiveShadow = true;
            const ao = new THREE.Mesh(
              new THREE.RingGeometry(maxDim * 0.2, maxDim * 0.92, 48),
              new THREE.MeshStandardMaterial({ color: "#050708", roughness: 1, transparent: true, opacity: 0.42, depthWrite: false }),
            );
            ao.rotation.x = -Math.PI / 2;
            ao.position.set(center.x, floorY + maxDim * 0.004, center.z);
            ao.receiveShadow = true;
            const ground = new THREE.Mesh(
              new THREE.CircleGeometry(maxDim * 1.35, 48),
              new THREE.ShadowMaterial({ opacity: 0.4, color: "#050708" }),
            );
            ground.rotation.x = -Math.PI / 2;
            ground.position.set(center.x, floorY + maxDim * 0.002, center.z);
            ground.receiveShadow = true;
            room.add(dish, lip, ao, ground);
            const trayOrigin = new THREE.Vector3(center.x + maxDim * 1.15, floorY, center.z);

            const leftMark = tagSprite("L", "#9eb0aa");
            const rightMark = tagSprite("R", "#9eb0aa");
            if (left) {
              leftMark.position.copy(left).addScaledVector(superior, maxDim * 0.16);
              leftMark.scale.setScalar(maxDim * 0.09);
              gltf.scene.add(leftMark);
            }
            if (right) {
              rightMark.position.copy(right).addScaledVector(superior, maxDim * 0.16);
              rightMark.scale.setScalar(maxDim * 0.09);
              gltf.scene.add(rightMark);
            }

            rig.current?.add(gltf.scene, room);

            const keyPos = center
              .clone()
              .addScaledVector(anterior, maxDim * 0.45)
              .addScaledVector(superior, maxDim * 2.45)
              .addScaledVector(rightAxis, -maxDim * 0.2);
            keyRef.current?.position.copy(keyPos);
            if (keyRef.current) {
              keyRef.current.castShadow = true;
              keyRef.current.shadow.mapSize.set(512, 512);
              keyRef.current.shadow.bias = -0.0004;
              keyRef.current.shadow.normalBias = maxDim * 0.02;
              const shadowCam = keyRef.current.shadow.camera as THREE.OrthographicCamera;
              const span = maxDim * 2.4;
              shadowCam.left = -span;
              shadowCam.right = span;
              shadowCam.top = span;
              shadowCam.bottom = -span;
              shadowCam.near = maxDim * 0.05;
              shadowCam.far = maxDim * 10;
              shadowCam.updateProjectionMatrix();
              scene.add(keyRef.current.target);
              keyRef.current.target.position.copy(center);
              keyRef.current.color.set("#e4eef8");
            }
            fillRef.current?.position.copy(center).addScaledVector(rightAxis, maxDim * 1.7).addScaledVector(superior, maxDim * 0.25);
            fillRef.current?.color.set("#ffc08a");
            rimRef.current?.position.copy(center).addScaledVector(anterior, -maxDim * 2.05).addScaledVector(superior, maxDim * 0.55);
            rimRef.current?.color.set("#c5d6ea");
            transRef.current?.position.copy(center).addScaledVector(superior, -maxDim * 1.15);

            const lamp = new THREE.Mesh(
              new THREE.TorusGeometry(maxDim * 0.16, maxDim * 0.012, 8, 28),
              new THREE.MeshStandardMaterial({
                color: "#b7c0c0",
                metalness: 0.8,
                roughness: 0.32,
                emissive: "#cfe8e0",
                emissiveIntensity: 0.18,
              }),
            );
            lamp.position.copy(keyPos);
            lamp.lookAt(center);
            room.add(lamp);

            const frame: Frame = {
              center,
              superior,
              anterior,
              right: rightAxis,
              span,
              maxDim,
              unitToMm,
              box,
              proj: {
                axial: projectBox(box, superior),
                coronal: projectBox(box, anterior),
                sagittal: projectBox(box, rightAxis),
              },
              homeCam,
              homeTarget,
              tray: trayOrigin.clone().add(new THREE.Vector3(0, maxDim * 0.12, 0)),
              records,
              anchors,
            };
            worldRef.current = frame;
            capRef.current = addSectionCaps(records, scene, maxDim);
            setUnit(unitToMm);
            setBooted(true);
            useLab.getState().publish(directory, { unitToMm, count: records.filter((r) => !r.key.startsWith("env:")).length });
          } catch (err) {
            useLab.getState().fail(err instanceof Error ? err.message : "The atlas could not be prepared.");
          }
        })();
      },
      (event) => {
        if (!event.total) return;
        useLab.getState().setProgress(Math.min(0.84, event.loaded / event.total), "Reading the atlas");
      },
      (err) => {
        const message = err instanceof Error ? err.message : "The atlas file did not load.";
        useLab.getState().fail(message);
      },
    );

    return () => {
      dead = true;
      draco.dispose();
    };
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (!down) return;
      const dx = event.clientX - down.x;
      const dy = event.clientY - down.y;
      down = null;
      if (dx * dx + dy * dy > 25) return;
      const rect = el.getBoundingClientRect();
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const root = rig.current;
      if (!root) return;
      const hits = ray.intersectObject(root, true);
      const state = useLab.getState();
      const hit = hits.find((item) => item.object.visible);
      if (state.measuring && hit) {
        const p = hit.point;
        state.pushMeasure([p.x, p.y, p.z]);
        return;
      }
      let key: string | null = null;
      let obj: THREE.Object3D | null = hit?.object ?? null;
      while (obj) {
        if (obj.userData.tissue && obj.userData.sample) {
          key = `tissue:${obj.userData.sample as string}`;
          break;
        }
        if (typeof obj.userData.key === "string") {
          key = obj.userData.key;
          break;
        }
        obj = obj.parent;
      }
      state.select(key);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const frame = worldRef.current;
    if (!frame) return;
    const d = Math.min(delta, 0.05);
    const state = useLab.getState();
    if (state.intentNonce !== nonce.current) {
      nonce.current = state.intentNonce;
      const intent = state.intent;
      if (intent?.type === "home") {
        fly.current = { cam: frame.homeCam.clone(), target: frame.homeTarget.clone() };
      } else if (intent?.type === "part") {
        const rec = frame.records.find((item) => item.key === intent.key);
        if (rec) {
          visualTarget(rec, frame, state.explode, state.retract, state.excised, _desired);
          const focus = _desired.clone();
          const dist = Math.max(rec.radius * 5.5, frame.maxDim * 0.42);
          _view.copy(camera.position).sub(focus);
          if (_view.lengthSq() < 1e-8) _view.copy(frame.anterior);
          _view.normalize();
          fly.current = { cam: focus.clone().addScaledVector(_view, dist), target: focus };
        }
      } else if (intent?.type === "sample") {
        const anchor = frame.anchors[state.sample];
        if (anchor) {
          const scale = frame.maxDim / 0.16;
          const focus = anchor.localPoint
            .clone()
            .add(anchor.mesh.position)
            .addScaledVector(anchor.normal, 0.016 * scale * 0.45);
          const tangent = new THREE.Vector3().crossVectors(anchor.normal, frame.superior);
          if (tangent.lengthSq() < 1e-6) tangent.crossVectors(anchor.normal, frame.right);
          tangent.normalize();
          const dist = (frame.maxDim * 0.26) / Math.max(1, state.mag);
          fly.current = {
            cam: focus.clone().addScaledVector(tangent, dist).addScaledVector(anchor.normal, dist * 0.38),
            target: focus,
          };
        }
      }
    }
    const controls = controlsRef.current;
    if (fly.current && controls) {
      const k = 1 - Math.exp(-3.4 * d);
      camera.position.lerp(fly.current.cam, k);
      controls.target.lerp(fly.current.target, k);
      if (camera.position.distanceTo(fly.current.cam) < frame.maxDim * 0.004) fly.current = null;
    }
    if (state.turntable && !state.sectionOn && !fly.current && rig.current) {
      rig.current.rotation.y += d * 0.12;
    }

    if (state.mode !== modeRef.current) modeRef.current = state.mode;
    const axis = state.axis === "axial" ? frame.superior : state.axis === "coronal" ? frame.anterior : frame.right;
    const range = frame.proj[state.axis];
    const keep = THREE.MathUtils.lerp(range.max, range.min, state.depth);
    CLIP.normal.copy(axis).negate();
    CLIP.constant = keep;
    const query = state.query.trim().toLowerCase();
    const pulsePhase = (state.hr > 0 ? (performance.now() / 1000) % (60 / state.hr) : 0) / (60 / Math.max(1, state.hr));
    const pulse = Math.pow(Math.max(0, Math.sin(pulsePhase * Math.PI)), 8);
    const viewDist = controls ? camera.position.distanceTo(controls.target) : frame.maxDim * 2;
    const close =
      state.quality === "high" ? THREE.MathUtils.smoothstep(frame.maxDim * 1.15, frame.maxDim * 0.38, viewDist) : 0;

    for (const rec of frame.records) {
      let op = state.visible[rec.cat] ? state.opacity[rec.cat] : 0;
      if (state.isolated === "selection") {
        if (state.selected !== rec.key) op *= 0.045;
      } else if (state.isolated && state.isolated !== rec.cat) {
        op *= 0.045;
      }
      if (query.length >= 2 && !rec.hay.includes(query)) op *= 0.04;
      if (state.side === "left" && rec.side === "right") op = 0;
      if (state.side === "right" && rec.side === "left") op = 0;
      if (state.hidden[rec.key]) op = 0;
      if (state.selected === rec.key) op = Math.max(op, state.visible[rec.cat] ? 0.92 : op);
      if (state.tissue && state.sample === "hip" && rec.label === "Hippocampus" && rec.side === "left") {
        op = Math.max(op, 1);
      }
      op = THREE.MathUtils.clamp(op, 0, 1);
      rec.mat.opacity = THREE.MathUtils.damp(rec.mat.opacity, op, 8, d);
      const glassy = rec.glassy || op < 0.985;
      if (rec.mat.transparent !== glassy) rec.mat.transparent = glassy;
      const write = !glassy && op > 0.55;
      if (rec.mat.depthWrite !== write) rec.mat.depthWrite = write;
      rec.mesh.visible = rec.mat.opacity > 0.015;
      const excised = state.excised.includes(rec.key);
      const planes = state.sectionOn && !excised ? CLIP_ON : NO_CLIP;
      if (rec.mat.clippingPlanes !== planes) rec.mat.clippingPlanes = planes;
      visualTarget(rec, frame, state.explode, state.retract, state.excised, _desired);
      _pos.copy(rec.restPosition).add(_desired).sub(rec.restCenter);
      if (!rec.placed) {
        rec.mesh.position.copy(_pos);
        rec.placed = true;
      } else if (rec.mesh.position.distanceToSquared(_pos) > 1e-10) {
        rec.mesh.position.lerp(_pos, 1 - Math.exp(-6 * d));
      }
      if (rec.key === "env:dura") rec.mesh.scale.setScalar(1 + state.retract * 0.1);
      else if (rec.key === "env:arachnoid") rec.mesh.scale.setScalar(1 + state.retract * 0.045);
      const caps = rec.mesh.userData.caps as THREE.Mesh[] | undefined;
      if (caps) {
        const showCap = state.sectionOn && state.quality !== "low" && rec.mesh.visible && !excised;
        if (caps[0].visible !== showCap) {
          caps[0].visible = showCap;
          caps[1].visible = showCap;
        }
      }
      const tri = rec.mat.userData.tri as
        | {
            uClose: { value: number };
            uScatter: { value: number };
            uPulse: { value: number };
            uAniso: { value: number };
            uDetail: { value: number };
            uDisplace: { value: number };
          }
        | undefined;
      if (tri) {
        const scatter0 = (rec.mat.userData.scatter as number) ?? 0;
        const aniso0 = (rec.mat.userData.aniso as number) ?? 0;
        tri.uDetail.value = state.quality === "low" ? 0 : 1;
        tri.uScatter.value = state.quality === "low" ? 0 : state.quality === "high" ? scatter0 : scatter0 * 0.55;
        tri.uAniso.value = state.quality === "high" ? aniso0 : state.quality === "medium" ? aniso0 * 0.4 : 0;
        tri.uClose.value = close;
        const mm = frame.unitToMm > 50 ? 0.001 : 1;
        const breath = Math.sin(performance.now() * 0.0013) * mm * 0.05;
        const meninge = rec.key === "env:dura" || rec.cat === "meninges_dura" ? 0.42 : rec.key === "env:arachnoid" ? 0.26 : 0;
        tri.uDisplace.value = state.quality === "low" ? 0 : mm * meninge + (meninge > 0 ? breath : 0);
        const vesselish = rec.cat === "arteries" || rec.cat === "veins_sinuses" || /choroid/i.test(rec.label);
        const amp = rec.cat === "arteries" ? 1 : /choroid/i.test(rec.label) ? 0.45 : rec.cat === "veins_sinuses" ? 0.55 : 0;
        const cap = mm * 0.22;
        const swell = Math.min(rec.radius * 0.016, cap);
        tri.uPulse.value = vesselish && state.quality !== "low" ? pulse * amp * swell : 0;
      }

      const color = state.mode === "parcellation" ? rec.parcel : rec.specimen;
      if (!rec.mat.color.equals(color)) rec.mat.color.copy(color);
      if (rec.cat === "cortex" || rec.cat === "cerebellum" || rec.cat === "deep_grey" || rec.cat === "brainstem" || rec.cat === "spinal_cord") {
        const phys = rec.mat as THREE.MeshPhysicalMaterial;
        const dull = rec.cat === "cortex" && !state.piaOn;
        const rough0 = (rec.mat.userData.rough0 as number) ?? 0.46;
        const coat0 = (rec.mat.userData.coat0 as number) ?? 0.16;
        rec.mat.roughness = dull ? 0.78 : rough0;
        rec.mat.metalness = 0.02;
        rec.mat.envMapIntensity = dull ? 0.16 : rec.cat === "spinal_cord" ? 0.45 : rec.cat === "deep_grey" || rec.cat === "brainstem" ? 0.3 : 0.38;
        if (phys.isMeshPhysicalMaterial) {
          const film = !dull && state.quality === "high" && rec.cat === "cortex" && phys.iridescence > 0 ? close : 0;
          phys.clearcoat = dull ? 0.02 : coat0 + pulse * 0.04 + film * 0.2;
          phys.clearcoatRoughness = dull ? 0.62 : Math.max(0.08, 0.36 - film * 0.22);
          phys.sheen = dull ? 0.02 : rec.cat === "spinal_cord" ? 0.16 : 0.12;
          if (film > 0) phys.iridescence = 0.012 + film * 0.15;
        }
      }
      if (state.selected === rec.key && rec.cat !== "arteries" && rec.cat !== "veins_sinuses") {
        rec.mat.emissive.set("#123f36");
        rec.mat.emissiveIntensity = 0.42;
      } else if (rec.cat === "arteries" || rec.cat === "veins_sinuses") {
        rec.mat.emissive.copy(rec.specimen).multiplyScalar(0.18);
        rec.mat.emissiveIntensity = (rec.cat === "arteries" ? 0.1 : 0.08) + pulse * (rec.cat === "arteries" ? 0.62 : 0.42);
      } else if (/choroid/i.test(rec.label)) {
        rec.mat.emissive.set("#6a3034");
        rec.mat.emissiveIntensity = 0.12 + pulse * 0.4;
      } else if (rec.cat === "cortex" || rec.cat === "cerebellum" || rec.cat === "deep_grey" || rec.cat === "brainstem") {
        const dull = rec.cat === "cortex" && !state.piaOn;
        rec.mat.emissive.set(dull ? "#000000" : "#3d1816");
        rec.mat.emissiveIntensity = dull ? 0 : 0.02 + pulse * 0.02;
      } else if (rec.cat === "spinal_cord") {
        rec.mat.emissive.set("#5a4038");
        rec.mat.emissiveIntensity = 0.02 + pulse * 0.02;
      } else if (rec.mat.emissiveIntensity !== 0) {
        rec.mat.emissive.set("#000000");
        rec.mat.emissiveIntensity = 0;
      }
    }

    if (keyRef.current && fillRef.current && rimRef.current && transRef.current) {
      keyRef.current.intensity = state.light.key;
      fillRef.current.intensity = state.light.fill;
      rimRef.current.intensity = state.light.rim;
      transRef.current.intensity = state.light.trans;
      keyRef.current.color.copy(WARM).lerp(COOL, state.light.temp);
    }

    if (qualityRef.current !== state.quality) {
      qualityRef.current = state.quality;
      const high = state.quality === "high";
      const thick = frame.unitToMm > 50 ? 0.0016 : 1.6;
      const reach = frame.unitToMm > 50 ? 0.004 : 4;
      for (const rec of frame.records) {
        const phys = rec.mat as THREE.MeshPhysicalMaterial;
        if (
          (rec.cat === "cortex" || rec.cat === "cerebellum" || rec.cat === "brainstem" || rec.cat === "deep_grey") &&
          phys.isMeshPhysicalMaterial
        ) {
          const amount = rec.cat === "deep_grey" ? 0.07 : 0.1;
          phys.transmission = high ? amount : 0;
          phys.thickness = high ? thick * (rec.cat === "deep_grey" ? 0.75 : 1) : 0;
          phys.attenuationDistance = high ? reach : 1e6;
          phys.attenuationColor.set("#ffb090");
          phys.needsUpdate = true;
        }
        if (rec.cat === "cortex" && phys.isMeshPhysicalMaterial) {
          const film = high ? 0.012 : 0;
          if ((phys.iridescence > 0) !== (film > 0)) {
            phys.iridescence = film;
            phys.iridescenceIOR = 1.28;
            phys.iridescenceThicknessRange = [200, 460];
            phys.needsUpdate = true;
          }
        }
        rec.mesh.castShadow = state.quality !== "low" && CAP_CATS.has(rec.cat);
      }
      gl.shadowMap.enabled = state.quality !== "low";
      if (keyRef.current) {
        keyRef.current.castShadow = state.quality !== "low";
        const size = state.quality === "high" ? 1024 : 512;
        keyRef.current.shadow.mapSize.set(size, size);
        keyRef.current.shadow.map?.dispose();
        keyRef.current.shadow.map = null;
      }
    }
    if (capRef.current) {
      const show = state.sectionOn && state.quality !== "low";
      capRef.current.visible = show;
      if (show) {
        capRef.current.position.copy(CLIP.normal).multiplyScalar(-CLIP.constant);
        _q.setFromUnitVectors(_z, CLIP.normal);
        capRef.current.quaternion.copy(_q);
      }
    }

    if (controls) {
      const dist = camera.position.distanceTo(controls.target);
      const near = THREE.MathUtils.clamp(dist * 0.04, frame.maxDim * 0.00035, frame.maxDim * 0.25);
      const far = Math.max(frame.maxDim * 16, dist * 8);
      if (Math.abs(camera.near - near) > near * 0.3) {
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
      }
    }

    opticsTick.current += d;
    if (opticsTick.current > 0.3 && controls) {
      opticsTick.current = 0;
      _view.copy(camera.position).sub(controls.target);
      const bits: string[] = [];
      const gate = frame.maxDim * 0.18;
      if (_view.dot(frame.superior) > gate) bits.push("superior");
      else if (_view.dot(frame.superior) < -gate) bits.push("inferior");
      if (_view.dot(frame.anterior) > gate) bits.push("anterior");
      else if (_view.dot(frame.anterior) < -gate) bits.push("posterior");
      if (_view.dot(frame.right) > gate) bits.push("right");
      else if (_view.dot(frame.right) < -gate) bits.push("left");
      useLab.getState().setOptics({
        distanceMm: camera.position.distanceTo(controls.target) * frame.unitToMm,
        approach: bits.join(" · ") || "oblique",
      });
    }
  });

  const scale = worldRef.current ? worldRef.current.maxDim / 0.16 : 1;

  return (
    <>
      <hemisphereLight args={["#d5e2ee", "#2a211c", 0.26]} />
      <ambientLight intensity={0.08} />
      <directionalLight
        ref={keyRef}
        position={[0.2, 2.6, 0.4]}
        intensity={1.35}
        color="#e4eef8"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight ref={fillRef} position={[-1.8, 0.35, 0.2]} intensity={0.7} color="#ffc08a" />
      <directionalLight ref={rimRef} position={[0.15, 0.65, -2.1]} intensity={0.42} color="#c5d6ea" />
      <pointLight ref={transRef} position={[0, -1.2, 0.15]} intensity={0.18} color="#ffb090" distance={0} />
      <group ref={rig} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} enablePan maxPolarAngle={Math.PI * 0.96} minPolarAngle={0.05} />
      {booted &&
        worldRef.current &&
        RECIPES.map((recipe) => {
          const anchor = worldRef.current?.anchors[recipe.id];
          if (!anchor) return null;
          return <TissueMount key={recipe.id} anchor={anchor} recipe={recipe} scale={scale} />;
        })}
      <MeasureReadout unitToMm={unit} />
    </>
  );
}

function fitRatio() {
  const css = window.innerWidth * window.innerHeight;
  const cap = Math.min(window.devicePixelRatio || 1, 1.35);
  const limit = 1_400_000;
  if (css * cap * cap <= limit) return cap;
  return Math.max(0.8, Math.sqrt(limit / css));
}

export function Stage() {
  return (
    <div className="absolute inset-0 z-0 touch-none">
      <Canvas
        className="h-full w-full"
        dpr={fitRatio()}
        camera={{ fov: 32, position: [0.25, 0.12, 0.35], near: 0.002, far: 20 }}
        gl={{
          antialias: true,
          alpha: false,
          localClippingEnabled: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          const maxAniso = gl.capabilities.getMaxAnisotropy();
          for (const tex of tissueTextures()) tex.anisotropy = Math.min(8, maxAniso);
          try {
            const pmrem = new THREE.PMREMGenerator(gl);
            scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.18).texture;
            scene.environmentIntensity = 0.24;
            pmrem.dispose();
          } catch {
            scene.environmentIntensity = 0.28;
          }
        }}
      >
        <color attach="background" args={["#101416"]} />
        <Specimen />
      </Canvas>
      <div className="vignette pointer-events-none absolute inset-0" />
    </div>
  );
}

export function tissueRecipe(id: SampleId) {
  return RECIPE_BY_ID[id];
}
