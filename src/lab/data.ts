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
  "veins",
  "heart",
  "pericardium",
  "lungs",
  "pleura",
  "diaphragm",
  "airway",
  "cranial_nerves",
  "spinal_nerves",
  "peripheral",
  "sympathetic",
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
    opacity: 0,
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
    color: "#e7c4bc",
    opacity: 0,
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
    color: "#d4a394",
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
    color: "#e8a898",
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
    color: "#e39d94",
    opacity: 1,
    visible: true,
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
    color: "#e8b0a4",
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
    id: "veins",
    label: "Veins",
    group: "Vessels & nerves",
    blurb:
      "Systemic veins: jugulars, subclavians, venae cavae, azygos, iliacs, and femorals. They return blood to the right atrium. The pulse is the same heart rate as the arteries, later and smaller.",
    color: "#6a3858",
    opacity: 1,
    visible: true,
    explode: 0.4,
    rough: 0.38,
    transparent: false,
  },
  {
    id: "heart",
    label: "Heart",
    group: "Vessels & nerves",
    blurb:
      "Four chambers in the middle mediastinum. The right ventricle wraps the front, the left forms the apex, and fat sits in the grooves with the coronary arteries. Ventricles shorten and twist on the heart-rate beat. Atria contract just before that.",
    color: "#8a3034",
    opacity: 1,
    visible: true,
    explode: 1,
    rough: 0.46,
    transparent: false,
  },
  {
    id: "pericardium",
    label: "Pericardium",
    group: "Chest",
    blurb: "The sac around the heart. It lifts away on Explode, the way the dura lifts off the brain.",
    color: "#efe4d8",
    opacity: 0.38,
    visible: true,
    explode: 1.4,
    rough: 0.62,
    transparent: true,
  },
  {
    id: "lungs",
    label: "Lungs",
    group: "Chest",
    blurb: "Left and right lungs, each lobe separate so Explode can open the fissures. The right lung has three lobes. The left has two.",
    color: "#c48e88",
    opacity: 1,
    visible: true,
    explode: 1.1,
    rough: 0.74,
    transparent: false,
  },
  {
    id: "pleura",
    label: "Pleura",
    group: "Chest",
    blurb: "The sac around each lung. Explode lifts it off the lobes, the way the pericardium lifts off the heart.",
    color: "#f4ece4",
    opacity: 0.14,
    visible: true,
    explode: 1.35,
    rough: 0.5,
    transparent: true,
  },
  {
    id: "diaphragm",
    label: "Diaphragm",
    group: "Chest",
    blurb: "The muscle floor of the chest. The domes rise under the lungs and flatten as the lungs fill. The phrenic nerves end here.",
    color: "#b86a64",
    opacity: 1,
    visible: true,
    explode: 0.8,
    rough: 0.52,
    transparent: false,
  },
  {
    id: "airway",
    label: "Airway",
    group: "Chest",
    blurb: "Trachea, main bronchi, and a lobar bronchus into each lobe. Cartilage, not a vessel.",
    color: "#efe4d6",
    opacity: 1,
    visible: true,
    explode: 0.7,
    rough: 0.42,
    transparent: false,
  },
  {
    id: "cranial_nerves",
    label: "Cranial nerves",
    group: "Vessels & nerves",
    blurb:
      "Nerves III–XII as they leave the brainstem, including branches that run out toward the face. Hidden in the intact view so the specimen stays a brain, not a skull-base dissection.",
    color: "#e4a898",
    opacity: 1,
    visible: true,
    explode: 0.4,
    rough: 0.46,
    transparent: false,
  },
  {
    id: "spinal_nerves",
    label: "Spinal nerves",
    group: "Peripheral nervous system",
    blurb:
      "Thirty-one pairs. Dorsal and ventral roots meet at the dorsal root ganglion, then the mixed spinal nerve leaves toward its foramen. Cervical, thoracic, lumbar, sacral, and the coccygeal nerve are all here.",
    color: "#e4a898",
    opacity: 1,
    visible: true,
    explode: 0.55,
    rough: 0.48,
    transparent: false,
  },
  {
    id: "peripheral",
    label: "Named peripheral nerves",
    group: "Peripheral nervous system",
    blurb:
      "The plexuses and the nerves they form: phrenic, brachial plexus and its five terminal nerves, intercostals, lumbar plexus, femoral and obturator, sciatic, tibial, common fibular, and pudendal. Paths are life-sized and schematic, not a surgical plan.",
    color: "#e4a898",
    opacity: 1,
    visible: true,
    explode: 0.7,
    rough: 0.46,
    transparent: false,
  },
  {
    id: "sympathetic",
    label: "Sympathetic trunk",
    group: "Peripheral nervous system",
    blurb:
      "The paired sympathetic chain, from the neck to the sacrum, with rami to the spinal nerves. Ganglia sit on the chain. This is the thoracolumbar outflow of the autonomic system.",
    color: "#e4a898",
    opacity: 1,
    visible: true,
    explode: 0.35,
    rough: 0.5,
    transparent: false,
  },
  {
    id: "globe",
    label: "Globe",
    group: "Orbit & visual pathway",
    blurb:
      "The eyeball, without lids or facial skin. A pale sclera over a darker choroid, with the intraorbital optic nerve continuing CN II onto the posterior pole.",
    color: "#f0d0c8",
    opacity: 1,
    visible: true,
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
    visible: true,
    explode: 0.85,
    rough: 0.55,
    transparent: false,
  },
];

export const CAT_BY_ID: Record<CatId, CatMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CatId, CatMeta>;

export const GROUPS = ["Meninges", "Telencephalon", "Deep gray", "Fluid spaces", "Stem & cerebellum", "Vessels & nerves", "Peripheral nervous system", "Orbit & visual pathway", "Chest"];

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
  heart:
    "The ventricles eject on each systole. That is the same beat the arteries flash on. The atria contract a little earlier. Raise Explode to separate every chamber.",
  "left ventricle":
    "Thick-walled chamber. It forms the apex and ejects into the aorta.",
  "right ventricle":
    "Thin anterior crescent. It ejects into the pulmonary trunk.",
  "left atrium":
    "Posterior chamber. The four pulmonary veins enter it.",
  "right atrium":
    "Receives the superior and inferior venae cavae.",
  "interventricular septum":
    "Muscle wall between the ventricles, continuous with the left ventricular wall.",
  "interatrial septum":
    "Wall between the atria.",
  auricle:
    "The atrial appendage. The right auricle overlaps the front of the atrium. The left is a small ear on the left.",
  "aortic valve":
    "Three cusps at the mouth of the aorta. They open when the left ventricle ejects and close when it relaxes, so blood cannot fall back.",
  "pulmonary valve":
    "Three cusps at the mouth of the pulmonary trunk. They open with the right ventricle and close in diastole.",
  mitral:
    "The left atrioventricular valve, two leaflets. Chordae run to papillary muscles so the valve cannot flip into the atrium during systole.",
  tricuspid:
    "The right atrioventricular valve, three leaflets. It closes as the right ventricle contracts.",
  "sinus node":
    "The pacemaker, in the right atrium at the entrance of the superior vena cava. It fires first on each beat.",
  "atrioventricular node":
    "On the floor of the right atrium. It delays the impulse, then passes it to the bundle in the septum.",
  bundle:
    "The atrioventricular bundle runs down the interventricular septum and splits toward each ventricle.",
  "coronary sinus":
    "The vein of the heart. It lies in the posterior atrioventricular groove and opens into the right atrium.",
  pericardium:
    "A fibrous sac around the heart. Explode lifts it off the surface.",
  lung:
    "Spongy organs on either side of the heart. The right lung has three lobes. The left has two and a cardiac notch. Pulmonary arteries enter the hilum. Pulmonary veins leave it.",
  "upper lobe":
    "The right upper lobe sits above the horizontal fissure. The left upper lobe includes the lingula.",
  "middle lobe":
    "The right middle lobe is the anterior wedge between the horizontal and oblique fissures. The left lung has no middle lobe.",
  "lower lobe":
    "The lower lobe sits below the oblique fissure, on the diaphragm. It is the part that moves most with a quiet breath.",
  pleura:
    "A closed sac around the lung. The outer layer lines the chest. The inner layer coats the lobes. Explode lifts the sac off.",
  diaphragm:
    "The main muscle of breathing. It contracts and flattens as the lungs expand. The phrenic nerve, from C3 to C5, supplies it.",
  trachea:
    "The airway from the neck to the carina, where it divides into the main bronchi.",
  bronchi:
    "The right main bronchus is short and steep. The left is longer and crosses under the aortic arch. Each divides into lobar bronchi.",
  papillary:
    "Muscles on the inner ventricular wall. Chordae tendineae run from them to the atrioventricular valves.",
  aorta:
    "The ascending aorta leaves the left ventricle, arches over the pulmonary trunk, and descends along the spine. Its wall pulses with every ventricular ejection.",
  "vena cava":
    "The superior vena cava brings head and arm blood into the right atrium. The inferior vena cava brings the body below the diaphragm.",
  jugular:
    "The internal jugular vein runs in the carotid sheath and joins the subclavian vein to form the brachiocephalic vein.",
  azygos:
    "The azygos vein ascends on the right of the vertebral column and empties into the superior vena cava.",
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
  "spinal nerves":
    "Each spinal nerve is mixed. The dorsal root ganglion sits just distal to the junction of dorsal and ventral roots. There are 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, and 1 coccygeal pair.",
  phrenic:
    "The phrenic nerve is the main motor supply of the diaphragm. It is formed from C3–C5 and descends through the neck and the mediastinum.",
  sympathetic:
    "The sympathetic trunk is a paravertebral chain. White and gray rami join it to the spinal nerves. Greater, lesser, and least splanchnic nerves leave it for the abdominal ganglia.",
  "inferior frontal":
    "The inferior frontal gyrus. On the dominant side its posterior part is Broca's area, which plans the movements of speech.",
  "brachial plexus":
    "Ventral rami of C5–T1. Roots, trunks, divisions, and cords sit between the neck and the axilla, then form the nerves of the upper limb.",
  "median nerve":
    "From the medial and lateral cords. It runs the anterior arm and forearm and supplies most of the forearm flexors and the thenar muscles.",
  "ulnar nerve":
    "From the medial cord. It passes behind the medial epicondyle and supplies the intrinsic hand muscles and the medial hand.",
  "radial nerve":
    "From the posterior cord. It wraps the humerus in the spiral groove and supplies the extensors of the elbow, wrist, and fingers.",
  musculocutaneous:
    "From the lateral cord. It supplies coracobrachialis, biceps, and brachialis, then continues as the lateral cutaneous nerve of the forearm.",
  axillary:
    "From the posterior cord. A short nerve around the surgical neck of the humerus to deltoid and teres minor.",
  intercostal:
    "Ventral rami of the thoracic nerves. They run in the costal groove and supply the intercostal muscles and the skin of the trunk.",
  "lumbar plexus":
    "Ventral rami of L1–L4, in the psoas. It forms the femoral, obturator, and lateral femoral cutaneous nerves.",
  femoral:
    "The femoral nerve leaves the lumbar plexus and passes under the inguinal ligament into the anterior thigh. It supplies the quadriceps and the skin of the anterior thigh.",
  obturator:
    "From the lumbar plexus, through the obturator canal, to the medial thigh adductors.",
  sciatic:
    "The largest nerve, from the sacral plexus (L4–S3). It leaves the pelvis through the greater sciatic foramen and runs down the posterior thigh.",
  tibial:
    "The tibial division of the sciatic nerve stays posterior in the leg and enters the foot behind the medial malleolus.",
  fibular:
    "The common fibular division winds around the neck of the fibula. A common site of compression.",
  pudendal:
    "From S2–S4. It leaves the pelvis and supplies the perineum and the external anal and urethral sphincters.",
  vagus:
    "Cranial nerve X continues past the skull through the neck and the thorax. It is the main parasympathetic supply to the organs of the chest and abdomen.",
  "cervical plexus":
    "Ventral rami of C1–C4. Cutaneous branches supply the neck and the scalp behind the ear. The phrenic nerve is its motor continuation to the diaphragm.",
  "lesser occipital":
    "Sensory branch of the cervical plexus. It supplies skin on the side of the head, behind the ear.",
  "great auricular":
    "The largest cutaneous branch of the cervical plexus. It supplies skin over the parotid and the ear.",
  supraclavicular:
    "Medial, intermediate, and lateral supraclavicular nerves. They supply skin over the clavicle and the upper chest.",
  "ansa cervicalis":
    "A loop of C1–C3 fibers on the carotid sheath. It supplies the infrahyoid strap muscles.",
  "long thoracic":
    "From C5–C7, on the surface of serratus anterior. Injury wings the scapula.",
  suprascapular:
    "From the upper trunk. It passes through the suprascapular notch to supraspinatus and infraspinatus.",
  thoracodorsal:
    "From the posterior cord. It supplies latissimus dorsi.",
  "lateral femoral":
    "Purely sensory, from L2–L3. It enters the thigh under the lateral inguinal ligament. Compression here is meralgia paresthetica.",
  iliohypogastric:
    "From L1. It supplies the skin above the pubis and the lower abdominal wall.",
  genitofemoral:
    "From L1–L2. The genital branch enters the inguinal canal. The femoral branch supplies skin over the femoral triangle.",
  saphenous:
    "The terminal sensory branch of the femoral nerve. It follows the great saphenous vein to the medial foot.",
  "sacral plexus":
    "L4–S4, on the piriformis. It forms the sciatic nerve and the gluteal, pudendal, and posterior cutaneous nerves.",
  "superior gluteal":
    "L4–S1. It leaves the pelvis above piriformis and supplies gluteus medius, gluteus minimus, and tensor fasciae latae.",
  "inferior gluteal":
    "L5–S2. It leaves below piriformis and supplies gluteus maximus.",
  "posterior femoral":
    "Sensory nerve to the skin of the posterior thigh and the popliteal fossa.",
  sural:
    "A sensory nerve on the back of the leg, usually joined by contributions from the tibial and common fibular nerves.",
  "superficial fibular":
    "Supplies the fibularis muscles and most of the skin on the dorsum of the foot.",
  "deep fibular":
    "Supplies tibialis anterior and the toe extensors, then the skin of the first web space.",
  "greater splanchnic":
    "Preganglionic sympathetic fibers from about T5–T9. They pierce the diaphragm and synapse in the celiac ganglion.",
  "lesser splanchnic":
    "Preganglionic sympathetic fibers from about T10–T11 to the superior mesenteric ganglion.",
  "least splanchnic":
    "The smallest thoracic splanchnic nerve, usually from T12, to the aorticorenal ganglion.",
  "pelvic splanchnic":
    "Parasympathetic fibers from S2–S4. They are the sacral outflow to the hindgut and the pelvic organs.",
  trigeminal:
    "The trigeminal ganglion sits in Meckel’s cave. Distal to it the nerve is three divisions: ophthalmic, maxillary, and mandibular.",
  hypoglossal:
    "Cranial nerve XII. It leaves the hypoglossal canal and runs forward to the muscles of the tongue.",
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
  "olfactory nerve":
    "Cranial nerve I. It leaves the skull through the cribriform plate. The nose is not part of this specimen.",
  "oculomotor nerve":
    "Cranial nerve III leaves the midbrain and enters the orbit. It ends on the extra-ocular muscles. The lids are not shown.",
  "trochlear nerve":
    "Cranial nerve IV. It reaches only the superior oblique. This specimen stops at that muscle.",
  "abducens nerve":
    "Cranial nerve VI. It reaches only the lateral rectus. This specimen stops at that muscle.",
  "trigeminal nerve":
    "Cranial nerve V. The ganglion and the ophthalmic, maxillary, and mandibular divisions continue a short way beyond the skull.",
  "facial nerve":
    "Cranial nerve VII after the stylomastoid foramen, before the facial muscles, which are not shown.",
  "vestibular nerve":
    "Part of cranial nerve VIII. It ends at the internal acoustic meatus in this specimen. The ear is not shown.",
  "vagus nerve":
    "Cranial nerve X leaves through the jugular foramen and continues through the neck into the thorax.",
  "accessory nerve":
    "Cranial nerve XI crosses the posterior triangle toward sternocleidomastoid and trapezius. Those muscles are not shown.",
  "hypoglossal nerve":
    "Cranial nerve XII leaves the hypoglossal canal and runs forward. The tongue is not shown.",
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
      { name: "I · Molecular", tint: "#f0c8bc", from: 0.9, to: 1, cells: "glia", count: 8 },
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
      { name: "I · Molecular", tint: "#f0c8bc", from: 0.92, to: 1, cells: "glia", count: 6 },
      { name: "II · External granular", tint: "#e4c8ba", from: 0.82, to: 0.92, cells: "small-pyramid", count: 10 },
      { name: "III · External pyramidal", tint: "#d7b0a2", from: 0.66, to: 0.82, cells: "pyramid", count: 10 },
      { name: "IV · Granular + Gennari", tint: "#e4c4b0", from: 0.4, to: 0.66, cells: "granule", count: 26 },
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
      { name: "Molecular layer", tint: "#f0c8bc", from: 0.62, to: 1, cells: "glia", count: 10 },
      { name: "Purkinje row", tint: "#e7c2b0", from: 0.5, to: 0.62, cells: "purkinje", count: 7 },
      { name: "Granule layer", tint: "#c9a090", from: 0.22, to: 0.5, cells: "granule", count: 28 },
      { name: "Cerebellar white matter", tint: "#e8a898", from: 0.02, to: 0.22, cells: "none", count: 0 },
    ],
  },
  {
    id: "hip",
    title: "Left hippocampus",
    note: "Archicortex. One prominent pyramidal band, not a neocortical six-layer ribbon. The window is opened inside the medial temporal lobe.",
    want: { label: "Hippocampus", side: "left", cat: "cortex" },
    internal: true,
    strata: [
      { name: "Stratum radiatum / moleculare", tint: "#f0c8bc", from: 0.62, to: 1, cells: "glia", count: 8 },
      { name: "Pyramidal band (CA)", tint: "#d7b0a2", from: 0.38, to: 0.62, cells: "pyramid", count: 16 },
      { name: "Polymorphic / alveus", tint: "#e8a898", from: 0.04, to: 0.38, cells: "fusiform", count: 8 },
    ],
  },
];

export const RECIPE_BY_ID: Record<SampleId, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
) as Record<SampleId, Recipe>;
