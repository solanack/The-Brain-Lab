# Neurotome

Living neuroanatomy laboratory. A life-sized adult brain you can orbit, peel, section, measure, and descend into.

The specimen is the [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) / BodyParts3D atlas (CC BY-SA 4.0). Named cortex, white matter, deep nuclei, ventricles, brainstem, cerebellum, arteries, veins, and cranial nerves stay in one model. Dura and arachnoid are hulls fitted to this specimen. Pia is the wet film on the cortex. Tissue windows on the precentral gyrus, V1, cerebellum, and hippocampus are enlarged teaching columns, still attached to the gyrus they came from.

Registered tracts and nuclei are about 7 mm and are for study, not surgery. See [public/models/LICENSE.txt](public/models/LICENSE.txt).

## Run

```bash
npm install
npm run dev
```

Open the app, then:

- Hide or fade a layer, or solo it. Filter by side or search.
- Axial, coronal, and sagittal sections. Depth removes more as it increases.
- Explode the specimen, or lift one structure onto the tray.
- Measure a chord in millimeters.
- Descend into a gyrus for the cortical column.
- Light, heart rate, and dural retraction are in the field controls. R reassembles.
