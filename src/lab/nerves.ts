import * as THREE from "three";
import type { CatId } from "./data";

export type NervePart = {
  geo: THREE.BufferGeometry;
  key: string;
  label: string;
  cat: CatId;
  side: "left" | "right";
  blurb: string;
};

type Buf = { p: number[]; ix: number[] };

function tube(buf: Buf, pts: THREE.Vector3[], radius: number) {
  if (pts.length < 2) return;
  const sides = 5;
  const stride = sides + 1;
  const base = buf.p.length / 3;
  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)]!;
    const next = pts[Math.min(pts.length - 1, i + 1)]!;
    const tan = next.clone().sub(prev);
    if (tan.lengthSq() < 1e-12) tan.copy(up);
    tan.normalize();
    const ref = Math.abs(tan.dot(up)) > 0.85 ? alt : up;
    const n1 = new THREE.Vector3().crossVectors(tan, ref).normalize();
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
    const end = i === 0 || i === pts.length - 1 ? 0.85 : 1;
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const q = pts[i]!.clone().addScaledVector(n1, Math.cos(a) * radius * end).addScaledVector(n2, Math.sin(a) * radius * end);
      buf.p.push(q.x, q.y, q.z);
    }
  }
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const s0 = base + i * stride + j;
      const s1 = s0 + stride;
      buf.ix.push(s0, s0 + 1, s1, s0 + 1, s1 + 1, s1);
    }
  }
}

function geoOf(buf: Buf) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(buf.p, 3));
  geo.setIndex(buf.ix);
  geo.computeVertexNormals();
  return geo;
}

function chain(pts: THREE.Vector3[], steps = 4) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const n = i === pts.length - 2 ? steps : steps - 1;
    for (let s = 0; s < n; s++) out.push(a.clone().lerp(b, s / steps));
  }
  out.push(pts[pts.length - 1]!.clone());
  return out;
}

export function buildPeripheral(
  origin: THREE.Vector3,
  inferior: THREE.Vector3,
  anterior: THREE.Vector3,
  right: THREE.Vector3,
  unitToMm: number,
) {
  const mm = (n: number) => n / unitToMm;
  const length = mm(420);
  const centerAt = (t: number) => {
    const u = Math.min(1, Math.max(0, t));
    const sag = Math.sin(u * Math.PI) * mm(u < 0.42 ? 12 : -8);
    const lat = Math.sin(u * Math.PI * 2) * mm(2.2);
    return origin.clone().addScaledVector(inferior, t * length).addScaledVector(anterior, sag).addScaledVector(right, lat);
  };
  const frameAt = (t: number) => {
    const p = centerAt(t);
    const ahead = centerAt(t + 0.01);
    const tangent = ahead.sub(p);
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
    return { p, right: r, anterior: a };
  };
  const at = (t: number, latMm: number, antMm: number) => {
    const fr = frameAt(t);
    return fr.p.clone().addScaledVector(fr.right, mm(latMm)).addScaledVector(fr.anterior, mm(antMm));
  };
  const down = (from: THREE.Vector3, mmDown: number, latMm = 0, antMm = 0) => {
    const fr = frameAt(1);
    return from.clone().addScaledVector(inferior, mm(mmDown)).addScaledVector(fr.right, mm(latMm)).addScaledVector(fr.anterior, mm(antMm));
  };

  const parts: NervePart[] = [];
  const levels = [
    ...[0.03, 0.055, 0.08, 0.105, 0.13, 0.155, 0.18, 0.205],
    ...Array.from({ length: 12 }, (_, i) => 0.24 + i * 0.028),
    ...[0.6, 0.645, 0.69, 0.735, 0.78],
    ...[1.04, 1.1, 1.16, 1.22, 1.28, 1.34],
  ];

  for (const sign of [1, -1] as const) {
    const side = sign > 0 ? "right" : "left";
    const s = (n: number) => n * sign;
    const spinal: Buf = { p: [], ix: [] };
    const intercostal: Buf = { p: [], ix: [] };
    const sympathetic: Buf = { p: [], ix: [] };
    const chainPts: THREE.Vector3[] = [];
    for (let i = 0; i < levels.length; i++) {
      const t = levels[i]!;
      const root = at(t, s(5.5), 1);
      const gang = at(t, s(14), 2);
      const nerve = at(t, s(t > 0.22 && t < 0.58 ? 32 : 26), 4);
      tube(spinal, chain([root, gang]), mm(0.7));
      tube(spinal, chain([gang, nerve]), mm(i < 8 || (i >= 20 && i < 25) ? 1.15 : 0.85));
      tube(spinal, [gang, gang.clone().addScaledVector(inferior, mm(1.2))], mm(1.5));
      if (i >= 8 && i < 20) {
        const rib = at(t, s(110), 20);
        const front = at(t, s(28), 108);
        tube(intercostal, chain([nerve, rib, front], 5), mm(0.55));
      }
      const gangOnChain = at(t, s(18), 8);
      chainPts.push(gangOnChain);
      tube(sympathetic, chain([gang, gangOnChain], 3), mm(0.35));
    }
    tube(sympathetic, chain(chainPts, 2), mm(0.7));

    const shoulder = at(0.22, s(158), 6);
    const axilla = at(0.2, s(78), 10);
    const roots = [0.13, 0.155, 0.18, 0.205, 0.235].map((t) => at(t, s(26), 4));
    const plexus: Buf = { p: [], ix: [] };
    for (const root of roots) tube(plexus, chain([root, axilla, shoulder], 4), mm(1.05));

    const elbow = down(shoulder, 310, s(8), 18);
    const wrist = down(shoulder, 610, s(-6), 22);
    const hand = down(shoulder, 680, s(-4), 16);
    const median: Buf = { p: [], ix: [] };
    tube(median, chain([shoulder, elbow, wrist, hand], 5), mm(0.85));
    const ulnar: Buf = { p: [], ix: [] };
    tube(
      ulnar,
      chain([shoulder, down(shoulder, 300, s(-18), 4), down(shoulder, 620, s(-16), 6), down(shoulder, 690, s(-14), 4)], 5),
      mm(0.72),
    );
    const radial: Buf = { p: [], ix: [] };
    tube(
      radial,
      chain([shoulder, down(shoulder, 180, s(16), -28), down(shoulder, 340, s(10), -8), down(shoulder, 600, s(12), 4)], 5),
      mm(0.8),
    );
    const musc: Buf = { p: [], ix: [] };
    tube(musc, chain([shoulder, down(shoulder, 40, s(22), 24), down(shoulder, 190, s(26), 20)], 4), mm(0.62));
    const axillary: Buf = { p: [], ix: [] };
    tube(axillary, chain([shoulder, down(shoulder, 28, s(18), -22), down(shoulder, 55, s(8), -18)], 3), mm(0.58));

    const c4 = at(0.105, s(22), 16);
    const phrenic: Buf = { p: [], ix: [] };
    tube(phrenic, chain([c4, at(0.2, s(24), 28), at(0.34, s(26), 34), at(0.5, s(22), 48)], 4), mm(0.48));

    const hip = at(1.05, s(96), 12);
    const lumbarRoot = [0.6, 0.645, 0.69, 0.735].map((t) => at(t, s(26), 6));
    const lumbar: Buf = { p: [], ix: [] };
    const plexusPoint = at(0.68, s(42), 18);
    for (const root of lumbarRoot) tube(lumbar, chain([root, plexusPoint], 3), mm(0.9));
    const femoral: Buf = { p: [], ix: [] };
    tube(femoral, chain([plexusPoint, at(0.92, s(78), 36), hip.clone().addScaledVector(anterior, mm(24)), down(hip, 420, s(6), 28)], 5), mm(0.95));
    const obturator: Buf = { p: [], ix: [] };
    tube(obturator, chain([plexusPoint, at(0.9, s(48), 4), down(hip, 260, s(-8), 6)], 4), mm(0.62));

    const sacralRoots = [1.04, 1.1, 1.16, 1.22].map((t) => at(t, s(22), -4));
    const sciatic: Buf = { p: [], ix: [] };
    const knee = down(hip, 430, s(4), -18);
    for (const root of sacralRoots) tube(sciatic, chain([root, at(1.02, s(55), -16)], 3), mm(0.85));
    tube(sciatic, chain([at(1.02, s(55), -16), hip.clone().addScaledVector(anterior, mm(-22)), knee], 5), mm(1.15));
    const tibial: Buf = { p: [], ix: [] };
    tube(tibial, chain([knee, down(hip, 640, s(2), -16), down(hip, 860, s(-4), -8)], 5), mm(0.8));
    const fibular: Buf = { p: [], ix: [] };
    tube(fibular, chain([knee, down(hip, 500, s(22), -6), down(hip, 840, s(18), 4)], 5), mm(0.62));
    const pudendal: Buf = { p: [], ix: [] };
    tube(pudendal, chain([at(1.16, s(20), -6), at(1.22, s(12), -14), down(at(1.24, s(8), -10), 36)], 3), mm(0.45));

    const vagus: Buf = { p: [], ix: [] };
    tube(vagus, chain([at(0.02, s(16), 22), at(0.12, s(20), 26), at(0.28, s(24), 30), at(0.46, s(18), 36)], 4), mm(0.55));

    const push = (buf: Buf, key: string, label: string, cat: CatId, blurb: string) => {
      if (!buf.p.length) return;
      parts.push({ geo: geoOf(buf), key: `${key}:${side}`, label, cat, side, blurb });
    };
    push(spinal, "nerve:spinal", "Spinal nerves", "spinal_nerves", "All 31 spinal nerves on this side, from the root to just past the dorsal root ganglion.");
    push(intercostal, "nerve:intercostal", "Intercostal nerves", "peripheral", "Thoracic ventral rami running in the costal grooves toward the sternum.");
    push(sympathetic, "nerve:sympathetic", "Sympathetic trunk", "sympathetic", "Paravertebral chain and the rami that join it to each spinal nerve.");
    push(plexus, "nerve:brachial", "Brachial plexus", "peripheral", "C5–T1 ventral rami converging through the neck into the axilla.");
    push(median, "nerve:median", "Median nerve", "peripheral", "Anterior arm and forearm, into the hand.");
    push(ulnar, "nerve:ulnar", "Ulnar nerve", "peripheral", "Medial arm, behind the elbow, into the hand.");
    push(radial, "nerve:radial", "Radial nerve", "peripheral", "Posterior arm in the spiral groove, then the extensors.");
    push(musc, "nerve:musculocutaneous", "Musculocutaneous nerve", "peripheral", "Lateral arm, to biceps and brachialis.");
    push(axillary, "nerve:axillary", "Axillary nerve", "peripheral", "Short nerve at the shoulder to deltoid and teres minor.");
    push(phrenic, "nerve:phrenic", "Phrenic nerve", "peripheral", "C3–C5, descending to the diaphragm.");
    push(lumbar, "nerve:lumbar", "Lumbar plexus", "peripheral", "L1–L4 ventral rami before the femoral and obturator nerves leave.");
    push(femoral, "nerve:femoral", "Femoral nerve", "peripheral", "Under the inguinal ligament into the anterior thigh.");
    push(obturator, "nerve:obturator", "Obturator nerve", "peripheral", "Through the obturator canal to the medial thigh.");
    push(sciatic, "nerve:sciatic", "Sciatic nerve", "peripheral", "From the sacral plexus down the posterior thigh to the knee.");
    push(tibial, "nerve:tibial", "Tibial nerve", "peripheral", "Posterior leg, toward the medial ankle.");
    push(fibular, "nerve:fibular", "Common fibular nerve", "peripheral", "Around the neck of the fibula and down the lateral leg.");
    push(pudendal, "nerve:pudendal", "Pudendal nerve", "peripheral", "S2–S4 to the perineum.");
    push(vagus, "nerve:vagus", "Vagus nerve, cervical", "peripheral", "Continuation of cranial nerve X through the neck into the thorax.");
  }
  return parts;
}
