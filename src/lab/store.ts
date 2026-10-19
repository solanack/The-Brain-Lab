import { create } from "zustand";
import { CAT_IDS, CATEGORIES, type CatId, type SampleId } from "./data";

export type Meta = {
  key: string;
  label: string;
  side: "left" | "right" | "median";
  region: string;
  cat: CatId;
  ta2: string;
  blurb: string;
};

export type Quality = "low" | "medium" | "high";

export type Axis = "axial" | "coronal" | "sagittal";

export type Intent =
  | { type: "home" }
  | { type: "part"; key: string }
  | { type: "sample" }
  | null;

type Optics = {
  distanceMm: number;
  approach: string;
  count: number;
  unitToMm: number;
};

const opacity0 = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.opacity])) as Record<CatId, number>;
const visible0 = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.visible])) as Record<CatId, boolean>;

export type LabState = {
  ready: boolean;
  progress: number;
  status: string;
  error: string | null;
  directory: Meta[];
  visible: Record<CatId, boolean>;
  opacity: Record<CatId, number>;
  piaOn: boolean;
  isolated: CatId | "selection" | null;
  hidden: Record<string, boolean>;
  excised: string[];
  selected: string | null;
  query: string;
  side: "both" | "left" | "right";
  explode: number;
  retract: number;
  sectionOn: boolean;
  axis: Axis;
  depth: number;
  measuring: boolean;
  measure: [number, number, number][];
  mode: "specimen" | "parcellation";
  sample: SampleId;
  tissue: boolean;
  mag: number;
  strataOn: Record<string, boolean>;
  light: { key: number; fill: number; rim: number; trans: number; temp: number };
  quality: Quality;
  hr: number;
  turntable: boolean;
  intent: Intent;
  intentNonce: number;
  optics: Optics;
  brief: boolean;
  sheet: "layers" | "dossier" | "field" | null;
  publish: (directory: Meta[], optics: Partial<Optics>) => void;
  setProgress: (progress: number, status: string) => void;
  fail: (error: string) => void;
  patch: (partial: Partial<LabState>) => void;
  toggleCat: (id: CatId) => void;
  setOpacity: (id: CatId, value: number) => void;
  select: (key: string | null) => void;
  toggleHidden: (key: string) => void;
  toggleExcise: (key: string) => void;
  pushMeasure: (point: [number, number, number]) => void;
  request: (intent: Intent) => void;
  reassemble: () => void;
  setOptics: (optics: Partial<Optics>) => void;
};

const fresh = {
  visible: { ...visible0 },
  opacity: { ...opacity0 },
  piaOn: true,
  isolated: null as CatId | "selection" | null,
  hidden: {} as Record<string, boolean>,
  excised: [] as string[],
  selected: null as string | null,
  query: "",
  side: "both" as const,
  explode: 0,
  retract: 0.15,
  sectionOn: false,
  axis: "axial" as Axis,
  depth: 0.42,
  measuring: false,
  measure: [] as [number, number, number][],
  mode: "specimen" as const,
  tissue: false,
  mag: 2.4,
};

export const useLab = create<LabState>((set, get) => ({
  ready: false,
  progress: 0,
  status: "Opening the sterile field",
  error: null,
  directory: [],
  ...fresh,
  sample: "m1",
  strataOn: {},
  light: { key: 0.95, fill: 0.38, rim: 0.28, trans: 0.12, temp: 0.72 },
  quality: "medium",
  hr: 68,
  turntable: false,
  intent: null,
  intentNonce: 0,
  optics: { distanceMm: 0, approach: "—", count: 0, unitToMm: 1000 },
  brief: true,
  sheet: null,
  publish: (directory, optics) =>
    set({
      directory,
      ready: true,
      progress: 1,
      status: "Specimen on the field",
      optics: { ...get().optics, ...optics },
    }),
  setProgress: (progress, status) => set({ progress, status }),
  fail: (error) => set({ error, status: "The specimen could not be opened" }),
  patch: (partial) => set(partial),
  toggleCat: (id) => set({ visible: { ...get().visible, [id]: !get().visible[id] } }),
  setOpacity: (id, value) => set({ opacity: { ...get().opacity, [id]: value } }),
  select: (key) => set({ selected: key, sheet: key ? "dossier" : get().sheet }),
  toggleHidden: (key) => set({ hidden: { ...get().hidden, [key]: !get().hidden[key] } }),
  toggleExcise: (key) => {
    const cur = get().excised;
    set({ excised: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
  },
  pushMeasure: (point) => {
    const cur = get().measure;
    set({ measure: cur.length >= 2 ? [point] : [...cur, point] });
  },
  request: (intent) => set({ intent, intentNonce: get().intentNonce + 1 }),
  reassemble: () =>
    set({
      ...fresh,
      visible: { ...visible0 },
      opacity: { ...opacity0 },
      intent: { type: "home" },
      intentNonce: get().intentNonce + 1,
    }),
  setOptics: (optics) => {
    const prev = get().optics;
    const distanceMm = Math.round(optics.distanceMm ?? prev.distanceMm);
    const approach = optics.approach ?? prev.approach;
    const count = optics.count ?? prev.count;
    const unitToMm = optics.unitToMm ?? prev.unitToMm;
    if (distanceMm === Math.round(prev.distanceMm) && approach === prev.approach && count === prev.count && unitToMm === prev.unitToMm) return;
    set({ optics: { ...prev, distanceMm, approach, count, unitToMm } });
  },
}));

export function catVisibleDefault(id: string): id is CatId {
  return (CAT_IDS as readonly string[]).includes(id);
}
