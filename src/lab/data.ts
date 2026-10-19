export const CAT_IDS = [
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
  "spinal_cord",
  "cerebellum",
  "arteries",
  "veins_sinuses",
  "cranial_nerves",
  "globe",
  "orbit",
] as const;

export type CatId = (typeof CAT_IDS)[number];

export type CatMeta = {
  id: CatId;
  label: string;
  group: string;
  blurb: string;
  color: string;
  opacity: number;
  visible: boolean;
  explode: number;
  rough: number;
  transparent: boolean;
};

export const CATEGORIES: CatMeta[] = [
  {
    id: "dura",
    label: "Dura mater",
    group: "Meninges",
    blurb:
      "Outer fibrous sac, derived from this specimen’s silhouette. Dense irregular connective tissue, pain-sensitive, continuous with the falx and the tentorium. Retract it to open the field.",
    color: "#c2b39a",
    opacity: 0.2,
    visible: true,
    explode: 2.4,
    rough: 0.72,
    transparent: true,
  },
  {
    id: "arachnoid",
    label: "Arachnoid mater",
    group: "Meninges",
    blurb:
      "The arachnoid bridges sulci. This shell is the outer wall of the subarachnoid space: cerebrospinal fluid and the larger vessels run deep to it, while pia stays on the gyri.",
    color: "#d4e3e4",
    opacity: 0.14,
    visible: true,
    explode: 1.8,
    rough: 0.18,
    transparent: true,
  },
  {
    id: "meninges_dura",
    label: "Falx & tentorium",
    group: "Meninges",
    blurb:
      "Dural reflections. The falx cerebri hangs in the longitudinal fissure; the tentorium cerebelli roofs the posterior fossa and leaves the tentorial notch for the midbrain.",
    color: "#cbb8a0",
    opacity: 0.42,
    visible: true,
    explode: 0.9,
    rough: 0.64,
    transparent: true,
  },
  {
    id: "cortex",
    label: "Cerebral cortex",
    group: "Telencephalon",
    blurb:
      "Neocortex folded into gyri and sulci, plus archicortex (hippocampus). Six layers are not separate shells in a real brain — open a tissue window on a gyrus to study the ribbon in place.",
    color: "#c9a394",
    opacity: 1,
    visible: true,
    explode: 0.72,
    rough: 0.48,
    transparent: false,
  },
  {
    id: "white_matter",
    label: "Hemispheric white matter",
    group: "Telencephalon",
    blurb:
      "Centrum semiovale and the large commissures (corpus callosum, anterior commissure, fornix). Myelinated axons under the cortex. Fade the hemispheres or cut a section to read them.",
    color: "#f3eee4",
    opacity: 1,
    visible: true,
    explode: 0.28,
    rough: 0.58,
    transparent: false,
  },
  {
    id: "tracts",
    label: "Named fiber tracts",
    group: "Telencephalon",
    blurb:
      "Population-average pathways (corticospinal, arcuate, radiations, and others). Placement is about 7 mm, for study, not for a surgical plan.",
    color: "#efe4cc",
    opacity: 1,
    visible: false,
    explode: 0.72,
    rough: 0.5,
    transparent: false,
  },
  {
    id: "deep_grey",
    label: "Deep nuclei",
    group: "Deep gray",
    blurb:
      "Striatum, pallidum, accumbens, septal nuclei, amygdala groups, subthalamic nucleus. The internal and external pallidum are split for teaching and are approximate.",
    color: "#c48b7e",
    opacity: 1,
    visible: true,
    explode: 0.95,
    rough: 0.5,
    transparent: false,
  },
  {
    id: "diencephalon",
    label: "Diencephalon",
    group: "Deep gray",
    blurb:
      "Thalamic nuclear groups, metathalamus, epithalamus, hypothalamus, and pituitary. Thalamic groups are registered teaching volumes, not a stained series.",
    color: "#d0a58c",
    opacity: 1,
    visible: true,
    explode: 0.62,
    rough: 0.5,
    transparent: false,
  },
  {
    id: "ventricles",
    label: "Ventricles & CSF",
    group: "Fluid spaces",
    blurb:
      "CSF cast: lateral ventricles, third ventricle, cerebral aqueduct, fourth ventricle, plus choroid plexus and septum pellucidum. Fluid is produced by the choroid and leaves the fourth ventricle into the subarachnoid space.",
    color: "#c9e3e0",
    opacity: 0.48,
    visible: true,
    explode: 0.2,
    rough: 0.12,
    transparent: true,
  },
  {
    id: "brainstem",
    label: "Brainstem",
    group: "Stem & cerebellum",
    blurb:
      "Midbrain, pons, and medulla, with colliculi, nuclei of the ocular and facial nerves, and the olive. The aqueduct tunnels the midbrain.",
    color: "#d2c0b2",
    opacity: 1,
    visible: true,
    explode: 1.45,
    rough: 0.52,
    transparent: false,
  },
  {
    id: "spinal_cord",
    label: "Spinal cord",
    group: "Stem & cerebellum",
    blurb:
      "Continuation of the medulla through the cervical and lumbar enlargements to the conus. Pia-covered white matter, with the anterior spinal artery in the ventral fissure, posterior spinal arteries, and the rootlets that become the cauda equina.",
    color: "#eadccf",
    opacity: 1,
    visible: true,
    explode: 1.15,
    rough: 0.36,
    transparent: false,
  },
  {
    id: "cerebellum",
    label: "Cerebellum",
    group: "Stem & cerebellum",
    blurb:
      "Hemispheres, vermis, and flocculus. Cortex here is three-layered — molecular, Purkinje, granule — not the six-layer neocortex. Open the cerebellar tissue window to see that order.",
    color: "#d2a898",
    opacity: 1,
    visible: true,
    explode: 1.35,
    rough: 0.5,
    transparent: false,
  },
  {
    id: "arteries",
    label: "Arteries",
    group: "Vessels & nerves",
    blurb:
      "Internal carotids, vertebrals, basilar artery, and the circle of Willis with the cerebral and cerebellar arteries. The shared wall brightens with each systole.",
    color: "#9c3434",
    opacity: 1,
    visible: true,
    explode: 0.34,
    rough: 0.32,
    transparent: false,
  },
  {
    id: "veins_sinuses",
    label: "Venous sinuses",
    group: "Vessels & nerves",
    blurb:
      "Dural venous sinuses: superior and inferior sagittal, straight, transverse, sigmoid, cavernous, and petrosal. They drain toward the jugular bulbs. Walls are dura, not ordinary vein.",
    color: "#3e4c68",
    opacity: 0.92,
    visible: true,
    explode: 0.85,
    rough: 0.4,
    transparent: false,
  },
  {
    id: "cranial_nerves",
    label: "Cranial nerves",
    group: "Vessels & nerves",
    blurb:
      "Nerves III–XII as they leave the brainstem, including branches that run out toward the face. Hidden in the intact view so the specimen stays a brain, not a skull-base dissection.",
    color: "#e4d4ae",
    opacity: 1,
    visible: false,
    explode: 0.4,
    rough: 0.46,
    transparent: false,
  },
  {
    id: "globe",
    label: "Globe",
    group: "Orbit & visual pathway",
    blurb:
      "The eyeball, without lids or facial skin. A pale sclera over a darker choroid, with the intraorbital optic nerve continuing CN II onto the posterior pole.",
    color: "#efe6df",
    opacity: 1,
    visible: false,
    explode: 0.7,
    rough: 0.4,
    transparent: false,
  },
  {
    id: "orbit",
    label: "Orbit",
    group: "Orbit & visual pathway",
    blurb:
      "Extra-ocular muscles and a little orbital fat. The four recti run from the orbital apex to the globe; the obliques are simplified. Hidden until the orbit is opened.",
    color: "#8f4e44",
    opacity: 1,
    visible: false,
    explode: 0.85,
    rough: 0.55,
    transparent: false,
  },
];

export const CAT_BY_ID: Record<CatId, CatMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CatId, CatMeta>;

export const GROUPS = ["Meninges", "Telencephalon", "Deep gray", "Fluid spaces", "Stem & cerebellum", "Vessels & nerves", "Orbit & visual pathway"];

const PEARLS: Record<string, string> = {
  "precentral gyrus":
    "Primary motor cortex (Brodmann 4). Layer V holds Betz cells whose axons form the corticospinal tract. The body is mapped as a motor homunculus, with the leg medial and the face lateral.",
  "postcentral gyrus":
    "Primary somatosensory cortex (Brodmann 3, 1, 2). Layer IV is thick here — thalamocortical fibers from the ventral posterior nucleus arrive in it.",
  "central sulcus":
    "Rolandic sulcus. It separates frontal from parietal lobe and motor from sensory cortex. The artery of the central sulcus is a branch of the middle cerebral artery.",
  calcarine:
    "The calcarine sulcus splits the upper (cuneus) and lower (lingual) banks of primary visual cortex. Layer IV is thick and carries the stria of Gennari.",
  cuneus:
    "Upper bank of the calcarine sulcus, primary visual cortex (V1). The lower visual field maps here. Open the tissue window to see a granular layer IV.",
  "lingual gyrus":
    "Lower bank of the calcarine sulcus and neighboring ventral visual cortex. The upper visual field maps onto this bank of V1.",
  hippocampus:
    "Archicortex, not six-layer neocortex. A dense pyramidal band (CA fields) and the dentate gyrus sit in the medial temporal lobe, in the floor of the inferior horn.",
  "corpus callosum":
    "The largest commissure: rostrum, genu, body, and splenium. It connects homologous neocortex. The genu carries forceps minor; the splenium, forceps major.",
  fornix:
    "The output arch of the hippocampus. Crura, body, and columns run under the corpus callosum to the mammillary bodies.",
  "anterior commissure":
    "A compact bundle in the anterior wall of the third ventricle, crossing olfactory and temporal fibers.",
  putamen:
    "Lateral part of the lentiform nucleus and, with the caudate and accumbens, the striatum. It is the input stage of the basal ganglia.",
  "caudate nucleus":
    "C-shaped striatal nucleus. The head bulges into the lateral ventricle; the tail follows the inferior horn to the amygdala.",
  "globus pallidus external":
    "External segment of the pallidum. Intrinsic basal-ganglia loop, between striatum and the subthalamic nucleus.",
  "globus pallidus internal":
    "Internal segment. One of the two output nuclei of the basal ganglia, with the substantia nigra pars reticulata. The teaching split is approximate.",
  "subthalamic nucleus":
    "Lens under the thalamus. Target of the indirect pathway and a common deep-brain stimulation site. Placement here is approximate.",
  "nucleus accumbens":
    "Ventral striatum, where caudate and putamen meet under the anterior limb of the internal capsule.",
  "basolateral complex":
    "The large sensory input group of the amygdala, continuous with temporal cortex. It assigns salience, including fear learning.",
  thalamus:
    "The thalamic complex is a set of nuclear groups relaying to cortex. Sensory, motor, association, and nonspecific groups are shown as teaching volumes.",
  hypothalamus:
    "Walls and floor of the third ventricle. It runs autonomic, endocrine, and homeostatic functions and continues into the pituitary stalk.",
  "mamillary body":
    "Mammillary bodies sit in the posterior hypothalamus and receive the fornix. They are part of the Papez circuit.",
  "lateral ventricle":
    "C-shaped CSF space in each hemisphere: anterior horn, body, atrium, posterior horn, and inferior horn. The caudate lies along its lateral wall.",
  "third ventricle":
    "Midline slit in the diencephalon. Choroid plexus in its roof adds CSF, which leaves through the cerebral aqueduct.",
  "fourth ventricle":
    "Diamond-shaped space between pons and medulla in front and the cerebellum behind. CSF exits through the midline and lateral apertures.",
  "aqueduct of midbrain":
    "Cerebral aqueduct of Sylvius, the narrow channel through the midbrain. It is the common site of noncommunicating hydrocephalus.",
  "choroid plexus":
    "Vascular tuft of pia and ependyma that secretes most of the cerebrospinal fluid. It pulses with its arterial supply.",
  "corticospinal tract":
    "From layer V of motor and premotor cortex, through the corona radiata, posterior limb of the internal capsule, cerebral peduncle, basis pontis, and the medullary pyramid.",
  "arcuate fasciculus":
    "A long association bundle arching from frontal to temporal language cortex. This path is a population average.",
  "middle cerebral":
    "The middle cerebral artery continues the internal carotid into the lateral fissure and supplies most of the lateral hemisphere.",
  "anterior cerebral":
    "Runs in the interhemispheric fissure over the corpus callosum and supplies the medial hemispheres, including the leg areas.",
  "anterior communicating":
    "Short anastomosis between the anterior cerebral arteries. It closes the anterior half of the circle of Willis and is a common aneurysm site.",
  "posterior communicating":
    "Links the internal carotid to the posterior cerebral artery, completing the circle of Willis.",
  "posterior cerebral":
    "Terminal branch of the basilar artery. Supplies the occipital lobe and the medial temporal lobe, including much of the hippocampal arterial supply.",
  "basilar artery":
    "Formed by the two vertebral arteries on the ventral pons. It ends as the posterior cerebral arteries.",
  "internal carotid":
    "Enters the cranial cavity through the petrous temporal bone and divides into the anterior and middle cerebral arteries after giving the ophthalmic and communicating branches.",
  "superior sagittal":
    "The superior sagittal sinus runs in the attached edge of the falx and receives cortical veins and CSF from arachnoid granulations.",
  "transverse sinus":
    "Runs in the attached edge of the tentorium from the confluence toward the sigmoid sinus.",
  "cavernous sinus":
    "A venous plexus on either side of the sella. The internal carotid artery and cranial nerves III, IV, V1, V2, and VI pass through its walls or lumen.",
  falx: "Sickle of dura in the longitudinal fissure. Its upper edge contains the superior sagittal sinus; its lower free edge, the inferior sagittal sinus.",
  tentorium:
    "Dural roof of the posterior fossa. The midbrain passes through the tentorial notch. Herniation here compresses the cerebral peduncle and the oculomotor nerve.",
  "substantia nigra":
    "Pigmented nucleus in the ventral midbrain. The pars compacta supplies dopamine to the striatum; the pars reticulata is a basal-ganglia output.",
  "inferior colliculus":
    "Caudal pair of the tectal quadrigemina. A midbrain relay for hearing, on the way to the medial geniculate body.",
  "superior colliculus":
    "Rostral tectum. It orients gaze and attention using retinal and cortical input.",
  olive:
    "Inferior olivary nucleus of the medulla. Climbing fibers from here reach Purkinje cells of the opposite cerebellum.",
  "medulla oblongata":
    "Caudal brainstem. Pyramids in front, olives lateral, and the vital respiratory and vasomotor circuitry in the tegmentum.",
  "spinal cord":
    "The cord begins at the pyramidal decussation and ends as the conus near the L1 vertebral level. Cervical and lumbar enlargements supply the limbs. A deep anterior median fissure carries the anterior spinal artery; the posterior median sulcus is shallower.",
  "cauda equina":
    "Lumbar and sacral rootlets that have already left the cord and keep descending inside the lumbar cistern to their exit foramina. The cord itself has ended.",
  "rootlets":
    "Ventral rootlets leave the anterolateral sulcus, dorsal rootlets the posterolateral sulcus. They stay paired and become longer as the segments descend.",
  midbrain:
    "Mesencephalon: cerebral peduncles, substantia nigra, tegmentum, and the colliculi, with the aqueduct between tectum and tegmentum.",
  pons: "Ventral pons is a mass of pontine nuclei and transverse fibers entering the middle cerebellar peduncles. The tegmentum keeps the cranial-nerve nuclei.",
  flocculus:
    "A small cerebellar lobe of the vestibulocerebellum, concerned with eye movements and balance, sitting near the cerebellopontine angle.",
  insula:
    "Cortex buried in the lateral fissure, under the frontal, parietal, and temporal opercula. It is involved in interoception and taste.",
  "optic nerve":
    "Cranial nerve II is a tract of the central nervous system, not a peripheral nerve. It runs from the posterior globe through the orbit and the optic canal to the chiasm.",
  globe:
    "The eyeball, about 24 mm across. Sclera in front of a vascular choroid. The optic nerve enters just medial to the posterior pole. Lids and facial skin are not part of this specimen.",
  "medial rectus":
    "Adducts the eye. It is the thickest rectus and runs along the medial orbital wall from the annulus of Zinn to the globe.",
  "lateral rectus":
    "Abducts the eye and is supplied by the abducens nerve. It follows the lateral orbital wall from the apex to the globe.",
  "superior rectus":
    "Elevates, adducts, and intorts the eye. It runs along the orbital roof, above the optic nerve.",
  "inferior rectus":
    "Depresses, adducts, and extorts the eye. It lies along the orbital floor.",
  orbit:
    "The bony orbit is not shown. What is here is the globe, the extra-ocular muscles, a little fat, and the optic nerve that continues back to the chiasm and, after the radiation, to the calcarine cortex.",
  "orbital fat":
    "Lobules of fat fill the orbit around the muscles and the optic nerve. They are simplified so the globe and the recti stay readable.",
  cornea:
    "The clear anterior bulge of the globe. The iris and the lids are not part of this specimen.",
  "optic disc":
    "The start of the optic nerve, slightly nasal to the posterior pole. Axons leave the retina here. There are no photoreceptors on the disc.",
  "chiasmatic decussation":
    "Nasal fibers cross in the chiasm. Temporal fibers stay on their own side. A lesion here removes the outer half of each visual field.",
  "oculomotor filaments":
    "The oculomotor nerve supplies the superior, inferior, and medial recti and the inferior oblique. The lateral rectus and the superior oblique are not its muscles.",
  "trochlear filaments":
    "The trochlear nerve supplies only the superior oblique. It is the only cranial nerve that crosses completely and leaves the brainstem dorsally.",
  "abducens filaments":
    "The abducens nerve supplies the lateral rectus, which abducts the eye.",
};

export type TourId = "visual" | "corticospinal";

export type TourStop = {
  title: string;
  note: string;
  label: string;
  side?: "left" | "right" | "median";
  at?: number;
};

export const TOURS: Record<TourId, { title: string; stops: TourStop[] }> = {
  visual: {
    title: "Visual pathway",
    stops: [
      {
        title: "Globe",
        label: "Globe",
        side: "left",
        note: "The left globe. The optic disc, just nasal of the posterior pole, is where the optic nerve begins.",
      },
      {
        title: "Optic nerve",
        label: "Optic nerve (II), intraorbital",
        side: "left",
        note: "CN II crosses the orbit from the disc to the optic canal. It is a tract of the central nervous system, wrapped in meninges.",
      },
      {
        title: "Chiasm",
        label: "Chiasmatic decussation",
        note: "Nasal fibers cross. Temporal fibers stay lateral. Cutting the chiasm takes the outer half of both visual fields.",
      },
      {
        title: "Optic tract",
        label: "Optic tract",
        side: "left",
        note: "The left tract carries the right half of the visual field, from both eyes.",
      },
      {
        title: "Optic radiation",
        label: "Optic radiation",
        side: "left",
        note: "From the lateral geniculate, the radiation sweeps through the temporal and parietal lobes to the occipital cortex. This path is a population average.",
      },
      {
        title: "Calcarine cortex",
        label: "Cuneus",
        side: "left",
        note: "The upper bank, the cuneus, maps the lower visual field. The lower bank is the lingual gyrus.",
      },
    ],
  },
  corticospinal: {
    title: "Corticospinal tract",
    stops: [
      {
        title: "Precentral gyrus",
        label: "Precentral gyrus",
        side: "left",
        note: "Primary motor cortex. The axons of layer V leave here as the corticospinal tract.",
      },
      {
        title: "Internal capsule",
        label: "Corticospinal tract",
        side: "left",
        at: 0.72,
        note: "The fibers gather through the corona radiata and the posterior limb of the internal capsule.",
      },
      {
        title: "Cerebral peduncle",
        label: "Base of peduncle",
        side: "left",
        note: "In the midbrain the tract occupies the middle third of the cerebral peduncle.",
      },
      {
        title: "Pyramid",
        label: "Pyramid of medulla oblongata",
        side: "left",
        note: "The pyramid on the ventral medulla. Most of the fibers cross at its lower end.",
      },
      {
        title: "Spinal cord",
        label: "Spinal cord",
        at: 0.9,
        note: "Crossed fibers run in the lateral cord and end on motor neurons of the opposite anterior horn.",
      },
    ],
  },
};

const PEARL_LIST = Object.entries(PEARLS).sort((a, b) => b[0].length - a[0].length);

export function pearlFor(label: string, cat: CatId): string {
  const hay = label.toLowerCase();
  for (const [key, text] of PEARL_LIST) {
    const at = hay.indexOf(key);
    if (at < 0) continue;
    const before = at === 0 || !/[a-z]/.test(hay[at - 1]!);
    const after = at + key.length >= hay.length || !/[a-z]/.test(hay[at + key.length]!);
    if (before && after) return text;
  }
  return CAT_BY_ID[cat]?.blurb ?? "";
}

export type SampleId = "m1" | "v1" | "cb" | "hip";

export type Stratum = {
  name: string;
  tint: string;
  from: number;
  to: number;
  cells: "none" | "small-pyramid" | "pyramid" | "betz" | "granule" | "fusiform" | "purkinje" | "glia";
  count: number;
};

export type Recipe = {
  id: SampleId;
  title: string;
  note: string;
  want: { label: string; side: "left" | "right" | "median"; cat?: CatId };
  fallbackCat?: CatId;
  internal: boolean;
  strata: Stratum[];
};

export const RECIPES: Recipe[] = [
  {
    id: "m1",
    title: "Left precentral gyrus",
    note: "Agranular motor cortex. Layer IV is thin. The large cells in layer V are Betz cells.",
    want: { label: "Precentral gyrus", side: "left", cat: "cortex" },
    internal: false,
    strata: [
      { name: "I · Molecular", tint: "#efe4dc", from: 0.9, to: 1, cells: "glia", count: 8 },
      { name: "II · External granular", tint: "#e4c8ba", from: 0.78, to: 0.9, cells: "small-pyramid", count: 12 },
      { name: "III · External pyramidal", tint: "#d7b0a2", from: 0.58, to: 0.78, cells: "pyramid", count: 14 },
      { name: "IV · Internal granular", tint: "#d2b48a", from: 0.5, to: 0.58, cells: "granule", count: 6 },
      { name: "V · Internal pyramidal", tint: "#c48478", from: 0.28, to: 0.5, cells: "betz", count: 10 },
      { name: "VI · Multiform", tint: "#b89088", from: 0.08, to: 0.28, cells: "fusiform", count: 10 },
    ],
  },
  {
    id: "v1",
    title: "Left cuneus (V1)",
    note: "Granular visual cortex. Layer IV is expanded and split by the pale stria of Gennari.",
    want: { label: "Cuneus", side: "left", cat: "cortex" },
    internal: false,
    strata: [
      { name: "I · Molecular", tint: "#efe4dc", from: 0.92, to: 1, cells: "glia", count: 6 },
      { name: "II · External granular", tint: "#e4c8ba", from: 0.82, to: 0.92, cells: "small-pyramid", count: 10 },
      { name: "III · External pyramidal", tint: "#d7b0a2", from: 0.66, to: 0.82, cells: "pyramid", count: 10 },
      { name: "IV · Granular + Gennari", tint: "#e7d7b0", from: 0.4, to: 0.66, cells: "granule", count: 26 },
      { name: "V · Internal pyramidal", tint: "#c48478", from: 0.24, to: 0.4, cells: "pyramid", count: 8 },
      { name: "VI · Multiform", tint: "#b89088", from: 0.08, to: 0.24, cells: "fusiform", count: 8 },
    ],
  },
  {
    id: "cb",
    title: "Left cerebellar cortex",
    note: "Three cortical layers, not six. Purkinje cells form a single row between the molecular layer and the dense granule layer.",
    want: { label: "Superior semilunar lobule", side: "left", cat: "cerebellum" },
    fallbackCat: "cerebellum",
    internal: false,
    strata: [
      { name: "Molecular layer", tint: "#f0e0d6", from: 0.62, to: 1, cells: "glia", count: 10 },
      { name: "Purkinje row", tint: "#e7c2b0", from: 0.5, to: 0.62, cells: "purkinje", count: 7 },
      { name: "Granule layer", tint: "#c9a090", from: 0.22, to: 0.5, cells: "granule", count: 28 },
      { name: "Cerebellar white matter", tint: "#f3eee4", from: 0.02, to: 0.22, cells: "none", count: 0 },
    ],
  },
  {
    id: "hip",
    title: "Left hippocampus",
    note: "Archicortex. One prominent pyramidal band, not a neocortical six-layer ribbon. The window is opened inside the medial temporal lobe.",
    want: { label: "Hippocampus", side: "left", cat: "cortex" },
    internal: true,
    strata: [
      { name: "Stratum radiatum / moleculare", tint: "#efe4dc", from: 0.62, to: 1, cells: "glia", count: 8 },
      { name: "Pyramidal band (CA)", tint: "#d7b0a2", from: 0.38, to: 0.62, cells: "pyramid", count: 16 },
      { name: "Polymorphic / alveus", tint: "#f3eee4", from: 0.04, to: 0.38, cells: "fusiform", count: 8 },
    ],
  },
];

export const RECIPE_BY_ID: Record<SampleId, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
) as Record<SampleId, Recipe>;
