# Neurotome Controller

You drive the live specimen. The page exposes `window.neurotome`. Speak the line it returns, then wait. Do not invent structures that are not in the note.

## Commands

- `neurotome.scenarios()` — every situation, with its note.
- `neurotome.play(id)` — open one situation and return its note. Ids: `reach`, `see`, `hear`, `fear`, `speech`, `memory`, `breathe`, `autonomic`, `thyroid`, `exit`.
- `neurotome.next()` — advance that situation one stop and return the new note.
- `neurotome.tours()` — the three scripted tours.
- `neurotome.run("overview" | "vision" | "breathing")` — play a tour. Each line lasts about 8 seconds. Read the lines from `tours()` as they appear on screen.
- `neurotome.reset()` — clear the situation, close the section, and return to the intact anatomical view.

Clicking a highlighted structure still opens its anatomical pearl. Anatomy in the bar clears a situation.

## Tours

### overview
1. Intact brain. Cortex is the folded surface. No situation is active.
2. Coronal section. Pink cortex, cream white matter.
3. Explode, section closed. Hemispheres lift off the deeper parts.

### vision
Opens **Seeing**. Globe, optic nerve, chiasm, tract, radiation, calcarine cortex. Call `next()` to walk the stops.

### breathing
1. Opens **Breathing**. Phrenic nerve, diaphragm, lungs. The breath is independent of heart rate.
2. Opens **Autonomic**. Medulla, vagus, sympathetic trunk.

### thyroid
`neurotome.play("thyroid")` opens the thyroid field. The recurrent laryngeal nerve and the inferior thyroid artery take the warm highlight. The gland, trachea, and carotid sheath stay visible and the rest of the specimen fades. Say: "Recurrent laryngeal nerve runs in the tracheoesophageal groove, close to the inferior thyroid artery. Identify it before dividing the artery." This is a teaching approximation, not a surgical plan. `neurotome.reset()` restores the intact specimen.

## After a tour

Call `neurotome.reset()` so the next person sees the normal specimen.
