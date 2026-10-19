import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
  Activity,
  ArrowUpFromLine,
  Eye,
  EyeOff,
  LocateFixed,
  Microscope,
  RotateCcw,
  Ruler,
  Search,
  SunMedium,
  X,
} from "lucide-react";
import { CATEGORIES, GROUPS, RECIPES, TOURS, type CatId, type SampleId, type TourId } from "./data";
import { useLab, type Axis } from "./store";

function Meter({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between font-mono text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{format(value)}</span>
      </span>
      <Slider.Root
        className="relative flex h-11 w-full touch-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next ?? min)}
        onValueCommit={([next]) => onCommit?.(next ?? min)}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-surface-2">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb className="block size-5 rounded-full border border-border bg-fg" aria-label={label} />
      </Slider.Root>
    </label>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-full px-3 text-sm ${active ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"}`}
    >
      {children}
    </button>
  );
}

export function Chrome() {
  const ready = useLab((s) => s.ready);
  const progress = useLab((s) => s.progress);
  const status = useLab((s) => s.status);
  const error = useLab((s) => s.error);
  const optics = useLab((s) => s.optics);
  const hr = useLab((s) => s.hr);
  const brief = useLab((s) => s.brief);
  const sheet = useLab((s) => s.sheet);
  const tour = useLab((s) => s.tour);
  const patch = useLab((s) => s.patch);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const state = useLab.getState();
      if (event.key === "r" || event.key === "R") state.reassemble();
      if (event.key === "m" || event.key === "M") state.patch({ measuring: !state.measuring, measure: [] });
      if (event.key === "s" || event.key === "S") state.patch({ sectionOn: !state.sectionOn });
      if (event.key === "f" || event.key === "F") focusSelection();
      if (event.key === "Escape") state.patch({ measuring: false, measure: [], selected: null, sheet: null, tour: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <header className="pointer-events-auto flex items-center gap-3 border-b border-border bg-bg/80 px-3 py-2 backdrop-blur-md">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest text-primary">NEUROTOME</p>
          <h1 className="truncate text-sm font-semibold">Living neuroanatomy laboratory</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="perfuse inline-block size-2 rounded-full bg-primary"
            style={{ ["--beat" as string]: `${60 / hr}s` }}
            aria-hidden
          />
          <span className="font-mono text-xs text-muted tabular-nums">{hr} bpm</span>
          <span className="hidden font-mono text-xs text-muted tabular-nums sm:inline">
            {optics.approach} · {optics.distanceMm.toFixed(0)} mm
          </span>
        </div>
      </header>

      {brief && (
        <div className="pointer-events-auto flex items-start gap-3 border-b border-border bg-surface/90 px-3 py-2">
          <p className="text-sm text-muted">
            Orbit the specimen. Hide a layer to dissect it. Cut a section, or descend into a gyrus for the cortical column.
          </p>
          <button type="button" className="flex size-11 shrink-0 items-center justify-center" onClick={() => patch({ brief: false })} aria-label="Dismiss briefing">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="pointer-events-auto hidden w-72 flex-col overflow-y-auto border-r border-border bg-bg/80 backdrop-blur-md lg:flex">
          <Layers />
        </aside>
        <div className="min-w-0 flex-1" />
        <aside className="pointer-events-auto hidden w-80 flex-col overflow-y-auto border-l border-border bg-bg/80 backdrop-blur-md lg:flex">
          <Dossier />
        </aside>
      </div>

      {sheet && (
        <div className="pointer-events-auto fixed inset-x-0 bottom-16 z-20 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg/95 shadow-2xl backdrop-blur-md lg:hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {sheet === "layers" ? "Layers" : sheet === "dossier" ? "Notes" : "Field"}
            </span>
            <button
              type="button"
              onClick={() => patch({ sheet: null })}
              className="flex size-11 items-center justify-center rounded-full bg-surface-2"
              aria-label="Close panel"
            >
              <X className="size-4" />
            </button>
          </div>
          {sheet === "layers" && <Layers />}
          {sheet === "dossier" && <Dossier />}
          {sheet === "field" && <Field />}
        </div>
      )}

      {tour && <TourBar />}

      <footer className="pointer-events-auto relative z-30 flex items-center gap-2 overflow-x-auto border-t border-border bg-bg/85 px-2 py-2 backdrop-blur-md">
        <Tools />
        <div className="ml-auto flex gap-2 lg:hidden">
          <Pill active={sheet === "layers"} onClick={() => patch({ sheet: sheet === "layers" ? null : "layers" })}>
            Layers
          </Pill>
          <Pill active={sheet === "dossier"} onClick={() => patch({ sheet: sheet === "dossier" ? null : "dossier" })}>
            Notes
          </Pill>
        </div>
      </footer>

      {sheet === "field" && (
        <div className="pointer-events-auto absolute right-3 bottom-24 hidden rounded-2xl border border-border bg-bg/95 lg:block">
          <Field />
        </div>
      )}

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-72 rounded-2xl border border-border bg-surface/95 p-4">
            <p className="font-mono text-xs tracking-widest text-primary">SPECIMEN HS-1847</p>
            <p className="mt-2 text-sm">{error ?? status}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${Math.max(0.05, progress)})` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TourBar() {
  const tour = useLab((s) => s.tour);
  const patch = useLab((s) => s.patch);
  if (!tour) return null;
  const spec = TOURS[tour.id];
  const stop = spec.stops[tour.index];
  if (!stop) return null;
  const last = tour.index >= spec.stops.length - 1;
  return (
    <div className="pointer-events-auto mx-3 mb-2 rounded-2xl border border-border bg-bg/95 p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <p className="font-mono text-xs tracking-widest text-primary">{spec.title.toUpperCase()}</p>
        <span className="ml-auto font-mono text-xs text-muted tabular-nums">
          {tour.index + 1}/{spec.stops.length}
        </span>
        <button type="button" className="flex size-11 items-center justify-center" aria-label="Close tour" onClick={() => patch({ tour: null })}>
          <X className="size-4" />
        </button>
      </div>
      <h2 className="text-sm font-semibold">{stop.title}</h2>
      <p className="mt-1 text-sm text-muted">{stop.note}</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="h-11 flex-1 rounded-full bg-surface-2 text-sm disabled:opacity-40"
          disabled={tour.index === 0}
          onClick={() => patch({ tour: { id: tour.id, index: tour.index - 1 } })}
        >
          Back
        </button>
        <button
          type="button"
          className="h-11 flex-1 rounded-full bg-primary text-sm text-primary-fg"
          onClick={() => patch(last ? { tour: null } : { tour: { id: tour.id, index: tour.index + 1 } })}
        >
          {last ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}

function focusSelection() {
  const state = useLab.getState();
  const key = state.selected;
  if (!key) return;
  if (key.startsWith("tissue:")) {
    const sample = key.slice(7) as SampleId;
    state.patch({ sample, tissue: true });
    state.request({ type: "sample" });
    return;
  }
  if (key === "pia") return;
  state.request({ type: "part", key });
}

function openSample(id: SampleId) {
  const state = useLab.getState();
  const opacity = { ...state.opacity };
  if (id === "hip") {
    opacity.cortex = 0.08;
    opacity.white_matter = 0.12;
    opacity.cerebellum = 0.18;
    opacity.deep_grey = 0.45;
  }
  state.patch({ sample: id, tissue: true, opacity, mag: id === "hip" ? 1.7 : 2.8, retract: 0.2, sheet: "dossier" });
  state.request({ type: "sample" });
}

function beginTour(id: TourId) {
  const state = useLab.getState();
  const hidden = { ...state.hidden };
  const visible = { ...state.visible };
  const opacity = { ...state.opacity };
  if (id === "visual") {
    for (const item of state.directory) {
      if (item.cat === "cranial_nerves") hidden[item.key] = !/optic|chiasm/i.test(item.label);
      if (item.cat === "tracts") hidden[item.key] = !/optic radiation/i.test(item.label);
      if (item.cat === "globe" || item.cat === "orbit") hidden[item.key] = false;
    }
    Object.assign(opacity, {
      cortex: 0.14,
      white_matter: 0.08,
      cerebellum: 0.06,
      brainstem: 0.4,
      diencephalon: 0.28,
      globe: 1,
      orbit: 1,
      cranial_nerves: 1,
      tracts: 0.85,
      dura: 0.04,
      arachnoid: 0.04,
    });
    visible.globe = true;
    visible.orbit = true;
    visible.cranial_nerves = true;
    visible.tracts = true;
  } else {
    for (const item of state.directory) {
      if (item.cat === "tracts") hidden[item.key] = !/corticospinal/i.test(item.label);
      if (item.cat === "cranial_nerves") hidden[item.key] = true;
    }
    Object.assign(opacity, {
      cortex: 0.16,
      white_matter: 0.12,
      cerebellum: 0.08,
      brainstem: 0.72,
      spinal_cord: 1,
      tracts: 1,
      dura: 0.04,
      arachnoid: 0.04,
    });
    visible.tracts = true;
    visible.spinal_cord = true;
    visible.brainstem = true;
    visible.cortex = true;
  }
  state.patch({
    hidden,
    visible,
    opacity,
    tour: { id, index: 0 },
    explode: id === "visual" ? 0.2 : 0.12,
    isolated: null,
    sectionOn: false,
    sheet: null,
  });
}

function applyOpacity(partial: Partial<Record<CatId, number>>, extra?: { visible?: Record<CatId, boolean> }) {
  const state = useLab.getState();
  state.patch({
    opacity: { ...state.opacity, ...partial },
    visible: extra?.visible ?? state.visible,
    isolated: null,
    sectionOn: false,
  });
}

function show(ids: CatId[], on: boolean) {
  const state = useLab.getState();
  const visible = { ...state.visible };
  for (const id of ids) visible[id] = on;
  return visible;
}

function Layers() {
  const directory = useLab((s) => s.directory);
  const visible = useLab((s) => s.visible);
  const opacity = useLab((s) => s.opacity);
  const query = useLab((s) => s.query);
  const piaOn = useLab((s) => s.piaOn);
  const isolated = useLab((s) => s.isolated);
  const toggleCat = useLab((s) => s.toggleCat);
  const setOpacity = useLab((s) => s.setOpacity);
  const patch = useLab((s) => s.patch);
  const select = useLab((s) => s.select);
  const toggleHidden = useLab((s) => s.toggleHidden);
  const hidden = useLab((s) => s.hidden);
  const side = useLab((s) => s.side);
  const mode = useLab((s) => s.mode);
  const [open, setOpen] = useState<CatId | "pia" | null>("cortex");

  const counts = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, 0])) as Record<CatId, number>;
    for (const item of directory) {
      if (item.key.startsWith("tissue:") || item.key === "pia") continue;
      map[item.cat] += 1;
    }
    return map;
  }, [directory]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return directory
      .filter((item) => !item.key.startsWith("tissue:") && `${item.label} ${item.region} ${item.ta2} ${item.cat}`.toLowerCase().includes(q))
      .slice(0, 36);
  }, [directory, query]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex gap-2 overflow-x-auto">
        {(["both", "left", "right"] as const).map((value) => (
          <Pill key={value} active={side === value} onClick={() => patch({ side: value })}>
            {value === "both" ? "Both" : value === "left" ? "Left" : "Right"}
          </Pill>
        ))}
        <Pill active={mode === "parcellation"} onClick={() => patch({ mode: mode === "specimen" ? "parcellation" : "specimen" })}>
          {mode === "specimen" ? "Specimen" : "Parcellation"}
        </Pill>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <Pill
          onClick={() => {
            useLab.getState().reassemble();
          }}
        >
          Intact
        </Pill>
        <Pill
          onClick={() => {
            const state = useLab.getState();
            state.patch({
              retract: 1,
              visible: { ...state.visible, dura: true, arachnoid: true, meninges_dura: true },
              opacity: { ...state.opacity, dura: 0.62, arachnoid: 0.28, meninges_dura: 0.7 },
            });
          }}
        >
          Dura open
        </Pill>
        <Pill onClick={() => useLab.getState().patch({ sectionOn: true, axis: "axial", depth: 0.42, retract: 0.35 })}>Axial cut</Pill>
        <Pill onClick={() => useLab.getState().patch({ sectionOn: true, axis: "coronal", depth: 0.5 })}>Coronal</Pill>
        <Pill
          onClick={() =>
            applyOpacity(
              { cortex: 0.07, white_matter: 0.1, cerebellum: 0.15, brainstem: 0.7, ventricles: 0.55, arteries: 0.35, dura: 0.05, arachnoid: 0.04 },
              { visible: show(["tracts"], false) },
            )
          }
        >
          Deep gray
        </Pill>
        <Pill
          onClick={() =>
            applyOpacity({
              cortex: 0.06,
              white_matter: 0.08,
              cerebellum: 0.1,
              brainstem: 0.35,
              ventricles: 0.85,
              diencephalon: 0.4,
            })
          }
        >
          Ventricles
        </Pill>
        <Pill
          onClick={() =>
            applyOpacity(
              { cortex: 0.06, cerebellum: 0.08, brainstem: 0.3, white_matter: 0.05, arteries: 1, veins_sinuses: 1 },
              { visible: { ...useLab.getState().visible, arteries: true, veins_sinuses: true, cranial_nerves: false } },
            )
          }
        >
          Vessels
        </Pill>
        <Pill
          onClick={() =>
            applyOpacity(
              { cortex: 0.08, white_matter: 0.22, tracts: 1 },
              { visible: { ...useLab.getState().visible, tracts: true } },
            )
          }
        >
          Tracts
        </Pill>
        <Pill
          onClick={() => {
            const state = useLab.getState();
            const hidden = { ...state.hidden };
            for (const item of state.directory) {
              if (item.cat === "cranial_nerves") hidden[item.key] = false;
            }
            applyOpacity(
              { cortex: 0.1, brainstem: 0.85, cranial_nerves: 1 },
              { visible: { ...state.visible, cranial_nerves: true } },
            );
            useLab.getState().patch({ hidden });
          }}
        >
          Nerves
        </Pill>
        <Pill onClick={() => beginTour("visual")}>Visual pathway</Pill>
        <Pill onClick={() => beginTour("corticospinal")}>Corticospinal</Pill>
        <Pill
          onClick={() =>
            useLab.getState().patch({
              explode: 0.82,
              retract: 0.55,
              visible: { ...useLab.getState().visible, tracts: true, cranial_nerves: false },
            })
          }
        >
          Exploded
        </Pill>
      </div>

      <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-3">
        <Search className="size-4 text-muted" />
        <input
          value={query}
          onChange={(event) => patch({ query: event.target.value })}
          placeholder="Search precentral, thalamus, MCA…"
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
        />
      </label>

      {matches.length > 0 && (
        <ul className="flex flex-col">
          {matches.map((item) => (
            <li key={item.key} className="flex items-center">
              <button
                type="button"
                className="flex size-11 items-center justify-center"
                aria-label={hidden[item.key] ? `Show ${item.label}` : `Hide ${item.label}`}
                onClick={() => toggleHidden(item.key)}
              >
                {hidden[item.key] ? <EyeOff className="size-4 text-muted" /> : <Eye className="size-4" />}
              </button>
              <button type="button" className="flex h-11 flex-1 flex-col items-start justify-center text-left" onClick={() => select(item.key)}>
                <span className="text-sm">{item.label}</span>
                <span className="font-mono text-xs text-muted">
                  {item.side} · {item.region}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {GROUPS.map((group) => (
        <section key={group} className="flex flex-col">
          <h2 className="px-2 pb-1 font-mono text-xs tracking-widest text-muted">{group.toUpperCase()}</h2>
          {group === "Meninges" && (
            <div>
              <button
                type="button"
                className="flex h-11 w-full items-center gap-2 px-2 text-left text-sm"
                onClick={() => {
                  patch({ piaOn: !piaOn, selected: "pia" });
                  setOpen("pia");
                }}
              >
                {piaOn ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted" />}
                Pia mater
              </button>
            </div>
          )}
          {CATEGORIES.filter((cat) => cat.group === group).map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex size-11 items-center justify-center"
                  aria-label={visible[cat.id] ? `Hide ${cat.label}` : `Show ${cat.label}`}
                  onClick={() => toggleCat(cat.id)}
                >
                  {visible[cat.id] ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted" />}
                </button>
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-between pr-2 text-left"
                  onClick={() => setOpen(open === cat.id ? null : cat.id)}
                >
                  <span className="text-sm">{cat.label}</span>
                  <span className="font-mono text-xs text-muted tabular-nums">{counts[cat.id] || "—"}</span>
                </button>
              </div>
              {open === cat.id && (
                <div className="px-3 pb-2">
                  <Meter
                    label="Opacity"
                    min={0.04}
                    max={1}
                    step={0.01}
                    value={opacity[cat.id]}
                    format={(value) => `${Math.round(value * 100)}%`}
                    onChange={(value) => setOpacity(cat.id, value)}
                  />
                  <button
                    type="button"
                    className="mt-1 h-11 text-sm text-primary"
                    onClick={() => patch({ isolated: isolated === cat.id ? null : cat.id })}
                  >
                    {isolated === cat.id ? "Release solo" : "Solo this layer"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function Dossier() {
  const directory = useLab((s) => s.directory);
  const selected = useLab((s) => s.selected);
  const sample = useLab((s) => s.sample);
  const tissue = useLab((s) => s.tissue);
  const mag = useLab((s) => s.mag);
  const strataOn = useLab((s) => s.strataOn);
  const excised = useLab((s) => s.excised);
  const patch = useLab((s) => s.patch);
  const toggleExcise = useLab((s) => s.toggleExcise);
  const meta = directory.find((item) => item.key === selected) ?? null;
  const recipe = RECIPES.find((item) => item.id === sample) ?? RECIPES[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-primary">SPECIMEN HS-1847</p>
        <h2 className="mt-1 text-lg font-semibold">{meta?.label ?? "Adult reference brain"}</h2>
        {meta && (
          <p className="mt-1 font-mono text-xs text-muted">
            {meta.side} · {meta.region}
            {meta.ta2 ? ` · ${meta.ta2}` : ""}
          </p>
        )}
      </div>
      <p className="text-sm text-muted">
        {meta?.blurb ??
          "A perfused adult human brain at life size, assembled from Z-Anatomy. Peel meninges, fade the cortex, cut a plane, or open a tissue window without leaving the same specimen."}
      </p>
      {meta && meta.key !== "pia" && !meta.key.startsWith("tissue:") && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm" onClick={focusSelection}>
            <LocateFixed className="size-4" />
            Frame
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm"
            onClick={() => {
              toggleExcise(meta.key);
              useLab.getState().request({ type: "part", key: meta.key });
            }}
          >
            <ArrowUpFromLine className="size-4" />
            {excised.includes(meta.key) ? "Return" : "Lift to tray"}
          </button>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-mono text-xs tracking-widest text-muted">TISSUE WINDOW</h3>
        <div className="flex flex-col gap-2">
          {RECIPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openSample(item.id)}
              className={`h-11 rounded-full px-3 text-left text-sm ${sample === item.id && tissue ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"}`}
            >
              {item.title}
            </button>
          ))}
        </div>
        <Meter
          label="Descent"
          min={1}
          max={8}
          step={0.1}
          value={mag}
          format={(value) => `${value.toFixed(1)}×`}
          onChange={(value) => patch({ mag: value })}
          onCommit={() => {
            if (useLab.getState().tissue) useLab.getState().request({ type: "sample" });
          }}
        />
        {tissue &&
          recipe.strata.map((stratum) => {
            const on = strataOn[stratum.name] !== false;
            return (
              <button
                key={stratum.name}
                type="button"
                className="flex h-11 items-center gap-2 text-left text-sm"
                onClick={() => patch({ strataOn: { ...strataOn, [stratum.name]: !on } })}
              >
                {on ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted" />}
                {stratum.name}
              </button>
            );
          })}
      </section>

      {excised.length > 0 && (
        <section>
          <h3 className="font-mono text-xs tracking-widest text-muted">ON THE TRAY</h3>
          <ul className="mt-2 flex flex-col">
            {excised.map((key) => {
              const item = directory.find((entry) => entry.key === key);
              return (
                <li key={key}>
                  <button type="button" className="h-11 text-left text-sm" onClick={() => useLab.getState().select(key)}>
                    {item?.label ?? key}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">
        Atlas meshes from Z-Anatomy and BodyParts3D (DBCLS), CC BY-SA 4.0. Registered nuclei and tracts are about 7 mm and are for study, not surgery. Dura, arachnoid, and the cortical column are schematic teaching geometry on this specimen.
      </p>
    </div>
  );
}

function Field() {
  const light = useLab((s) => s.light);
  const hr = useLab((s) => s.hr);
  const retract = useLab((s) => s.retract);
  const turntable = useLab((s) => s.turntable);
  const quality = useLab((s) => s.quality);
  const patch = useLab((s) => s.patch);
  const setLight = (key: keyof typeof light, value: number) => patch({ light: { ...useLab.getState().light, [key]: value } });
  return (
    <div className="flex w-72 flex-col gap-1 p-3">
      <h2 className="mb-1 font-mono text-xs tracking-widest text-muted">FIELD & PERFUSION</h2>
      <Meter label="Key light" min={0} max={5} step={0.05} value={light.key} format={(v) => v.toFixed(1)} onChange={(v) => setLight("key", v)} />
      <Meter label="Fill" min={0} max={2} step={0.05} value={light.fill} format={(v) => v.toFixed(1)} onChange={(v) => setLight("fill", v)} />
      <Meter label="Rim" min={0} max={3} step={0.05} value={light.rim} format={(v) => v.toFixed(1)} onChange={(v) => setLight("rim", v)} />
      <Meter label="Transillumination" min={0} max={2} step={0.05} value={light.trans} format={(v) => v.toFixed(1)} onChange={(v) => setLight("trans", v)} />
      <Meter label="Color temperature" min={0} max={1} step={0.01} value={light.temp} format={(v) => (v < 0.45 ? "Warm" : v > 0.7 ? "Cool" : "Neutral")} onChange={(v) => setLight("temp", v)} />
      <div className="mt-2 flex gap-1">
        {(["low", "medium", "high"] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={`h-9 flex-1 rounded-full text-xs capitalize ${quality === level ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"}`}
            onClick={() => patch({ quality: level })}
          >
            {level}
          </button>
        ))}
      </div>
      <p className="px-1 text-[11px] leading-snug text-muted">Medium keeps the wet film and maps. High adds subsurface glow, fiber sheen, and close-up grain. Low is the plain specimen.</p>
      <Meter label="Heart rate" min={40} max={140} step={1} value={hr} format={(v) => `${Math.round(v)} bpm`} onChange={(v) => patch({ hr: v })} />
      <Meter label="Retract dura" min={0} max={1} step={0.01} value={retract} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ retract: v })} />
      <button type="button" className="h-11 text-left text-sm" onClick={() => patch({ turntable: !turntable })}>
        {turntable ? "Stop turntable" : "Start turntable"}
      </button>
    </div>
  );
}

function Tools() {
  const explode = useLab((s) => s.explode);
  const sectionOn = useLab((s) => s.sectionOn);
  const axis = useLab((s) => s.axis);
  const depth = useLab((s) => s.depth);
  const measuring = useLab((s) => s.measuring);
  const sheet = useLab((s) => s.sheet);
  const patch = useLab((s) => s.patch);
  const axes: Axis[] = ["axial", "coronal", "sagittal"];
  return (
    <>
      <div className="w-36 shrink-0">
        <Meter label="Explode" min={0} max={1} step={0.01} value={explode} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ explode: v })} />
      </div>
      <Pill active={sectionOn} onClick={() => patch({ sectionOn: !sectionOn })}>
        Section
      </Pill>
      {sectionOn &&
        axes.map((name) => (
          <Pill key={name} active={axis === name} onClick={() => patch({ axis: name, sectionOn: true })}>
            {name}
          </Pill>
        ))}
      {sectionOn && (
        <div className="w-36 shrink-0">
          <Meter label="Depth" min={0.05} max={0.98} step={0.01} value={depth} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => patch({ depth: v })} />
        </div>
      )}
      <Pill active={measuring} onClick={() => patch({ measuring: !measuring, measure: [] })}>
        <span className="inline-flex items-center gap-2">
          <Ruler className="size-4" />
          Measure
        </span>
      </Pill>
      <Pill
        onClick={() => {
          patch({ tissue: true, sheet: "dossier" });
          openSample(useLab.getState().sample);
        }}
      >
        <span className="inline-flex items-center gap-2">
          <Microscope className="size-4" />
          Descend
        </span>
      </Pill>
      <Pill active={sheet === "field"} onClick={() => patch({ sheet: sheet === "field" ? null : "field" })}>
        <span className="inline-flex items-center gap-2">
          <SunMedium className="size-4" />
          Light
        </span>
      </Pill>
      <Pill onClick={() => useLab.getState().reassemble()}>
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="size-4" />
          Reassemble
        </span>
      </Pill>
      <span className="hidden items-center gap-1 font-mono text-xs text-muted xl:inline-flex">
        <Activity className="size-4" />
        F frame · M measure · R reset
      </span>
    </>
  );
}
