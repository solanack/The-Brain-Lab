import * as THREE from "three";
import type { CatId } from "./data";

export type NeckPart = {
  geo: THREE.BufferGeometry;
  key: string;
  label: string;
  cat: CatId;
  side: "left" | "right" | "median";
  blurb: string;
  color?: string;
  drift: THREE.Vector3;
  opacity?: number;
};

const NOTE = " Teaching approximation, registered to this specimen. Not a surgical plan.";

function bar(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, segs = 7) {
  const dir = b.clone().sub(a);
  const len = Math.max(dir.length(), 1e-5);
  const geo = new THREE.CylinderGeometry(Math.max(r1, 1e-5), Math.max(r0, 1e-5), len, segs, 1, false);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().multiplyScalar(1 / len)));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  geo.translate(mid.x, mid.y, mid.z);
  return geo;
}

function ball(c: THREE.Vector3, rx: number, ry: number, rz: number, seg = 10) {
  const geo = new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.65)));
  geo.scale(rx, ry, rz);
  geo.translate(c.x, c.y, c.z);
  return geo;
}

function merge(geos: THREE.BufferGeometry[]) {
  let verts = 0;
  let indices = 0;
  for (const geo of geos) {
    verts += geo.getAttribute("position").count;
    indices += geo.getIndex()?.count ?? 0;
  }
  const pos = new Float32Array(verts * 3);
  const idx = new Uint32Array(indices);
  let base = 0;
  let cursor = 0;
  for (const geo of geos) {
    const p = geo.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      pos[(base + i) * 3] = p.getX(i);
      pos[(base + i) * 3 + 1] = p.getY(i);
      pos[(base + i) * 3 + 2] = p.getZ(i);
    }
    const ix = geo.getIndex();
    if (ix) {
      for (let i = 0; i < ix.count; i++) idx[cursor++] = ix.getX(i) + base;
    }
    base += p.count;
    geo.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

function vault(center: THREE.Vector3, superior: THREE.Vector3, anterior: THREE.Vector3, right: THREE.Vector3, rx: number, ry: number, rz: number) {
  const raw = new THREE.SphereGeometry(1, 22, 14);
  const p = raw.getAttribute("position");
  const ix = raw.getIndex()!;
  const keep: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < ix.count; i += 3) {
    let above = 0;
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(p, ix.getX(i + k));
      if (v.y > -0.22) above++;
    }
    if (above >= 2) keep.push(ix.getX(i), ix.getX(i + 1), ix.getX(i + 2));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", p.clone());
  geo.setIndex(keep);
  raw.dispose();
  const basis = new THREE.Matrix4().makeBasis(right, superior, anterior);
  geo.applyMatrix4(new THREE.Matrix4().makeScale(rx, ry, rz).premultiply(basis));
  geo.translate(center.x, center.y, center.z);
  geo.computeVertexNormals();
  return geo;
}

export function buildHeadNeck(opts: {
  center: THREE.Vector3;
  origin: THREE.Vector3;
  superior: THREE.Vector3;
  anterior: THREE.Vector3;
  right: THREE.Vector3;
  unitToMm: number;
  halfLat: number;
  halfSup: number;
  halfAnt: number;
  globes: { side: "left" | "right"; at: THREE.Vector3 }[];
}) {
  const { center, origin, superior, anterior, right, unitToMm } = opts;
  const mm = (n: number) => n / unitToMm;
  const inferior = superior.clone().negate();
  const at = (sup: number, ant: number, lat: number, from = center) =>
    from.clone().addScaledVector(superior, mm(sup)).addScaledVector(anterior, mm(ant)).addScaledVector(right, mm(lat));
  const neck = (down: number, ant: number, lat: number) =>
    origin.clone().addScaledVector(inferior, mm(down)).addScaledVector(anterior, mm(ant)).addScaledVector(right, mm(lat));
  const parts: NeckPart[] = [];
  const push = (
    geo: THREE.BufferGeometry,
    key: string,
    label: string,
    cat: CatId,
    side: NeckPart["side"],
    blurb: string,
    drift: THREE.Vector3,
    color?: string,
    opacity?: number,
  ) => {
    parts.push({ geo, key, label, cat, side, blurb: blurb + NOTE, drift, color, opacity });
  };

  push(
    vault(center, superior, anterior, right, opts.halfLat + mm(8), opts.halfSup + mm(9), opts.halfAnt + mm(7)),
    "hn:calvaria",
    "Calvaria",
    "hn_bone",
    "median",
    "The skull vault over the hemispheres. It lifts off superiorly. The base is open so the brain is not sealed in.",
    superior.clone(),
    "#e4d5c2",
  );

  const baseRing = new THREE.TorusGeometry(mm(24), mm(5.5), 8, 20);
  baseRing.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), superior));
  const baseAt = origin.clone().addScaledVector(anterior, mm(-2));
  baseRing.translate(baseAt.x, baseAt.y, baseAt.z);
  push(baseRing, "hn:skull-base", "Skull base", "hn_bone", "median", "A ring around the foramen magnum. The brainstem and the vertebral arteries pass here.", inferior.clone().add(anterior.clone().multiplyScalar(-0.4)).normalize(), "#ddd0bc");

  const names = ["Atlas (C1)", "Axis (C2)", "Cervical vertebra C3", "Cervical vertebra C4", "Cervical vertebra C5", "Cervical vertebra C6", "Cervical vertebra C7"];
  names.forEach((label, i) => {
    const body = neck(6 + i * 15, -8, 0);
    const wide = i === 0 ? 16 : i === 1 ? 14 : 12;
    const spinous = body.clone().addScaledVector(anterior, mm(-14)).addScaledVector(superior, mm(i === 6 ? 4 : 2));
    push(
      merge([ball(body, mm(wide), mm(7), mm(11), 8), bar(body, spinous, mm(3.2), mm(2.2), 6)]),
      `hn:c${i + 1}`,
      label,
      "hn_bone",
      "median",
      i === 0
        ? "The atlas has no body. It carries the skull. The vertebral artery turns here to enter the foramen magnum."
        : i === 1
          ? "The axis carries the dens. Most of the head's rotation happens at the atlanto-axial joint."
          : `Vertebral body and a spinous process. The carotid bifurcation is near C4. The cricoid is near C6.`,
      anterior.clone().negate(),
      "#e7d8c4",
    );
  });

  for (const sign of [1, -1] as const) {
    const side = sign > 0 ? "right" : "left";
    const s = (n: number) => n * sign;
    const lat = right.clone().multiplyScalar(sign);
    const globe = opts.globes.find((g) => g.side === side)?.at;
    const orbitC = globe ?? at(6, opts.halfAnt * unitToMm + 16, s(30));
    const orbit = new THREE.TorusGeometry(mm(15), mm(2.4), 6, 16);
    const forward = anterior.clone();
    orbit.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward));
    orbit.translate(orbitC.x, orbitC.y, orbitC.z);
    push(orbit, `hn:orbit-wall:${side}`, "Orbital wall", "hn_bone", side, "A rim around the existing globe. The optic nerve and the extra-ocular muscles already run inside it.", lat.clone().add(anterior).normalize(), "#e6d6c3");

    const zygoA = orbitC.clone().addScaledVector(lat, mm(16)).addScaledVector(superior, mm(-4));
    const zygoB = origin.clone().addScaledVector(lat, mm(52)).addScaledVector(anterior, mm(6)).addScaledVector(superior, mm(4));
    push(bar(zygoA, zygoB, mm(3.2), mm(2.6)), `hn:zygoma:${side}`, "Zygomatic arch", "hn_bone", side, "From the orbit to the temporal bone. The masseter hangs from it. The facial nerve crosses superficial to the masseter.", lat, "#e5d4c0");

    const condyle = origin.clone().addScaledVector(lat, mm(46)).addScaledVector(anterior, mm(10)).addScaledVector(superior, mm(-2));
    const gonion = condyle.clone().addScaledVector(inferior, mm(48)).addScaledVector(anterior, mm(8)).addScaledVector(lat, mm(4));
    const chin = neck(72, 48, s(8));
    push(
      merge([bar(condyle, gonion, mm(4.2), mm(5), 7), bar(gonion, chin, mm(4.6), mm(3.4), 7)]),
      `hn:mandible:${side}`,
      "Mandible",
      "hn_bone",
      side,
      "Ramus and body. The inferior alveolar nerve is inside the body. The facial artery crosses the lower border just in front of the masseter.",
      anterior.clone().add(inferior).normalize(),
      "#e8d9c6",
    );

    push(ball(at(-8, opts.halfAnt * unitToMm * 0.15, s(18)), mm(16), mm(12), mm(14), 8), `hn:maxilla:${side}`, "Maxilla", "hn_bone", side, "The midface under the orbit. The infra-orbital nerve leaves the foramen on its anterior face.", anterior, "#e3d2be");

    const temple = at(opts.halfSup * unitToMm * 0.45, 4, s(opts.halfLat * unitToMm * 0.85));
    const coronoid = gonion.clone().addScaledVector(superior, mm(28)).addScaledVector(anterior, mm(6));
    push(merge([bar(temple, coronoid, mm(7), mm(3.5), 6), bar(temple.clone().addScaledVector(anterior, mm(10)), coronoid, mm(5), mm(2.4), 6)]), `hn:temporalis:${side}`, "Temporalis", "hn_muscle", side, "A muscle of mastication, from the temporal fossa to the coronoid. The deep temporal nerves, from V3, supply it.", lat.clone().add(superior).normalize(), "#a45a52");

    push(bar(zygoA, gonion, mm(6.5), mm(4), 7), `hn:masseter:${side}`, "Masseter", "hn_muscle", side, "From the zygomatic arch to the angle. The parotid and the facial nerve lie on its lateral surface. The facial artery is at its anterior border.", lat, "#9e534c");

    const plate = neck(18, 4, s(22));
    push(bar(plate, gonion.clone().addScaledVector(anterior, mm(-4)), mm(3.2), mm(2.2), 6), `hn:pterygoid:${side}`, "Pterygoid muscles", "hn_muscle", side, "Medial and lateral pterygoid, drawn as one strap. They sit deep to the mandibular ramus. Teaching approximation.", anterior.clone().negate(), "#8f4c46");

    push(bar(orbitC.clone().addScaledVector(superior, mm(18)), orbitC.clone().addScaledVector(lat, mm(6)), mm(1.6), mm(1.1), 5), `hn:frontalis:${side}`, "Frontalis", "hn_muscle", side, "Raises the brow. The temporal branch of the facial nerve supplies it and is superficial as it crosses the zygoma.", superior, "#c47870");
    const eyeRing = new THREE.TorusGeometry(mm(16.5), mm(1.3), 5, 14);
    eyeRing.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), anterior));
    const eyeAt = orbitC.clone().addScaledVector(anterior, mm(3));
    eyeRing.translate(eyeAt.x, eyeAt.y, eyeAt.z);
    push(eyeRing, `hn:ooculi:${side}`, "Orbicularis oculi", "hn_muscle", side, "Sphincter of the eyelids. The temporal and zygomatic branches of the facial nerve supply it.", anterior, "#c47870");

    const mouth = neck(64, 52, s(16));
    push(bar(gonion.clone().addScaledVector(anterior, mm(18)), mouth, mm(2.4), mm(1.6), 5), `hn:buccinator:${side}`, "Buccinator", "hn_muscle", side, "The cheek wall. The parotid duct crosses the masseter and pierces it opposite the second upper molar.", anterior, "#b86a62");

    const hyoidS = neck(58, 28, s(16));
    const symph = neck(70, 42, s(6));
    push(bar(symph, hyoidS, mm(2.6), mm(1.8), 5), `hn:suprahyoid:${side}`, "Suprahyoid muscles", "hn_muscle", side, "Digastric, mylohyoid, and geniohyoid, as one group. They raise the hyoid. The marginal mandibular branch crosses the digastric.", anterior.clone().add(superior).normalize(), "#b0645c");

    const mastoid = origin.clone().addScaledVector(lat, mm(48)).addScaledVector(anterior, mm(-4)).addScaledVector(superior, mm(2));
    const sternum = neck(168, 36, s(18));
    push(bar(mastoid, sternum, mm(5.5), mm(3.2), 8), `hn:scm:${side}`, "Sternocleidomastoid", "hn_muscle", side, "From the mastoid to the sternum and clavicle. It divides the neck into anterior and posterior triangles. The accessory nerve enters its deep face.", lat, "#a85850");

    const nuchal = origin.clone().addScaledVector(anterior, mm(-18)).addScaledVector(superior, mm(8)).addScaledVector(lat, mm(8));
    const trap = neck(150, -20, s(70));
    push(bar(nuchal, trap, mm(6), mm(3), 7), `hn:trapezius:${side}`, "Trapezius", "hn_muscle", side, "The upper fibers form the posterior border of the posterior triangle. The accessory nerve runs on the deep surface.", lat.clone().add(inferior).normalize(), "#9c524c");

    const tubercle = neck(48, -2, s(24));
    const rib = neck(150, 8, s(48));
    push(bar(tubercle, rib, mm(3.4), mm(2.4), 6), `hn:scalene:${side}`, "Scalene muscles", "hn_muscle", side, "Anterior and middle scalene, as one strap. The brachial plexus and the subclavian artery pass between them.", lat, "#965048");

    const smf = mastoid.clone().addScaledVector(anterior, mm(8)).addScaledVector(inferior, mm(4));
    const parotid = smf.clone().addScaledVector(anterior, mm(16)).addScaledVector(inferior, mm(14)).addScaledVector(lat, mm(6));
    push(ball(parotid, mm(16), mm(18), mm(12), 8), `hn:parotid:${side}`, "Parotid gland", "hn_gland", side, "Over the ramus and the masseter. The facial nerve splits into its five branches inside the gland. The retromandibular vein and the external carotid are deeper.", lat, "#e0b0a4");

    const facialFan: [string, string, THREE.Vector3, string][] = [
      ["temporal", "Temporal branch of facial nerve", orbitC.clone().addScaledVector(superior, mm(16)).addScaledVector(lat, mm(8)), "Crosses the zygomatic arch in the superficial fascia. A common injury during a temple or brow lift."],
      ["zygomatic", "Zygomatic branch of facial nerve", orbitC.clone().addScaledVector(lat, mm(8)).addScaledVector(inferior, mm(4)), "To orbicularis oculi. It runs just above the parotid duct."],
      ["buccal", "Buccal branch of facial nerve", mouth.clone().addScaledVector(lat, mm(6)), "Across the masseter toward the upper lip. The parotid duct travels with it."],
      ["marginal", "Marginal mandibular branch", chin.clone().addScaledVector(lat, mm(10)).addScaledVector(superior, mm(6)), "Along the lower border of the mandible. It may dip a centimeter below the border. Danger zone for a submandibular incision."],
      ["cervical", "Cervical branch of facial nerve", neck(96, 24, s(28)), "Down to platysma. It leaves the lower pole of the parotid."],
    ];
    push(bar(smf, parotid, mm(1.7), mm(1.5), 6), `hn:vii-trunk:${side}`, "Facial nerve trunk", "hn_nerve", side, "From the stylomastoid foramen into the parotid. The trunk is the landmark before the five branches divide.", lat, "#e4a898");
    for (const [id, label, tip, blurb] of facialFan) {
      push(bar(parotid, tip, mm(1.05), mm(0.7), 5), `hn:vii-${id}:${side}`, label, "hn_nerve", side, blurb, lat.clone().add(anterior).normalize(), "#e4a898");
    }

    const cavern = orbitC.clone().addScaledVector(anterior, mm(-28)).addScaledVector(lat, mm(-8)).addScaledVector(superior, mm(-6));
    push(bar(cavern, orbitC.clone().addScaledVector(superior, mm(2)), mm(1.3), mm(0.9), 5), `hn:v1:${side}`, "Ophthalmic nerve (V1)", "hn_nerve", side, "The first division of the trigeminal nerve, through the superior orbital fissure. Continues the intracranial trunk already in the specimen.", anterior, "#e4a898");
    const foramen = orbitC.clone().addScaledVector(inferior, mm(16)).addScaledVector(lat, mm(-4));
    push(bar(cavern.clone().addScaledVector(inferior, mm(4)), foramen, mm(1.35), mm(0.9), 5), `hn:v2:${side}`, "Maxillary nerve (V2)", "hn_nerve", side, "Through the foramen rotundum into the pterygopalatine fossa, then the infra-orbital canal. Danger: the infra-orbital foramen on the maxilla.", anterior, "#e4a898");
    const lingula = gonion.clone().addScaledVector(superior, mm(20)).addScaledVector(anterior, mm(2));
    push(bar(cavern.clone().addScaledVector(inferior, mm(10)), lingula, mm(1.5), mm(1), 5), `hn:v3:${side}`, "Mandibular nerve (V3)", "hn_nerve", side, "Through the foramen ovale. It gives the muscles of mastication and the inferior alveolar and lingual nerves.", anterior.clone().add(inferior).normalize(), "#e4a898");

    const hypoglossal = neck(36, 18, s(20));
    const tongue = neck(62, 40, s(8));
    push(bar(hypoglossal, tongue, mm(1.15), mm(0.8), 5), `hn:xii:${side}`, "Hypoglossal nerve, cervical", "hn_nerve", side, "Crosses the carotid bifurcation and runs forward above the hyoid, on hyoglossus, into the tongue.", anterior, "#e4a898");

    const jugular = origin.clone().addScaledVector(lat, mm(26)).addScaledVector(anterior, mm(2));
    const bifur = neck(62, 16, s(20));
    const inlet = neck(145, 14, s(16));
    push(bar(inlet, bifur, mm(2.5), mm(2.3), 7), `hn:cca:${side}`, "Common carotid artery", "hn_vessel", side, "In the carotid sheath, medial to the internal jugular vein. It divides at about C4, near the upper border of the thyroid cartilage.", lat, "#c44048");
    push(ball(bifur, mm(3.2), mm(3.4), mm(3), 8), `hn:bifurcation:${side}`, "Carotid bifurcation", "hn_vessel", side, "Common carotid into internal and external. The carotid body and sinus sit here. A surgical landmark at the upper border of the thyroid cartilage.", lat, "#d24a52");
    const skullCarotid = origin.clone().addScaledVector(lat, mm(18)).addScaledVector(anterior, mm(6)).addScaledVector(superior, mm(4));
    push(bar(bifur, skullCarotid, mm(2.1), mm(1.8), 6), `hn:ica:${side}`, "Internal carotid artery, cervical", "hn_vessel", side, "No branches in the neck. It enters the carotid canal. This segment meets the intracranial internal carotid already in the specimen.", superior.clone().add(lat).normalize(), "#c44048");
    const extTip = neck(28, 28, s(26));
    push(bar(bifur, extTip, mm(1.7), mm(1.2), 6), `hn:eca:${side}`, "External carotid artery", "hn_vessel", side, "Anterior to the internal carotid at its origin, then lateral. It supplies the face, tongue, and thyroid.", anterior.clone().add(lat).normalize(), "#c44048");
    push(bar(extTip, mouth.clone().addScaledVector(inferior, mm(6)), mm(1.15), mm(0.8), 5), `hn:facial-a:${side}`, "Facial artery", "hn_vessel", side, "Hooks over the lower border of the mandible, in front of the masseter. Pulse point. Danger for the marginal mandibular nerve, which is nearby.", anterior, "#c44048");
    push(bar(bifur.clone().addScaledVector(superior, mm(6)), tongue.clone().addScaledVector(inferior, mm(4)), mm(1), mm(0.7), 5), `hn:lingual:${side}`, "Lingual artery", "hn_vessel", side, "Second anterior branch of the external carotid. It runs deep to hyoglossus toward the tongue. The hypoglossal nerve is superficial to that muscle.", anterior, "#c44048");
    const thyroidLobe = neck(92, 24, s(16));
    push(bar(bifur.clone().addScaledVector(inferior, mm(4)), thyroidLobe, mm(1.05), mm(0.75), 5), `hn:sta:${side}`, "Superior thyroid artery", "hn_vessel", side, "First anterior branch of the external carotid. It runs with the external laryngeal nerve down to the upper pole of the thyroid.", inferior.clone().add(anterior).normalize(), "#c44048");
    const infThy = thyroidLobe.clone().addScaledVector(inferior, mm(12)).addScaledVector(lat, mm(-4));
    push(bar(neck(130, 10, s(22)), infThy, mm(1), mm(0.7), 5), `hn:ita:${side}`, "Inferior thyroid artery", "hn_vessel", side, "From the thyrocervical trunk. It crosses the recurrent laryngeal nerve at the lower pole of the thyroid. The usual danger zone in a thyroidectomy.", lat.clone().add(anterior).normalize(), "#c44048");

    push(bar(jugular, inlet.clone().addScaledVector(lat, mm(8)), mm(3.1), mm(2.6), 7), `hn:ijv:${side}`, "Internal jugular vein", "hn_vessel", side, "Leaves the jugular foramen and runs in the carotid sheath, lateral to the carotid. Deep cervical nodes lie along it.", lat, "#6e4568");

    const vagusTop = jugular.clone().addScaledVector(anterior, mm(2));
    push(bar(vagusTop, inlet.clone().addScaledVector(anterior, mm(2)), mm(1.2), mm(1), 6), `hn:x:${side}`, "Vagus nerve, cervical", "hn_nerve", side, "In the carotid sheath, between and behind the carotid and the internal jugular vein. It continues into the thorax.", inferior, "#e4a898");
    const rlnTop = neck(48, 18, s(6));
    push(bar(infThy.clone().addScaledVector(anterior, mm(-4)), rlnTop, mm(0.85), mm(0.7), 5), `hn:rln:${side}`, "Recurrent laryngeal nerve", "hn_nerve", side, side === "left" ? "Loops under the aortic arch, then ascends in the tracheoesophageal groove. It meets the inferior thyroid artery at the lower pole." : "Loops under the right subclavian artery, then ascends. It meets the inferior thyroid artery at the lower pole. Teaching course.", superior, "#e4a898");

    const acc = jugular.clone().addScaledVector(lat, mm(6)).addScaledVector(inferior, mm(8));
    const accEnd = neck(80, -4, s(48));
    push(bar(acc, accEnd, mm(1.15), mm(0.85), 6), `hn:xi:${side}`, "Accessory nerve, cervical", "hn_nerve", side, "Crosses the posterior triangle on levator scapulae, from the posterior border of sternocleidomastoid to trapezius. Superficial and easily cut.", lat, "#e4a898");

    const plexus = neck(40, 8, s(32));
    push(
      merge([bar(neck(28, 2, s(22)), plexus, mm(1), mm(0.8), 5), bar(plexus, neck(55, 16, s(40)), mm(0.9), mm(0.7), 5), bar(plexus, neck(70, 20, s(36)), mm(0.85), mm(0.65), 5)]),
      `hn:cervical-plexus:${side}`,
      "Cervical plexus",
      "hn_nerve",
      side,
      "C1–C4, on the scalenes. Cutaneous branches emerge at the posterior border of sternocleidomastoid. The phrenic nerve is its motor continuation and is already in the specimen.",
      lat,
      "#e4a898",
    );

    const roots = merge([0, 1, 2, 3, 4].map((i) => bar(neck(78 + i * 14, -2, s(22)), neck(130, 6, s(58)), mm(1.15), mm(0.9), 5)));
    push(roots, `hn:brachial:${side}`, "Brachial plexus roots", "hn_nerve", side, "C5–T1 roots leave the transverse foramina region and pass between the scalenes toward the axilla. The trunks form at the lateral border of the anterior scalene.", lat, "#e4a898");

    push(ball(neck(78, 36, s(22)), mm(10), mm(8), mm(8), 8), `hn:submandibular:${side}`, "Submandibular gland", "hn_gland", side, "Under the mandible, over the digastric. The facial artery grooves its deep face. The lingual nerve and the submandibular duct are medial.", anterior.clone().add(lat).normalize(), "#e4b4a8");

    push(ball(thyroidLobe, mm(12), mm(16), mm(9), 8), `hn:thyroid:${side}`, "Thyroid gland", "hn_gland", side, "Lobe on the side of the trachea, from the thyroid cartilage toward the 5th tracheal ring. The recurrent laryngeal nerve and the inferior thyroid artery meet at the lower pole.", anterior, "#c45a58");
    push(ball(thyroidLobe.clone().addScaledVector(anterior, mm(-6)).addScaledVector(superior, mm(6)), mm(2.2), mm(2.2), mm(2), 6), `hn:para-sup:${side}`, "Superior parathyroid", "hn_gland", side, "Usually on the posterior thyroid, near the upper pole, above the inferior thyroid artery. Teaching site, not a patient localization.", anterior.clone().negate(), "#d7a090");
    push(ball(thyroidLobe.clone().addScaledVector(anterior, mm(-5)).addScaledVector(inferior, mm(8)), mm(2.2), mm(2.2), mm(2), 6), `hn:para-inf:${side}`, "Inferior parathyroid", "hn_gland", side, "More variable. Often near the lower pole, close to where the inferior thyroid artery and the recurrent laryngeal nerve cross.", anterior.clone().negate(), "#d7a090");

    const sheath = bar(jugular.clone().addScaledVector(inferior, mm(6)), inlet.clone().addScaledVector(lat, mm(4)), mm(7), mm(6), 8);
    push(sheath, `hn:sheath:${side}`, "Carotid sheath", "hn_viscera", side, "The fascia around the common and internal carotid, the internal jugular vein, and the vagus. The ansa cervicalis is on its anterior face.", lat, "#f0e6dc", 0.22);
  }

  const hyoidL = neck(56, 30, -16);
  const hyoidR = neck(56, 30, 16);
  const hyoidM = neck(54, 34, 0);
  push(merge([bar(hyoidL, hyoidM, mm(2.2), mm(2), 6), bar(hyoidR, hyoidM, mm(2.2), mm(2), 6)]), "hn:hyoid", "Hyoid", "hn_bone", "median", "A free bone at about C3. Suprahyoid muscles above, infrahyoid below. The hypoglossal nerve runs just above it.", anterior, "#eadcc8");

  push(bar(neck(58, 30, 0), neck(110, 26, 0), mm(3.2), mm(2.4), 6), "hn:infrahyoid", "Infrahyoid muscles", "hn_muscle", "median", "Sternohyoid, sternothyroid, and thyrohyoid, as one midline strap. They steady the hyoid and the larynx.", anterior, "#b0645c");
  push(bar(neck(20, -6, 0), neck(120, -6, 0), mm(3.6), mm(3), 6), "hn:longus", "Longus colli", "hn_muscle", "median", "Prevertebral muscle on the front of the cervical bodies. The retropharyngeal space is in front of it.", anterior.clone().negate(), "#965048");

  const nasal = neck(8, (opts.halfAnt * unitToMm) * 0.2 + 8, 0);
  const aperture = new THREE.TorusGeometry(mm(8), mm(1.8), 5, 12);
  aperture.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), anterior));
  aperture.translate(nasal.x, nasal.y, nasal.z);
  push(aperture, "hn:nasal", "Nasal aperture", "hn_bone", "median", "The anterior opening of the nasal cavity, between the maxillae. No septum or turbinates are modeled.", anterior, "#e6d6c3");

  const mouthRing = new THREE.TorusGeometry(mm(14), mm(1.5), 5, 14);
  mouthRing.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), anterior));
  const mouthAt = neck(66, 54, 0);
  mouthRing.translate(mouthAt.x, mouthAt.y, mouthAt.z);
  push(mouthRing, "hn:ooris", "Orbicularis oris", "hn_muscle", "median", "The sphincter of the lips. Buccal and marginal mandibular branches reach it.", anterior, "#c47870");

  const thyroidCart = merge([
    bar(neck(46, 26, -14), neck(46, 32, 0), mm(2.4), mm(2), 6),
    bar(neck(46, 26, 14), neck(46, 32, 0), mm(2.4), mm(2), 6),
    bar(neck(46, 26, -14), neck(70, 22, -12), mm(2.2), mm(2), 5),
    bar(neck(46, 26, 14), neck(70, 22, 12), mm(2.2), mm(2), 5),
  ]);
  push(thyroidCart, "hn:larynx", "Larynx", "hn_viscera", "median", "Thyroid cartilage and a cricoid ring, from about C4 to C6. The cervical trachea already in the airway layer continues below the cricoid.", anterior, "#f0e4d4");
  const cricoid = new THREE.TorusGeometry(mm(8), mm(1.8), 6, 12);
  cricoid.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), superior));
  const cricoidAt = neck(72, 20, 0);
  cricoid.translate(cricoidAt.x, cricoidAt.y, cricoidAt.z);
  push(cricoid, "hn:cricoid", "Cricoid cartilage", "hn_viscera", "median", "A complete ring at about C6. The only complete cartilaginous ring in the airway. The esophagus begins behind it.", anterior, "#f3e7d8");

  push(bar(nasal.clone().addScaledVector(anterior, mm(-12)), neck(150, 8, 0), mm(8), mm(6), 8), "hn:pharynx", "Pharynx", "hn_viscera", "median", "Nasopharynx to hypopharynx, behind the nasal cavity, the mouth, and the larynx. The retropharyngeal space is behind this tube.", anterior, "#e7b8ae");
  push(bar(neck(74, 8, 0), neck(160, 2, 0), mm(5), mm(4.2), 7), "hn:esophagus", "Cervical esophagus", "hn_viscera", "median", "Begins behind the cricoid and runs in front of the vertebral bodies. The recurrent laryngeal nerves are in the grooves on either side.", anterior.clone().multiplyScalar(0.3).add(inferior).normalize(), "#e8b4aa");
  push(
    ball(neck(40, 2, 0), mm(6), mm(28), mm(4), 6),
    "hn:retropharyngeal",
    "Retropharyngeal space",
    "hn_viscera",
    "median",
    "A thin space between the pharynx and the prevertebral fascia. Infection here can track into the mediastinum. Drawn as a marker, not a true cavity.",
    anterior.clone().negate(),
    "#f4ece4",
    0.2,
  );

  const isthmus = ball(neck(96, 28, 0), mm(8), mm(6), mm(5), 8);
  push(isthmus, "hn:isthmus", "Thyroid isthmus", "hn_gland", "median", "Crosses the front of the 2nd to 4th tracheal rings. The pyramidal lobe, when present, climbs from here.", anterior, "#c45a58");

  return parts;
}
