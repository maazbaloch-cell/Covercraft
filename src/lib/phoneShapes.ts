/**
 * phoneShapes — per-model phone geometry for the Custom Cover Designer.
 *
 * The designer draws a phone with a fabric.js rounded "shell" (the body) plus a
 * cluster of camera primitives. This module makes that drawing MODEL-ACCURATE:
 * every curated model resolves to its correct body proportions + camera layout,
 * and anything not in the table falls back to a brand/tier heuristic so
 * admin-added models (which only carry a name + brand) still get a sensible shape.
 *
 * Design: a compact set of reusable camera LAYOUTS is composed with a per-model
 * body size. Camera parts are expressed RELATIVE to the shell's top-left corner
 * (0,0 = shell.left, shell.top), so the caller can re-center a differently sized
 * body without the camera drifting off the plateau.
 *
 * Coordinate space matches the designer canvas: 300 × 440 px.
 */

export type CameraPart =
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number; fill?: string }
  | { kind: "circle"; x: number; y: number; radius: number; fill?: string; stroke?: string; strokeWidth?: number };

export type PhoneBody = { width: number; height: number; rx: number; ry: number };
export type PhoneShape = { body: PhoneBody; camera: CameraPart[] };

/* ---- Body-size helpers (rounded-corner radius is overridable per family) ---- */
const std = (rx = 34): PhoneBody => ({ width: 248, height: 412, rx, ry: rx });
const large = (rx = 34): PhoneBody => ({ width: 256, height: 424, rx, ry: rx });
const compact = (rx = 32): PhoneBody => ({ width: 240, height: 400, rx, ry: rx });
const fold = (): PhoneBody => ({ width: 272, height: 398, rx: 18, ry: 18 });
const flip = (): PhoneBody => ({ width: 240, height: 410, rx: 28, ry: 28 });

/* ------------------------------------------------------------------ *
 * Reusable camera clusters (coords relative to the shell's top-left).
 * Geometry is seeded from the designer's original per-family drawings.
 * ------------------------------------------------------------------ */
export const LAYOUTS = {
  // iPhone Pro: rounded-square plateau, 3 lenses in a triangle + flash dot.
  iphonePro: [
    { kind: "rect", x: 20, y: 21, w: 88, h: 92, r: 21, fill: "#d1d5db" },
    { kind: "circle", x: 32, y: 33, radius: 15 },
    { kind: "circle", x: 71, y: 33, radius: 15 },
    { kind: "circle", x: 32, y: 72, radius: 15 },
    { kind: "circle", x: 77, y: 79, radius: 7, fill: "#f8fafc" },
  ],
  // iPhone (non-Pro): two lenses on a diagonal in a squarer bump.
  iphoneDual: [
    { kind: "rect", x: 20, y: 21, w: 78, h: 78, r: 22, fill: "#d1d5db" },
    { kind: "circle", x: 26, y: 27, radius: 16 },
    { kind: "circle", x: 56, y: 57, radius: 16 },
    { kind: "circle", x: 66, y: 30, radius: 6, fill: "#f8fafc" },
  ],
  // Pixel: full-width horizontal "visor" bar with 2 lenses.
  pixelBar: [
    { kind: "rect", x: 10, y: 40, w: 228, h: 40, r: 12, fill: "#64748b" },
    { kind: "circle", x: 40, y: 45, radius: 14 },
    { kind: "circle", x: 83, y: 45, radius: 14 },
  ],
  // Pixel Pro: taller visor with 3 lenses + a sensor.
  pixelBar3: [
    { kind: "rect", x: 10, y: 40, w: 228, h: 44, r: 14, fill: "#64748b" },
    { kind: "circle", x: 36, y: 47, radius: 15 },
    { kind: "circle", x: 78, y: 47, radius: 15 },
    { kind: "circle", x: 120, y: 49, radius: 12 },
    { kind: "circle", x: 150, y: 50, radius: 6, fill: "#f8fafc" },
  ],
  // Samsung floating triple (S / A / Fold).
  samsungTriple: [
    { kind: "circle", x: 27, y: 36, radius: 18 },
    { kind: "circle", x: 27, y: 86, radius: 18 },
    { kind: "circle", x: 27, y: 136, radius: 18 },
  ],
  // Samsung Ultra: floating quad.
  samsungQuad: [
    { kind: "circle", x: 27, y: 36, radius: 18 },
    { kind: "circle", x: 27, y: 86, radius: 18 },
    { kind: "circle", x: 27, y: 136, radius: 18 },
    { kind: "circle", x: 77, y: 36, radius: 11 },
  ],
  // Samsung Flip cover: two lenses.
  samsungDual: [
    { kind: "circle", x: 27, y: 40, radius: 16 },
    { kind: "circle", x: 27, y: 82, radius: 16 },
  ],
  // Xiaomi: large rounded-square island, triple.
  xiaomiSquare: [
    { kind: "rect", x: 16, y: 24, w: 93, h: 100, r: 18, fill: "#334155" },
    { kind: "circle", x: 30, y: 38, radius: 17 },
    { kind: "circle", x: 69, y: 38, radius: 17 },
    { kind: "circle", x: 30, y: 79, radius: 17 },
  ],
  // OnePlus: big circular island, triple.
  oneplusCircle: [
    { kind: "circle", x: 31, y: 31, radius: 40, fill: "#334155" },
    { kind: "circle", x: 42, y: 42, radius: 12 },
    { kind: "circle", x: 74, y: 42, radius: 12 },
    { kind: "circle", x: 58, y: 70, radius: 12 },
  ],
  // Oppo / Vivo / Realme: vertical pill island.
  oppoVivoPill: [
    { kind: "rect", x: 19, y: 30, w: 80, h: 118, r: 21, fill: "#475569" },
    { kind: "circle", x: 32, y: 43, radius: 16 },
    { kind: "circle", x: 32, y: 86, radius: 16 },
    { kind: "circle", x: 71, y: 43, radius: 12 },
  ],
  // Huawei (and Xiaomi Ultra / Vivo Pro): big circular island, quad-in-circle.
  huaweiCircle: [
    { kind: "circle", x: 30, y: 27, radius: 43, fill: "#334155" },
    { kind: "circle", x: 41, y: 38, radius: 12 },
    { kind: "circle", x: 75, y: 38, radius: 12 },
    { kind: "circle", x: 58, y: 67, radius: 12 },
  ],
  // Tecno / Infinix: tall triple strip.
  tecnoStrip: [
    { kind: "rect", x: 20, y: 28, w: 75, h: 125, r: 20, fill: "#475569" },
    { kind: "circle", x: 31, y: 40, radius: 16 },
    { kind: "circle", x: 31, y: 84, radius: 16 },
    { kind: "circle", x: 31, y: 128, radius: 16 },
  ],
  // Nothing Phone: two bare lenses (transparent-back look).
  nothingDual: [
    { kind: "circle", x: 24, y: 28, radius: 17 },
    { kind: "circle", x: 24, y: 70, radius: 17 },
  ],
  // Motorola Edge: vertical dual + sensor.
  motoPill: [
    { kind: "circle", x: 26, y: 30, radius: 18 },
    { kind: "circle", x: 26, y: 74, radius: 15 },
    { kind: "circle", x: 26, y: 110, radius: 8 },
  ],
  // Generic fallback: a small bump + two offset lenses.
  generic: [
    { kind: "rect", x: 20, y: 28, w: 76, h: 88, r: 18, fill: "#cbd5e1" },
    { kind: "circle", x: 32, y: 40, radius: 16 },
    { kind: "circle", x: 66, y: 77, radius: 16 },
  ],
} satisfies Record<string, CameraPart[]>;

export type LayoutKey = keyof typeof LAYOUTS;

/* ------------------------------------------------------------------ *
 * Curated ~50 real models → { layout, body }. Keyed by lowercased name
 * (MobileModel.name is globally unique in the schema).
 * ------------------------------------------------------------------ */
type ModelEntry = { layout: LayoutKey; body: PhoneBody };

export const MODELS: Record<string, ModelEntry> = {
  // ---- Apple ----
  "iphone 16 pro max": { layout: "iphonePro", body: large() },
  "iphone 16 pro": { layout: "iphonePro", body: std() },
  "iphone 16 plus": { layout: "iphoneDual", body: large() },
  "iphone 16": { layout: "iphoneDual", body: std() },
  "iphone 15 pro max": { layout: "iphonePro", body: large() },
  "iphone 15 pro": { layout: "iphonePro", body: std() },
  "iphone 15": { layout: "iphoneDual", body: std() },
  "iphone 14 pro max": { layout: "iphonePro", body: large() },
  "iphone 14": { layout: "iphoneDual", body: std() },

  // ---- Samsung ----
  "galaxy s24 ultra": { layout: "samsungQuad", body: large(16) },
  "galaxy s24+": { layout: "samsungTriple", body: large(26) },
  "galaxy s24": { layout: "samsungTriple", body: std(26) },
  "galaxy s23 ultra": { layout: "samsungQuad", body: large(16) },
  "galaxy s23": { layout: "samsungTriple", body: std(26) },
  "galaxy z fold 6": { layout: "samsungTriple", body: fold() },
  "galaxy z flip 6": { layout: "samsungDual", body: flip() },
  "galaxy a55": { layout: "samsungTriple", body: std(24) },
  "galaxy a35": { layout: "samsungTriple", body: std(24) },

  // ---- Google ----
  "pixel 9 pro xl": { layout: "pixelBar3", body: large() },
  "pixel 9 pro": { layout: "pixelBar3", body: std() },
  "pixel 9": { layout: "pixelBar", body: std() },
  "pixel 8 pro": { layout: "pixelBar3", body: large() },
  "pixel 8": { layout: "pixelBar", body: std() },
  "pixel 8a": { layout: "pixelBar", body: compact() },

  // ---- Xiaomi / Redmi / Poco ----
  "xiaomi 14 ultra": { layout: "huaweiCircle", body: large(28) },
  "xiaomi 14": { layout: "xiaomiSquare", body: std(28) },
  "redmi note 13 pro": { layout: "xiaomiSquare", body: std(24) },
  "redmi note 13": { layout: "oppoVivoPill", body: std(24) },
  "poco x6 pro": { layout: "oppoVivoPill", body: std(24) },

  // ---- OnePlus ----
  "oneplus 12": { layout: "oneplusCircle", body: large(30) },
  "oneplus 12r": { layout: "oneplusCircle", body: std(30) },
  "nord 4": { layout: "oppoVivoPill", body: std(26) },

  // ---- Oppo / Vivo / Realme ----
  "reno 12 pro": { layout: "oppoVivoPill", body: std(26) },
  "reno 11": { layout: "oppoVivoPill", body: std(26) },
  "x100 pro": { layout: "huaweiCircle", body: large(28) },
  "v30": { layout: "oppoVivoPill", body: std(26) },
  "gt 6": { layout: "oppoVivoPill", body: std(24) },
  "12 pro+": { layout: "oppoVivoPill", body: std(24) },

  // ---- Motorola ----
  "edge 50 pro": { layout: "motoPill", body: std(30) },
  "moto g84": { layout: "generic", body: std(26) },

  // ---- Nothing ----
  "phone (2)": { layout: "nothingDual", body: std(30) },
  "phone (2a)": { layout: "nothingDual", body: std(28) },

  // ---- Huawei ----
  "mate 60 pro": { layout: "huaweiCircle", body: large(30) },
  "p60 pro": { layout: "huaweiCircle", body: std(30) },

  // ---- Tecno / Infinix ----
  "camon 30": { layout: "tecnoStrip", body: std(24) },
  "spark 20": { layout: "generic", body: std(24) },
  "note 40": { layout: "tecnoStrip", body: std(24) },
  "hot 40": { layout: "generic", body: std(24) },
};

/* ------------------------------------------------------------------ *
 * Fallback heuristic for models not in the curated table (e.g. added
 * later via the admin panel with only a name + brand).
 * ------------------------------------------------------------------ */
function heuristicShape(brand: string, name: string): PhoneShape {
  const b = brand.trim().toLowerCase();
  const full = `${brand} ${name}`.toLowerCase();
  const big = /(pro max|ultra|pro xl|\bplus\b|\bmax\b|\+)/.test(full);
  const body = big ? large() : std();

  if (b === "apple" || full.includes("iphone")) {
    return { body, camera: LAYOUTS[full.includes("pro") ? "iphonePro" : "iphoneDual"] };
  }
  if (b === "google" || full.includes("pixel")) {
    return { body, camera: LAYOUTS[full.includes("pro") ? "pixelBar3" : "pixelBar"] };
  }
  if (b === "samsung" || full.includes("galaxy")) {
    if (full.includes("fold")) return { body: fold(), camera: LAYOUTS.samsungTriple };
    if (full.includes("flip")) return { body: flip(), camera: LAYOUTS.samsungDual };
    const ultra = full.includes("ultra");
    return { body: { ...body, rx: ultra ? 16 : 24, ry: ultra ? 16 : 24 }, camera: LAYOUTS[ultra ? "samsungQuad" : "samsungTriple"] };
  }
  if (b === "oneplus") return { body: { ...body, rx: 30, ry: 30 }, camera: LAYOUTS.oneplusCircle };
  if (b === "huawei") return { body: { ...body, rx: 30, ry: 30 }, camera: LAYOUTS.huaweiCircle };
  if (b === "xiaomi" || full.includes("redmi") || full.includes("poco")) {
    return { body: { ...body, rx: 26, ry: 26 }, camera: LAYOUTS[full.includes("ultra") ? "huaweiCircle" : "xiaomiSquare"] };
  }
  if (b === "vivo" && full.includes("pro")) return { body: { ...body, rx: 28, ry: 28 }, camera: LAYOUTS.huaweiCircle };
  if (["oppo", "vivo", "realme"].includes(b)) return { body: { ...body, rx: 26, ry: 26 }, camera: LAYOUTS.oppoVivoPill };
  if (b === "nothing") return { body: { ...body, rx: 30, ry: 30 }, camera: LAYOUTS.nothingDual };
  if (b === "motorola" || full.includes("moto")) return { body: { ...body, rx: 28, ry: 28 }, camera: LAYOUTS[full.includes("edge") ? "motoPill" : "generic"] };
  if (["tecno", "infinix"].includes(b)) return { body: { ...body, rx: 24, ry: 24 }, camera: LAYOUTS.tecnoStrip };
  return { body: { ...body, rx: 26, ry: 26 }, camera: LAYOUTS.generic };
}

/**
 * Resolve a phone's drawing geometry. Tries the curated per-model table first
 * (exact, by unique name), then a brand/tier heuristic, then a generic shape.
 * The returned `camera` array is shared/read-only — callers must not mutate it,
 * only read each spec to build fabric objects.
 */
export function getPhoneShape(brand: string, name: string): PhoneShape {
  const entry = MODELS[name.trim().toLowerCase()];
  if (entry) return { body: entry.body, camera: LAYOUTS[entry.layout] };
  return heuristicShape(brand, name);
}
