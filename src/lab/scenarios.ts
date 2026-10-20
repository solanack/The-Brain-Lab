import type { CatId } from "./data";

export const SCENARIO_IDS = ["reach", "see", "hear", "fear", "exit"] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export type ModuleStop = {
  title: string;
  note: string;
  label?: string;
  cat?: CatId;
  side?: "left" | "right" | "median";
  at?: number;
  branch?: boolean;
  from?: number;
  link?: -1;
  span?: boolean;
  tip?: "anterior" | "inferior" | "lateral";
  bias?: "anterior";
  loss?: CutLoss;
};

export type CutLoss = {
  stops?: number[];
  labels?: string[];
  cats?: CatId[];
  both?: boolean;
};

export type Scenario = {
  id: ScenarioId;
  title: string;
  note: string;
  labels: string[];
  cats: CatId[];
  show: CatId[];
  fade: Partial<Record<CatId, number>>;
  stops: ModuleStop[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "reach",
    title: "Reaching",
    note: "Reaching for an object. Primary motor cortex initiates the movement; the cerebellum corrects it; the corticospinal tract carries it out through the ventral rootlets. The specimen stops there.",
    labels: ["precentral gyrus", "putamen", "caudate nucleus", "corticospinal tract", "base of peduncle", "pyramid of medulla oblongata", "spinal cord"],
    cats: ["cerebellum", "spinal_cord"],
    show: ["cortex", "cerebellum", "deep_grey", "brainstem", "spinal_cord", "tracts"],
    fade: { cortex: 0.16, white_matter: 0.14, cerebellum: 0.9, brainstem: 0.75, spinal_cord: 1, tracts: 1, deep_grey: 0.85, dura: 0.04, arachnoid: 0.04 },
    stops: [
      {
        title: "Precentral gyrus",
        label: "Precentral gyrus",
        side: "left",
        note: "Primary motor cortex. Layer V starts the reach. A cut here stops the command.",
        loss: {
          stops: [1, 2, 3, 4, 5, 6],
          labels: ["corticospinal tract", "base of peduncle", "pyramid of medulla oblongata", "spinal cord", "rootlets"],
          cats: ["cerebellum", "spinal_cord"],
        },
      },
      {
        title: "Cerebellum",
        cat: "cerebellum",
        branch: true,
        from: 0,
        note: "The cerebellum compares the intended reach with the limb and corrects it. This loop does not continue into the cord.",
      },
      {
        title: "Internal capsule",
        label: "Corticospinal tract",
        side: "left",
        at: 0.72,
        note: "The fibers gather through the corona radiata and the posterior limb of the internal capsule. The putamen and caudate sequence the movement.",
        loss: { stops: [3, 4, 5, 6], labels: ["base of peduncle", "pyramid of medulla oblongata", "spinal cord", "rootlets"], cats: ["spinal_cord"] },
      },
      {
        title: "Cerebral peduncle",
        label: "Base of peduncle",
        side: "left",
        note: "In the midbrain the tract occupies the middle third of the cerebral peduncle.",
        loss: { stops: [4, 5, 6], labels: ["pyramid of medulla oblongata", "spinal cord", "rootlets"], cats: ["spinal_cord"] },
      },
      {
        title: "Pyramid",
        label: "Pyramid of medulla oblongata",
        side: "left",
        note: "The pyramid on the ventral medulla. A cut here darkens the cord and the rootlets below it.",
        loss: { stops: [5, 6], labels: ["spinal cord", "rootlets"], cats: ["spinal_cord"] },
      },
      {
        title: "Spinal cord",
        label: "Spinal cord",
        at: 0.9,
        note: "Crossed fibers run in the lateral cord and end on motor neurons of the opposite anterior horn.",
        loss: { stops: [6], labels: ["rootlets"] },
      },
      {
        title: "Ventral rootlets",
        label: "Rootlets & cauda equina",
        at: 0.84,
        bias: "anterior",
        note: "The axons leave through the ventral rootlets. This specimen stops here. The spinal nerve and the limb are not shown.",
      },
    ],
  },
  {
    id: "see",
    title: "Seeing",
    note: "Seeing an object. The image travels from the globe through the chiasm and the radiation to primary visual cortex.",
    labels: ["globe", "optic disc", "optic nerve", "chiasmatic decussation", "optic tract", "optic radiation", "calcarine sulcus", "cuneus", "lingual gyrus"],
    cats: [],
    show: ["cortex", "globe", "orbit", "cranial_nerves", "tracts", "brainstem"],
    fade: { cortex: 0.16, white_matter: 0.1, cerebellum: 0.08, brainstem: 0.4, globe: 1, orbit: 0.85, cranial_nerves: 1, tracts: 0.9, dura: 0.04, arachnoid: 0.04 },
    stops: [
      {
        title: "Globe",
        label: "Globe",
        side: "left",
        note: "The left globe. A cut here blinds that eye. The other eye still reaches the cortex.",
        loss: { stops: [1], labels: ["optic nerve"] },
      },
      {
        title: "Optic nerve",
        label: "Optic nerve (II), intraorbital",
        side: "left",
        note: "CN II crosses the orbit from the disc to the optic canal. A cut here blinds that eye only. The other eye still reaches the cortex.",
      },
      {
        title: "Chiasm",
        label: "Chiasmatic decussation",
        note: "Nasal fibers cross. Temporal fibers stay lateral. A cut here darkens the radiation and the calcarine cortex on both sides.",
        loss: { stops: [3, 4, 5], both: true, labels: ["optic tract", "optic radiation", "cuneus", "lingual gyrus", "calcarine sulcus"] },
      },
      {
        title: "Optic tract",
        label: "Optic tract",
        side: "left",
        note: "The left tract carries the right half of the visual field, from both eyes.",
        loss: { stops: [4, 5], labels: ["optic radiation", "cuneus", "lingual gyrus", "calcarine sulcus"] },
      },
      {
        title: "Optic radiation",
        label: "Optic radiation",
        side: "left",
        note: "From the lateral geniculate, the radiation sweeps to the occipital cortex.",
        loss: { stops: [5], labels: ["cuneus", "lingual gyrus", "calcarine sulcus"] },
      },
      {
        title: "Calcarine cortex",
        label: "Cuneus",
        side: "left",
        note: "The upper bank maps the lower visual field. The lower bank is the lingual gyrus.",
      },
    ],
  },
  {
    id: "hear",
    title: "Hearing",
    note: "Hearing speech. The inferior colliculus relays the sound; primary auditory cortex and the surrounding temporal cortex interpret it.",
    labels: ["inferior colliculus", "transverse temporal gyri", "superior temporal gyrus"],
    cats: [],
    show: ["cortex", "brainstem"],
    fade: { cortex: 0.34, brainstem: 0.9, cerebellum: 0.12, white_matter: 0.2, dura: 0.04, arachnoid: 0.04 },
    stops: [
      {
        title: "Inferior colliculus",
        label: "Inferior colliculus",
        side: "left",
        note: "A midbrain relay for hearing, on the way to the medial geniculate.",
        loss: { stops: [1, 2], labels: ["transverse temporal gyri", "superior temporal gyrus"] },
      },
      {
        title: "Primary auditory cortex",
        label: "Transverse temporal gyri",
        side: "left",
        note: "Heschl's gyri. This is where the sound first reaches the cortex.",
        loss: { stops: [2], labels: ["superior temporal gyrus"] },
      },
      {
        title: "Superior temporal gyrus",
        label: "Superior temporal gyrus",
        side: "left",
        note: "The surrounding temporal cortex begins to interpret speech.",
      },
    ],
  },
  {
    id: "fear",
    title: "Fear",
    note: "Sudden fear or threat. The amygdala assigns salience; the nucleus accumbens and the cingulate cortex support the response.",
    labels: ["basolateral complex", "nucleus accumbens", "cingulate gyrus"],
    cats: [],
    show: ["cortex", "deep_grey"],
    fade: { cortex: 0.4, deep_grey: 1, white_matter: 0.16, cerebellum: 0.1, dura: 0.04, arachnoid: 0.04 },
    stops: [
      {
        title: "Amygdala",
        label: "Basolateral complex",
        side: "left",
        note: "The basolateral amygdala assigns emotional salience, including threat.",
        loss: { stops: [1, 2], labels: ["nucleus accumbens", "cingulate gyrus"] },
      },
      {
        title: "Nucleus accumbens",
        label: "Nucleus accumbens",
        side: "left",
        note: "The ventral striatum supports the motivated response that follows.",
        loss: { stops: [2], labels: ["cingulate gyrus"] },
      },
      {
        title: "Cingulate cortex",
        label: "Cingulate gyrus",
        side: "left",
        note: "Cingulate cortex weighs the response and its context.",
      },
    ],
  },
  {
    id: "exit",
    title: "Exits",
    note: "The last station inside this specimen. Nerves stop at a muscle, a foramen, or the rootlets. Nothing beyond the skull is shown.",
    labels: [
      "olfactory nerve",
      "oculomotor nerve",
      "oculomotor filaments",
      "trochlear nerve",
      "trochlear filaments",
      "abducens nerve",
      "abducens filaments",
      "superior rectus",
      "inferior rectus",
      "medial rectus",
      "lateral rectus",
      "inferior oblique",
      "superior oblique",
      "trigeminal nerve",
      "facial nerve",
      "vestibular nerve",
      "vagus nerve",
      "accessory nerve",
      "hypoglossal nerve",
      "rootlets",
    ],
    cats: [],
    show: ["cranial_nerves", "orbit", "globe", "brainstem", "spinal_cord"],
    fade: {
      cortex: 0.12,
      white_matter: 0.08,
      cerebellum: 0.08,
      brainstem: 0.55,
      cranial_nerves: 1,
      orbit: 1,
      globe: 0.75,
      spinal_cord: 0.72,
      dura: 0.04,
      arachnoid: 0.04,
    },
    stops: [
      {
        title: "Olfactory nerve",
        label: "Olfactory nerve (I)",
        side: "left",
        link: -1,
        span: true,
        tip: "anterior",
        note: "Cranial nerve I leaves through the cribriform plate. The nose is not part of this specimen.",
      },
      {
        title: "Oculomotor nerve",
        label: "Oculomotor nerve (III)",
        side: "left",
        link: -1,
        span: true,
        tip: "anterior",
        note: "Cranial nerve III leaves the midbrain and enters the orbit. A cut here darkens only the muscles it supplies.",
        loss: {
          stops: [2],
          labels: ["superior rectus", "inferior rectus", "medial rectus", "inferior oblique", "oculomotor filaments"],
        },
      },
      {
        title: "Extra-ocular muscles",
        label: "Superior rectus",
        side: "left",
        note: "III ends on the superior, inferior, and medial recti and the inferior oblique. The specimen stops at the muscle.",
      },
      {
        title: "Trochlear nerve",
        label: "Trochlear nerve (IV)",
        side: "left",
        link: -1,
        span: true,
        tip: "anterior",
        note: "Cranial nerve IV is the only nerve that leaves the brainstem dorsally. It supplies one muscle.",
        loss: { stops: [4], labels: ["superior oblique", "trochlear filaments"] },
      },
      {
        title: "Superior oblique",
        label: "Superior oblique",
        side: "left",
        note: "IV ends on the superior oblique. Nothing beyond the orbit is shown.",
      },
      {
        title: "Trigeminal nerve",
        label: "Trigeminal nerve (V)",
        side: "left",
        link: -1,
        span: true,
        tip: "anterior",
        note: "The three divisions leave the skull. The face beyond them is not shown.",
      },
      {
        title: "Abducens nerve",
        label: "Abducens nerve (VI)",
        side: "left",
        link: -1,
        span: true,
        tip: "anterior",
        note: "Cranial nerve VI runs from the pontomedullary junction into the orbit.",
        loss: { stops: [7], labels: ["lateral rectus", "abducens filaments"] },
      },
      {
        title: "Lateral rectus",
        label: "Lateral rectus",
        side: "left",
        note: "VI ends on the lateral rectus, which abducts the eye.",
      },
      {
        title: "Facial nerve",
        label: "Facial nerve (VII)",
        side: "left",
        link: -1,
        span: true,
        tip: "lateral",
        note: "Cranial nerve VII leaves through the temporal bone. The muscles of the face are not shown.",
      },
      {
        title: "Vestibular nerve",
        label: "Vestibular nerve",
        side: "left",
        link: -1,
        span: true,
        tip: "lateral",
        note: "Part of cranial nerve VIII. It ends at the internal acoustic meatus here. The ear is not shown.",
      },
      {
        title: "Vagus nerve",
        label: "Vagus nerve (X)",
        side: "left",
        link: -1,
        span: true,
        tip: "inferior",
        note: "Cranial nerve X leaves through the jugular foramen. The neck and the organs are not shown.",
      },
      {
        title: "Accessory nerve",
        label: "Accessory nerve (XI)",
        side: "left",
        link: -1,
        span: true,
        tip: "inferior",
        note: "Cranial nerve XI leaves through the jugular foramen. The neck muscles are not shown.",
      },
      {
        title: "Hypoglossal nerve",
        label: "Hypoglossal nerve (XII)",
        side: "left",
        link: -1,
        span: true,
        tip: "inferior",
        note: "Cranial nerve XII leaves through the hypoglossal canal. The tongue is not shown.",
      },
      {
        title: "Ventral rootlets",
        label: "Rootlets & cauda equina",
        link: -1,
        at: 0.84,
        bias: "anterior",
        note: "Spinal motor axons leave through the ventral rootlets. The specimen stops at the foramen. The limb is not shown.",
      },
    ],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((item) => [item.id, item])) as Record<ScenarioId, Scenario>;

export function circuitLinks(stops: ModuleStop[]) {
  const links: [number, number][] = [];
  let prev = -1;
  stops.forEach((stop, index) => {
    if (stop.branch) {
      links.push([stop.from ?? 0, index]);
      return;
    }
    if (prev >= 0 && stop.link !== -1) links.push([prev, index]);
    prev = index;
  });
  return links;
}

export function lostToCut(scenario: Scenario, index: number, label: string, cat: CatId, side: "left" | "right" | "median") {
  const loss = scenario.stops[index]?.loss;
  if (!loss) return false;
  if (loss.cats?.includes(cat)) return true;
  if (!loss.labels?.length) return false;
  const cutSide = scenario.stops[index]?.side;
  const sideOk = loss.both || side === "median" || !cutSide || side === cutSide;
  if (!sideOk) return false;
  const hay = label.toLowerCase();
  for (const key of loss.labels) {
    const at = hay.indexOf(key);
    if (at < 0) continue;
    const before = at === 0 || !/[a-z0-9]/.test(hay[at - 1] ?? "");
    const after = at + key.length >= hay.length || !/[a-z0-9]/.test(hay[at + key.length] ?? "");
    if (before && after) return true;
  }
  return false;
}

function labelListed(label: string, keys: string[]) {
  const hay = label.toLowerCase();
  for (const key of keys) {
    const at = hay.indexOf(key);
    if (at < 0) continue;
    const before = at === 0 || !/[a-z0-9]/.test(hay[at - 1] ?? "");
    const after = at + key.length >= hay.length || !/[a-z0-9]/.test(hay[at + key.length] ?? "");
    if (before && after) return true;
  }
  return false;
}

function stopNames(stop: ModuleStop, label: string, cat: CatId) {
  if (stop.label) return labelListed(label, [stop.label.toLowerCase()]);
  return stop.cat === cat;
}

export function scenarioFocus(label: string, cat: CatId, side: "left" | "right" | "median", scenario: Scenario) {
  if (!scenarioHit(label, cat, scenario)) return false;
  if (side === "median") return true;
  if (scenario.stops.some((stop) => stop.loss?.both && labelListed(label, (stop.loss.labels ?? []).map((item) => item.toLowerCase())))) return true;
  const named = scenario.stops.filter((stop) => stopNames(stop, label, cat));
  const labeled = named.filter((stop) => stop.label);
  const use = labeled.length ? labeled : named;
  if (use.some((stop) => !stop.side)) return true;
  const sides = use.map((stop) => stop.side).filter((item): item is "left" | "right" => item === "left" || item === "right");
  if (sides.length) return sides.includes(side);
  const tour = scenario.stops.map((stop) => stop.side).filter((item): item is "left" | "right" => item === "left" || item === "right");
  if (!tour.length) return true;
  return tour.includes(side);
}

export function scenarioHit(label: string, cat: CatId, scenario: Scenario) {
  if (scenario.cats.includes(cat)) return true;
  const hay = label.toLowerCase();
  for (const key of scenario.labels) {
    const at = hay.indexOf(key);
    if (at < 0) continue;
    const before = at === 0 || !/[a-z0-9]/.test(hay[at - 1] ?? "");
    const after = at + key.length >= hay.length || !/[a-z0-9]/.test(hay[at + key.length] ?? "");
    if (before && after) return true;
  }
  return false;
}
