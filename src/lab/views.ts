import { CAT_IDS, type CatId } from "./data";

export const VIEW_IDS = ["brain", "neck", "chest", "nerves", "everything"] as const;

export type ViewId = (typeof VIEW_IDS)[number];

export type LabView = {
  id: ViewId;
  title: string;
  show: CatId[];
  fade: Partial<Record<CatId, number>>;
  explode: number;
  home: boolean;
  frame: CatId[];
  aim: [number, number, number];
};

const BRAIN: CatId[] = [
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
];

export const VIEWS: LabView[] = [
  {
    id: "brain",
    title: "Brain",
    show: BRAIN,
    fade: {},
    explode: 0,
    home: true,
    frame: BRAIN,
    aim: [0.92, 0.48, 0.36],
  },
  {
    id: "neck",
    title: "Neck",
    show: ["hn_bone", "hn_muscle", "hn_vessel", "hn_nerve", "hn_gland", "hn_viscera", "airway", "cranial_nerves"],
    fade: { hn_bone: 0.42 },
    explode: 0.28,
    home: false,
    frame: ["hn_bone", "hn_muscle", "hn_vessel", "hn_nerve", "hn_gland", "hn_viscera", "airway"],
    aim: [1, 0.22, 0.04],
  },
  {
    id: "chest",
    title: "Chest",
    show: ["heart", "lungs", "pleura", "airway", "diaphragm", "pericardium", "cage"],
    fade: { pleura: 0.2, pericardium: 0.4, cage: 0.55 },
    explode: 0.42,
    home: false,
    frame: ["heart", "lungs", "pleura", "airway", "diaphragm", "pericardium", "cage"],
    aim: [1, 0.32, 0.1],
  },
  {
    id: "nerves",
    title: "Nerves",
    show: ["cortex", "white_matter", "cerebellum", "brainstem", "spinal_cord", "cranial_nerves", "spinal_nerves", "peripheral", "sympathetic"],
    fade: { cortex: 0.16, white_matter: 0.1, cerebellum: 0.22 },
    explode: 0.2,
    home: false,
    frame: ["brainstem", "spinal_cord", "cranial_nerves", "spinal_nerves", "peripheral", "sympathetic"],
    aim: [0.72, 0.46, 0.28],
  },
  {
    id: "everything",
    title: "Everything",
    show: [...CAT_IDS],
    fade: {},
    explode: 0,
    home: false,
    frame: [...CAT_IDS],
    aim: [0.82, 0.4, 0.22],
  },
];

export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((item) => [item.id, item])) as Record<ViewId, LabView>;
