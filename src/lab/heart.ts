import * as THREE from "three";
import type { CatId } from "./data";

export type CircPart = {
  geo: THREE.BufferGeometry;
  key: string;
  label: string;
  cat: CatId;
  side: "left" | "right" | "median";
  blurb: string;
  beat?: "ventricle" | "atrium" | "coronary";
  center?: THREE.Vector3;
  orient?: THREE.Quaternion;
  color?: string;
  drift?: THREE.Vector3;
  weight?: number;
};

type Buf = { p: number[]; ix: number[]; uv?: number[] };

function tube(buf: Buf, pts: THREE.Vector3[], radius: number, taper = 0.12) {
  if (pts.length < 2 || radius <= 0) return;
  const sides = 8;
  const stride = sides + 1;
  const base = buf.p.length / 3;
  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)]!;
    const next = pts[Math.min(pts.length - 1, i + 1)]!;
    const tan = next.clone().sub(prev);
    if (tan.lengthSq() < 1e-10) tan.copy(up);
    tan.normalize();
    const ref = Math.abs(tan.dot(up)) > 0.85 ? alt : up;
    const n1 = new THREE.Vector3().crossVectors(tan, ref).normalize();
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
    const along = i / (pts.length - 1);
    const thick = radius * (1 - along * taper);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const q = pts[i]!.clone().addScaledVector(n1, Math.cos(a) * thick).addScaledVector(n2, Math.sin(a) * thick);
      buf.p.push(q.x, q.y, q.z);
      buf.uv?.push(j / sides, along * 4);
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
  if (buf.uv?.length) geo.setAttribute("uv", new THREE.Float32BufferAttribute(buf.uv, 2));
  geo.setIndex(buf.ix);
  geo.computeVertexNormals();
  return geo;
}

function chain(pts: THREE.Vector3[], steps = 5) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const n = i === pts.length - 2 ? steps : steps - 1;
    for (let s = 0; s < n; s++) out.push(pts[i]!.clone().lerp(pts[i + 1]!, s / steps));
  }
  out.push(pts[pts.length - 1]!.clone());
  return out;
}

function surface(segU: number, segV: number, fn: (u: number, v: number) => THREE.Vector3) {
  const pos: number[] = [];
  const uv: number[] = [];
  const ix: number[] = [];
  const stride = segV + 1;
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      const p = fn(u, v);
      pos.push(p.x, p.y, p.z);
      uv.push(v, u);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * stride + j;
      ix.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  return geo;
}

function merge(geos: THREE.BufferGeometry[]) {
  let count = 0;
  let icount = 0;
  for (const geo of geos) {
    count += geo.getAttribute("position").count;
    icount += geo.getIndex()?.count ?? 0;
  }
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const index = new Uint32Array(icount);
  let vOff = 0;
  let iOff = 0;
  for (const geo of geos) {
    const pa = geo.getAttribute("position");
    const ua = geo.getAttribute("uv");
    positions.set(pa.array as Float32Array, vOff * 3);
    if (ua) uvs.set(ua.array as Float32Array, vOff * 2);
    const ia = geo.getIndex();
    if (ia) {
      for (let i = 0; i < ia.count; i++) index[iOff + i] = ia.array[i]! + vOff;
      iOff += ia.count;
    }
    vOff += pa.count;
    geo.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  return geo;
}

function shell(
  segU: number,
  segV: number,
  fn: (u: number, v: number) => THREE.Vector3,
  thick: number,
  outward: (p: THREE.Vector3) => THREE.Vector3,
) {
  const stride = segV + 1;
  const grid: THREE.Vector3[] = [];
  for (let i = 0; i <= segU; i++) for (let j = 0; j <= segV; j++) grid.push(fn(i / segU, j / segV));
  const pos: number[] = [];
  const uv: number[] = [];
  const put = (p: THREE.Vector3, u: number, v: number) => {
    pos.push(p.x, p.y, p.z);
    uv.push(u, v);
  };
  grid.forEach((p, i) => put(p, (i % stride) / segV, Math.floor(i / stride) / segU));
  grid.forEach((p, i) => {
    const n = outward(p);
    if (n.lengthSq() < 1e-12) n.set(0, 1, 0);
    put(p.clone().addScaledVector(n.normalize(), -thick), (i % stride) / segV, Math.floor(i / stride) / segU);
  });
  const ix: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (flip) ix.push(a, c, b, b, c, d);
    else ix.push(a, b, c, b, d, c);
  };
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * stride + j;
      quad(a, a + 1, a + stride, a + stride + 1, false);
      const b = a + grid.length;
      quad(b, b + 1, b + stride, b + stride + 1, true);
    }
  }
  const rim = (o0: number, o1: number) => {
    const i0 = o0 + grid.length;
    const i1 = o1 + grid.length;
    ix.push(o0, i0, o1, o1, i0, i1);
  };
  for (let j = 0; j < segV; j++) {
    rim(j, j + 1);
    rim(segU * stride + j + 1, segU * stride + j);
  }
  for (let i = 0; i < segU; i++) {
    rim((i + 1) * stride, i * stride);
    rim(i * stride + segV, (i + 1) * stride + segV);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  return geo;
}

function ellipsoid(rx: number, ry: number, rz: number, at: THREE.Vector3, rotZ = 0) {
  const geo = new THREE.SphereGeometry(1, 22, 16);
  geo.scale(rx, ry, rz);
  if (rotZ) geo.rotateZ(rotZ);
  geo.translate(at.x, at.y, at.z);
  return geo;
}

export function buildCirculation(
  origin: THREE.Vector3,
  inferior: THREE.Vector3,
  anterior: THREE.Vector3,
  right: THREE.Vector3,
  unitToMm: number,
) {
  const s = (n: number) => n / unitToMm;
  const length = s(420);
  const centerAt = (t: number) => {
    const u = Math.min(1, Math.max(0, t));
    const sag = Math.sin(u * Math.PI) * s(u < 0.42 ? 12 : -8);
    return origin.clone().addScaledVector(inferior, t * length).addScaledVector(anterior, sag);
  };
  const frameAt = (t: number) => {
    const p = centerAt(t);
    const tangent = centerAt(t + 0.01).sub(p);
    if (tangent.lengthSq() < 1e-12) tangent.copy(inferior);
    tangent.normalize();
    const r = right.clone().addScaledVector(tangent, -right.dot(tangent)).normalize();
    const a = new THREE.Vector3().crossVectors(r, tangent);
    if (a.dot(anterior) < 0) {
      a.negate();
      r.negate();
    }
    return { p, right: r, anterior: a };
  };
  const at = (t: number, lat: number, ant: number) => {
    const fr = frameAt(Math.max(0, t));
    const extra = Math.max(0, t - 1) * length;
    return fr.p.clone().addScaledVector(inferior, extra).addScaledVector(fr.right, s(lat)).addScaledVector(fr.anterior, s(ant));
  };
  const down = (from: THREE.Vector3, dist: number, lat = 0, ant = 0) => {
    const fr = frameAt(1);
    return from.clone().addScaledVector(inferior, s(dist)).addScaledVector(fr.right, s(lat)).addScaledVector(fr.anterior, s(ant));
  };

  const hub = at(0.4, -12, 78);
  const xAxis = right.clone().normalize();
  const yAxis = inferior.clone().negate().normalize();
  yAxis.addScaledVector(xAxis, -yAxis.dot(xAxis)).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  if (zAxis.dot(anterior) < 0) {
    zAxis.negate();
    xAxis.negate();
  }
  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const orient = new THREE.Quaternion().setFromRotationMatrix(basis);
  const toWorld = (p: THREE.Vector3) => p.clone().applyMatrix4(basis).add(hub);

  const groove = 2.15;
  const ventricle = (u: number, v: number) => {
    const ang = v * Math.PI * 2;
    const y = s(THREE.MathUtils.lerp(-62, 34, Math.pow(u, 0.9)));
    const belly = Math.sin(Math.min(1, u) * Math.PI);
    const waist = u > 0.8 ? THREE.MathUtils.lerp(1, 0.74, (u - 0.8) / 0.2) : 1;
    const taper = Math.pow(Math.max(u, 0.02), 0.62);
    let rx = s(6 + 36 * taper * (0.35 + 0.65 * belly) * waist);
    let rz = s(5 + 24 * taper * (0.4 + 0.6 * belly) * waist);
    const anteriorAmt = Math.max(0, Math.sin(ang));
    const rightAmt = Math.max(0, Math.cos(ang));
    const rv = Math.pow(anteriorAmt, 1.15) * (0.35 + 0.65 * rightAmt) * belly * (u > 0.12 && u < 0.86 ? 1 : 0.25);
    rx += s(16) * rv;
    rz += s(14) * rv;
    const left = Math.pow(Math.max(0, -Math.cos(ang)), 1.15);
    rx += s(7) * left * belly;
    let x = Math.cos(ang) * rx - s(7) * belly;
    let z = Math.sin(ang) * rz;
    const iv = Math.exp(-((ang - groove) ** 2) / 0.045) * belly * (u > 0.18 && u < 0.92 ? 1 : 0.15);
    const rad = Math.hypot(x, z) || 1;
    x -= (x / rad) * s(5.2) * iv;
    z -= (z / rad) * s(5.2) * iv;
    return new THREE.Vector3(x, y, z);
  };
  const ventOut = (p: THREE.Vector3) => {
    const o = new THREE.Vector3(p.x, p.y * 0.12, p.z);
    if (o.lengthSq() < 1e-12) o.set(0, -1, 0);
    return o;
  };
  const wrapAng = (ang: number) => ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const D = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(basis).normalize();
  const parts: CircPart[] = [];

  const lv = shell(22, 28, (u, v) => {
    const ang = THREE.MathUtils.lerp(1.7, Math.PI * 2 + 0.35, v);
    return ventricle(Math.pow(u, 0.92) * 0.9, wrapAng(ang) / (Math.PI * 2));
  }, s(9), ventOut);
  const rv = shell(16, 18, (u, v) => {
    const ang = THREE.MathUtils.lerp(-0.2, 1.7, v);
    return ventricle(THREE.MathUtils.lerp(0.2, 0.88, u), wrapAng(ang) / (Math.PI * 2));
  }, s(4), ventOut);
  const septum = shell(
    14,
    10,
    (u, v) => new THREE.Vector3(s(-1 + 5 * Math.sin(u * Math.PI) * (v - 0.5)), s(THREE.MathUtils.lerp(-46, 26, u)), s(THREE.MathUtils.lerp(-12, 14, v))),
    s(8),
    () => new THREE.Vector3(1, 0, 0),
  );
  const ias = shell(
    8,
    8,
    (u, v) => new THREE.Vector3(s(1.5), s(THREE.MathUtils.lerp(18, 40, u)), s(THREE.MathUtils.lerp(-6, 8, v))),
    s(3),
    () => new THREE.Vector3(1, 0, 0),
  );
  const cup = (center: THREE.Vector3, rx: number, ry: number, rz: number) =>
    shell(
      14,
      18,
      (u, v) => {
        const theta = (0.08 + u * 0.74) * Math.PI;
        const phi = v * Math.PI * 2;
        const st = Math.sin(theta);
        return new THREE.Vector3(center.x + Math.cos(phi) * st * rx, center.y + Math.cos(theta) * ry, center.z + Math.sin(phi) * st * rz);
      },
      s(2.4),
      (p) => p.clone().sub(center),
    );
  const laCenter = new THREE.Vector3(s(-10), s(32), s(-16));
  const raCenter = new THREE.Vector3(s(16), s(30), s(2));

  const fatAv: Buf = { p: [], ix: [], uv: [] };
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const p = ventricle(0.86, i / 28);
    const flat = new THREE.Vector3(p.x, 0, p.z);
    if (flat.lengthSq() > 1e-10) p.addScaledVector(flat.normalize(), s(1.5));
    ring.push(p);
  }
  tube(fatAv, ring, s(3.1), 0);
  const fatIv: Buf = { p: [], ix: [], uv: [] };
  const seam: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) seam.push(ventricle(0.82 - i * 0.034, groove / (Math.PI * 2)));
  tube(fatIv, seam, s(2.2), 0.4);

  const heart = (geo: THREE.BufferGeometry, key: string, label: string, side: CircPart["side"], blurb: string, beat: CircPart["beat"], drift: THREE.Vector3, weight: number, color?: string) => {
    parts.push({ geo, key, label, cat: "heart", side, blurb, beat, center: hub, orient, drift, weight, color });
  };
  heart(lv, "heart:lv", "Left ventricle", "left", "Thick-walled chamber forming the apex and the left border. It shortens and twists on each systole. The wall is open at the base so the cavity shows when the heart is exploded.", "ventricle", D(-1, -0.8, -0.25), 1);
  heart(rv, "heart:rv", "Right ventricle", "right", "Thin crescent on the front of the heart. It wraps the left ventricle and ejects into the pulmonary trunk.", "ventricle", D(0.65, -0.1, 1), 1);
  heart(septum, "heart:septum", "Interventricular septum", "median", "The wall between the ventricles, mostly muscle, continuous with the left ventricular wall.", "ventricle", D(-0.1, -0.45, 0.05), 0.32);
  heart(cup(laCenter, s(18), s(14), s(14)), "heart:la", "Left atrium", "left", "Posterior chamber. Four pulmonary veins enter it. The opening faces the left ventricle.", "atrium", D(-0.55, 0.55, -1), 0.9);
  heart(cup(raCenter, s(20), s(16), s(15)), "heart:ra", "Right atrium", "right", "Receives the venae cavae. The opening faces the right ventricle. The auricle is separate so it can lift away.", "atrium", D(1, 0.4, 0.15), 0.9);
  heart(ias, "heart:ias", "Interatrial septum", "median", "The wall between the atria. The fossa ovalis is not marked.", "atrium", D(0.05, 0.7, -0.15), 0.28);
  heart(auricle(s, -1), "heart:laa", "Left auricle", "left", "The left atrial appendage, a small ear on the left atrium.", "atrium", D(-1.1, 0.45, 0.35), 1.15);
  heart(auricle(s, 1), "heart:raa", "Right auricle", "right", "The right atrial appendage, overlapping the front of the right atrium.", "atrium", D(0.35, 0.35, 1.1), 1.15);
  heart(geoOf(fatAv), "heart:fat-av", "Atrioventricular groove fat", "median", "Epicardial fat in the groove between the atria and the ventricles.", "ventricle", D(0, 1, 0.35), 1.25, "#c9ae84");
  heart(geoOf(fatIv), "heart:fat-iv", "Interventricular groove fat", "median", "Epicardial fat in the anterior groove between the ventricles. The anterior interventricular artery runs here.", "ventricle", D(-0.25, -0.15, 1.1), 1.25, "#c9ae84");

  const lift = (u: number, v: number, out = 1.4) => {
    const p = ventricle(u, v);
    const flat = new THREE.Vector3(p.x, 0, p.z);
    if (flat.lengthSq() > 1e-10) p.addScaledVector(flat.normalize(), s(out));
    return toWorld(p);
  };
  const ostium = toWorld(new THREE.Vector3(s(1), s(36), s(6)));
  const lad: Buf = { p: [], ix: [] };
  const ladPts = [ostium];
  for (let i = 0; i <= 14; i++) ladPts.push(lift(0.8 - i * 0.04, groove / (Math.PI * 2), 1.6));
  tube(lad, chain(ladPts, 2), s(1.7), 0.45);
  const circ: Buf = { p: [], ix: [] };
  const circPts = [ostium];
  for (let i = 0; i <= 12; i++) circPts.push(lift(0.84, 0.34 + i * 0.035, 1.5));
  tube(circ, chain(circPts, 2), s(1.45), 0.5);
  const rca: Buf = { p: [], ix: [] };
  const rcaPts = [toWorld(new THREE.Vector3(s(6), s(34), s(8)))];
  for (let i = 0; i <= 12; i++) rcaPts.push(lift(0.84, 0.08 + i * 0.03, 1.5));
  tube(rca, chain(rcaPts, 2), s(1.4), 0.45);

  const aorta: Buf = { p: [], ix: [] };
  tube(
    aorta,
    chain(
      [
        toWorld(new THREE.Vector3(s(2), s(30), s(-2))),
        toWorld(new THREE.Vector3(s(1), s(52), s(-6))),
        toWorld(new THREE.Vector3(s(-6), s(66), s(-10))),
        toWorld(new THREE.Vector3(s(-16), s(50), s(-20))),
        toWorld(new THREE.Vector3(s(-12), s(8), s(-24))),
        at(0.55, -10, 24),
        at(0.72, -6, 20),
      ],
      4,
    ),
    s(12),
    0.28,
  );
  const trunk: Buf = { p: [], ix: [] };
  const split = toWorld(new THREE.Vector3(s(-4), s(54), s(18)));
  tube(trunk, chain([toWorld(new THREE.Vector3(s(-2), s(28), s(16))), toWorld(new THREE.Vector3(s(-4), s(42), s(20))), split], 4), s(10), 0.05);
  const lpa: Buf = { p: [], ix: [] };
  tube(lpa, chain([split, toWorld(new THREE.Vector3(s(-28), s(46), s(6)))], 3), s(6.5), 0.2);
  const rpa: Buf = { p: [], ix: [] };
  tube(rpa, chain([split, toWorld(new THREE.Vector3(s(22), s(44), s(4)))], 3), s(6.5), 0.2);

  const veinsL: Buf = { p: [], ix: [] };
  const veinsR: Buf = { p: [], ix: [] };
  tube(veinsL, chain([toWorld(new THREE.Vector3(s(-16), s(36), s(-22))), toWorld(new THREE.Vector3(s(-24), s(40), s(-46)))], 3), s(4.2), 0.05);
  tube(veinsL, chain([toWorld(new THREE.Vector3(s(-16), s(22), s(-20))), toWorld(new THREE.Vector3(s(-24), s(16), s(-44)))], 3), s(4.2), 0.05);
  tube(veinsR, chain([toWorld(new THREE.Vector3(s(2), s(36), s(-22))), toWorld(new THREE.Vector3(s(8), s(40), s(-46)))], 3), s(4.2), 0.05);
  tube(veinsR, chain([toWorld(new THREE.Vector3(s(2), s(22), s(-20))), toWorld(new THREE.Vector3(s(8), s(16), s(-44)))], 3), s(4.2), 0.05);

  const pushTube = (buf: Buf, key: string, label: string, cat: CatId, side: CircPart["side"], blurb: string, drift: THREE.Vector3, weight: number, beat?: CircPart["beat"]) => {
    if (!buf.p.length) return;
    parts.push({ geo: geoOf(buf), key, label, cat, side, blurb, beat, drift, weight });
  };
  pushTube(aorta, "heart:aorta", "Aorta", "arteries", "median", "Leaves the left ventricle behind the pulmonary trunk, arches, and descends along the spine.", D(0.15, 1, -0.35), 0.72);
  pushTube(trunk, "heart:pulmonary", "Pulmonary trunk", "arteries", "median", "Leaves the right ventricle in front of the aorta.", D(-0.1, 0.45, 1), 0.8);
  pushTube(lpa, "heart:lpa", "Left pulmonary artery", "arteries", "left", "From the pulmonary trunk toward the left lung, which is not shown.", D(-1, 0.35, 0.2), 0.85);
  pushTube(rpa, "heart:rpa", "Right pulmonary artery", "arteries", "right", "From the pulmonary trunk toward the right lung, which is not shown.", D(1, 0.3, 0.15), 0.85);
  pushTube(lad, "heart:lad", "Anterior interventricular artery", "arteries", "median", "Runs in the anterior interventricular groove toward the apex. It fills in diastole.", D(-0.2, -0.35, 1), 0.9, "coronary");
  pushTube(circ, "heart:lcx", "Circumflex artery", "arteries", "left", "Runs in the left atrioventricular groove. It fills in diastole.", D(-1, 0.25, -0.15), 0.9, "coronary");
  pushTube(rca, "heart:rca", "Right coronary artery", "arteries", "right", "Runs in the right atrioventricular groove. It fills in diastole.", D(1, 0.1, 0.55), 0.9, "coronary");
  pushTube(veinsL, "heart:pv-left", "Left pulmonary veins", "veins", "left", "Two veins entering the left side of the left atrium.", D(-0.45, 0.2, -1), 0.8);
  pushTube(veinsR, "heart:pv-right", "Right pulmonary veins", "veins", "right", "Two veins entering the right side of the left atrium.", D(0.35, 0.2, -1), 0.8);

  for (const sign of [1, -1] as const) {
    const side = sign > 0 ? "right" : "left";
    const lat = (n: number) => n * sign;
    const veins: Buf = { p: [], ix: [] };
    tube(veins, chain([at(0.02, lat(18), 16), at(0.22, lat(16), 22), at(0.26, lat(8), 40)], 5), s(sign > 0 ? 7 : 6));
    tube(veins, chain([at(0.22, lat(70), 18), at(0.22, lat(40), 16), at(0.26, lat(8), 40)], 4), s(5));
    const hip = at(1.02, lat(70), 8);
    tube(veins, chain([down(hip, 280, lat(-4), 10), hip, at(0.78, lat(18), 24)], 5), s(4.5));
    pushTube(veins, `heart:veins:${side}`, "Jugular, subclavian, and iliac veins", "veins", side, "Internal jugular and subclavian veins into the brachiocephalic vein, and the iliac vein from the thigh.", D(sign, 0.2, 0.35), 0.55);
  }

  const svc: Buf = { p: [], ix: [] };
  tube(svc, chain([at(0.24, 8, 34), toWorld(new THREE.Vector3(s(14), s(42), s(4)))], 4), s(8.5), 0.05);
  const ivc: Buf = { p: [], ix: [] };
  tube(ivc, chain([at(0.7, 4, 24), at(0.52, 8, 28), toWorld(new THREE.Vector3(s(12), s(14), s(2)))], 5), s(9.5), 0.05);
  const azygos: Buf = { p: [], ix: [] };
  tube(azygos, chain([at(0.7, 14, 16), at(0.48, 16, 22), at(0.3, 12, 34)], 5), s(3.4));
  pushTube(svc, "heart:svc", "Superior vena cava", "veins", "right", "Enters the top of the right atrium.", D(0.25, 1, 0.2), 0.7);
  pushTube(ivc, "heart:ivc", "Inferior vena cava", "veins", "right", "Enters the floor of the right atrium.", D(0.15, -1, 0.1), 0.7);
  pushTube(azygos, "heart:azygos", "Azygos vein", "veins", "right", "Ascends on the right of the spine and empties into the superior vena cava.", D(0.8, 0.2, -0.2), 0.5);

  return parts;
}
function auricle(s: (n: number) => number, side: 1 | -1) {
  return surface(8, 12, (u, v) => {
    const ang = v * Math.PI * 2;
    const rad = s(6.5) * Math.sin(u * Math.PI);
    const origin = side > 0 ? new THREE.Vector3(s(22), s(28), s(6)) : new THREE.Vector3(s(-16), s(30), s(-6));
    const dir = side > 0 ? new THREE.Vector3(s(-8), s(1), s(14)) : new THREE.Vector3(s(-10), s(1), s(8));
    const n2 = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const n3 = new THREE.Vector3().crossVectors(n2, dir).normalize();
    return origin
      .clone()
      .addScaledVector(dir, u)
      .addScaledVector(n2, Math.cos(ang) * rad * 1.35)
      .addScaledVector(n3, Math.sin(ang) * rad * 0.5);
  });
}
