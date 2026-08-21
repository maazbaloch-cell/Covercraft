"use client";

import Link from "next/link";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { getPhoneShape } from "@/lib/phoneShapes";
import ManufacturingCinematic from "@/components/customize/ManufacturingCinematic";

type Catalog = { id: string; name: string; brand: string; templates: { id: string; name: string; price: number; imageUrl?: string | null }[] }[];

const coverColors = [{ name: "Black", hex: "#161616" }, { name: "White", hex: "#ffffff" }, { name: "Red", hex: "#dc2626" }, { name: "Blue", hex: "#2563eb" }, { name: "Green", hex: "#16a34a" }, { name: "Pink", hex: "#ec4899" }, { name: "Purple", hex: "#7c3aed" }, { name: "Gold", hex: "#d4a72c" }, { name: "Silver", hex: "#a8a8a8" }, { name: "Transparent", hex: "#dfe3e8" }];
const presets: Record<string, any> = { Minimal: { fontFamily: "Inter", fontSize: 24, fill: "#1a1a2e" }, Luxury: { fontFamily: "Playfair Display", fontSize: 32, fill: "#d4a72c", fontWeight: "bold" }, Neon: { fontFamily: "Montserrat", fontSize: 30, fill: "#ec4899", shadow: "glow" }, Bold: { fontFamily: "Roboto", fontSize: 38, fill: "#1a1a2e", fontWeight: "bold" }, Signature: { fontFamily: "Dancing Script", fontSize: 36, fill: "#1a1a2e", fontStyle: "italic" }, Elegant: { fontFamily: "Great Vibes", fontSize: 38, fill: "#7c3aed" } };

export default function CustomCoverDesigner() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const addItem = useCart((state) => state.addItem);
  const htmlCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<any>(null);
  const coverShell = useRef<any>(null);
  const cameraParts = useRef<any[]>([]);
  const templatePreview = useRef<any>(null);
  const [catalog, setCatalog] = useState<Catalog>([]);
  const [modelId, setModelId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [text, setText] = useState("");
  const [fontColor, setFontColor] = useState("#1a1a2e");
  const [fontSize, setFontSize] = useState(28);
  const [fontFamily, setFontFamily] = useState("Poppins");
  const [fontWeight, setFontWeight] = useState("normal");
  const [italic, setItalic] = useState(false); const [underline, setUnderline] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0); const [lineHeight, setLineHeight] = useState(1.16); const [textAlign, setTextAlign] = useState("center"); const [textOpacity, setTextOpacity] = useState(100); const [textBackground, setTextBackground] = useState("#ffffff");
  const [effect, setEffect] = useState("none"); const [coverColor, setCoverColor] = useState(coverColors[1]); const [styleName, setStyleName] = useState("Minimal");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  // Which configurator step is expanded. Only one open at a time (0 = all closed).
  const [activeStep, setActiveStep] = useState(1);
  const toggleStep = (n: number) => setActiveStep((current) => (current === n ? 0 : n));
  const [dragOver, setDragOver] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);

  const model = catalog.find((item) => item.id === modelId);
  const template = model?.templates.find((item) => item.id === templateId);

  useEffect(() => {
    fetch("/api/custom-cover/catalog").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const models = (data.models as Catalog).filter((item) => item.templates.length);
        if (models.length) { setCatalog(models); setModelId(models[0].id); setTemplateId(models[0].templates[0].id); }
        else setCatalogError("Custom covers are temporarily unavailable because no active templates have been configured.");
      } else setCatalogError("Unable to load custom-cover templates. Please try again later.");
    }).catch(() => setCatalogError("Unable to load custom-cover templates. Please try again later."));
  }, []);

  useEffect(() => {
    let mounted = true;
    import("fabric").then((fabric) => {
      if (!mounted || !htmlCanvasRef.current) return;
      const canvas = new fabric.Canvas(htmlCanvasRef.current, { width: 300, height: 440, backgroundColor: "transparent", preserveObjectStacking: true });
      const shell = new fabric.Rect({ left: 25, top: 15, width: 250, height: 410, rx: 28, ry: 28, fill: "#ffffff", stroke: "#1a1a2e", strokeWidth: 3, selectable: false, evented: false });
      canvas.add(shell);
      coverShell.current = shell;
      fabricCanvas.current = canvas;
      setReady(true);
    });
    return () => { mounted = false; fabricCanvas.current?.dispose(); fabricCanvas.current = null; };
  }, []);

  useEffect(() => { if (coverShell.current) { coverShell.current.set({ fill: coverColor.hex }); fabricCanvas.current?.renderAll(); } }, [coverColor]);

  useEffect(() => {
    let active = true;
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    if (templatePreview.current) { canvas.remove(templatePreview.current); templatePreview.current = null; }
    if (!template?.imageUrl) { canvas.renderAll(); return; }
    import("fabric").then(async (fabric) => {
      try {
        const image = await fabric.FabricImage.fromURL(template.imageUrl!, { crossOrigin: "anonymous" });
        if (!active) return;
        image.scaleToWidth(244);
        image.set({ left: 28, top: 12, selectable: false, evented: false });
        templatePreview.current = image;
        canvas.add(image);
        // Keep provider/database template artwork above the case shell but below
        // the customer's own text, uploads, and stickers.
        canvas.moveObjectTo(image, 1);
        cameraParts.current.forEach((part) => canvas.bringObjectToFront(part));
        canvas.renderAll();
      } catch { if (active) setMessage("The selected template preview could not be loaded."); }
    });
    return () => { active = false; };
  }, [template]);

  useEffect(() => {
    let active = true;
    import("fabric").then((fabric) => {
      if (!active) return;
      const canvas = fabricCanvas.current;
      const shell = coverShell.current;
      if (!canvas || !shell || !model) return;

      // Resolve this exact model's drawn geometry (body proportions + camera
      // layout). Falls back to a brand/tier heuristic for admin-added models.
      const shape = getPhoneShape(model.brand, model.name);
      const left = (300 - shape.body.width) / 2;
      const top = (440 - shape.body.height) / 2;
      // Resize/re-center the shell only — the cover-color effect owns `fill`, so
      // the chosen colour survives a model switch (the shell object persists).
      shell.set({ left, top, width: shape.body.width, height: shape.body.height, rx: shape.body.rx, ry: shape.body.ry });

      // Rebuild the camera cluster from the model's spec. Every part is placed
      // relative to the shell's top-left, so it stays aligned at any body size.
      cameraParts.current.forEach((part) => canvas.remove(part));
      cameraParts.current = [];
      const addPart = (part: any) => { part.set({ selectable: false, evented: false }); cameraParts.current.push(part); canvas.add(part); };
      for (const part of shape.camera) {
        if (part.kind === "rect") {
          addPart(new fabric.Rect({ left: left + part.x, top: top + part.y, width: part.w, height: part.h, rx: part.r ?? 0, ry: part.r ?? 0, fill: part.fill ?? "#1f2937" }));
        } else {
          addPart(new fabric.Circle({ left: left + part.x, top: top + part.y, radius: part.radius, fill: part.fill ?? "#1f2937", stroke: part.stroke ?? "#94a3b8", strokeWidth: part.strokeWidth ?? 2 }));
        }
      }
      cameraParts.current.forEach((part) => canvas.bringObjectToFront(part));
      canvas.renderAll();
    });
    return () => { active = false; };
  }, [model, ready]);

  const applyTextSettings = async (presetName?: string) => {
    const active = fabricCanvas.current?.getActiveObject(); if (!active || !["i-text", "text", "textbox"].includes(active.type)) return;
    const fabric = await import("fabric"); const p = presetName ? presets[presetName] : {};
    const selectedEffect = p.shadow || effect;
    active.set({ fill: p.fill ?? fontColor, fontSize: p.fontSize ?? fontSize, fontFamily: p.fontFamily ?? fontFamily, fontWeight: p.fontWeight ?? fontWeight, fontStyle: p.fontStyle ?? (italic ? "italic" : "normal"), underline, charSpacing: letterSpacing * 10, lineHeight, textAlign, opacity: textOpacity / 100, textBackgroundColor: textBackground === "transparent" ? "" : textBackground, stroke: selectedEffect === "outline" ? "#1a1a2e" : "", strokeWidth: selectedEffect === "outline" ? 1 : 0, shadow: selectedEffect === "shadow" ? new fabric.Shadow({ color: "rgba(0,0,0,.45)", blur: 4, offsetX: 3, offsetY: 3 }) : selectedEffect === "glow" ? new fabric.Shadow({ color: p.fill ?? fontColor, blur: 12 }) : null });
    fabricCanvas.current.renderAll();
  };

  useEffect(() => {
    if (!model?.templates.some((item) => item.id === templateId)) setTemplateId(model?.templates[0]?.id ?? "");
  }, [model, templateId]);

  const addText = async () => {
    if (!text.trim() || !fabricCanvas.current) return;
    const fabric = await import("fabric");
    const item = new fabric.IText(text.trim(), { left: 72, top: 180, fill: fontColor, fontSize, fontFamily, textAlign, fontWeight, fontStyle: italic ? "italic" : "normal", underline, charSpacing: letterSpacing * 10, lineHeight, opacity: textOpacity / 100, textBackgroundColor: textBackground });
    fabricCanvas.current.add(item); fabricCanvas.current.setActiveObject(item); await applyTextSettings(); fabricCanvas.current.renderAll(); setText("");
  };

  const addEmoji = async (emoji: string) => {
    if (!fabricCanvas.current) return;
    const fabric = await import("fabric");
    const item = new fabric.IText(emoji, { left: 120, top: 245, fontSize: 42 });
    fabricCanvas.current.add(item); fabricCanvas.current.setActiveObject(item); fabricCanvas.current.renderAll();
  };

  // Downscale + re-encode the upload before it enters the canvas. fabric serialises an image's
  // full data URL into the saved design JSON, so a raw multi-MB photo would blow past the
  // checkout size limit and make the custom order un-submittable. Bounding it here keeps the
  // "upload your photo" feature working end-to-end and keeps saved designs / DB rows small.
  const readDownscaledImage = async (file: File): Promise<string> => {
    const raw = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new window.Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = raw; });
      const maxEdge = 1400;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      if (scale >= 1 && raw.length < 600_000) return raw; // already small enough
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); if (!ctx) return raw;
      ctx.drawImage(img, 0, 0, w, h);
      // Keep PNG (transparency) for PNG sources; everything else re-encodes to compact JPEG.
      return c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
    } catch { return raw; }
  };

  const processImageFile = async (file?: File | null) => {
    if (!file || !fabricCanvas.current) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setMessage("Choose an image smaller than 5 MB."); return; }
    const url = await readDownscaledImage(file);
    const fabric = await import("fabric");
    const image = await fabric.FabricImage.fromURL(url);
    image.scaleToWidth(180); image.set({ left: 60, top: 145 });
    fabricCanvas.current.add(image); fabricCanvas.current.setActiveObject(image); fabricCanvas.current.renderAll();
    setPhotoAdded(true); setMessage("");
  };
  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => { processImageFile(event.target.files?.[0]); event.target.value = ""; };

  const deleteSelected = () => { const active = fabricCanvas.current?.getActiveObject(); if (active) { fabricCanvas.current.remove(active); fabricCanvas.current.discardActiveObject(); fabricCanvas.current.renderAll(); } };
  const moveLayer = (direction: "up" | "down") => { const active = fabricCanvas.current?.getActiveObject(); if (active) { direction === "up" ? fabricCanvas.current.bringObjectForward(active) : fabricCanvas.current.sendObjectBackwards(active); fabricCanvas.current.renderAll(); } };

  const addToCart = () => {
    if (!ready || !fabricCanvas.current || !model || !template) return;
    const previewImage = fabricCanvas.current.toDataURL({ format: "png", multiplier: 1.5 });
    const canvasJson = JSON.stringify(fabricCanvas.current.toJSON());
    const productId = `custom-${Date.now()}`;
    addItem({ productId, title: `Custom ${model.name} Cover`, price: template.price, imageUrl: previewImage, productType: "customized_cover", customDesign: { mobileModel: model.name, templateId: template.id, templateName: template.name, canvasJson, previewImage, coverColor: coverColor.name, colorHex: coverColor.hex, selectedColorName: coverColor.name, textDetails: { text, fontFamily, fontSize, fontWeight, italic, underline, letterSpacing, lineHeight, textAlign, textOpacity, fontColor, textBackground, effect, styleName } } });
    router.push("/cart");
  };

  return <div className="util-dark design-studio studio-premium max-w-6xl mx-auto px-4 py-10 sm:px-6">
    <section className="relative isolate mb-8 overflow-hidden rounded-2xl bg-ink-950 text-white shadow-xl ring-1 ring-white/10">
      <ManufacturingCinematic className="absolute inset-0" />
      {/* readability scrim — only backs the left-side copy; the footage on the
          right keeps its real factory colour (no full-frame filter) */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-ink-950/90 via-ink-950/35 to-transparent" />
      <div className="relative z-20 flex min-h-[280px] flex-col justify-center gap-3 px-6 py-10 sm:min-h-[340px] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-300">Custom Cover Studio</p>
        <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-4xl">You design it. <span className="text-accent-300">We make it.</span></h1>
        <p className="max-w-md text-sm text-slate-300 sm:text-base">Upload images, add text, and craft a cover that&apos;s uniquely yours — then watch it come to life on our production line.</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          {["Design", "Print", "Finish", "Inspect", "Ship"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-accent-400/70">&rarr;</span>}
              <span>{s}</span>
            </span>
          ))}
        </div>
      </div>
    </section>

    {/* ================= PREMIUM PRODUCT CONFIGURATOR (below the banner) ================= */}
    <div className="sp-grid grid gap-8 items-start lg:grid-cols-[1fr_380px]">
      {/* -------- LEFT: cinematic product stage -------- */}
      <motion.section
        className="sp-stage-shell"
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.85, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className="sp-stage">
          {/* atmospheric depth + spotlight behind the product (idle-lit) */}
          <div className="sp-ambient" aria-hidden />
          <div className="sp-spotlight" aria-hidden />
          {/* the live fabric canvas — untouched functionally, just re-seated */}
          <div className="sp-canvas-holder">
            <div className="sp-contact-shadow" aria-hidden />
            <canvas ref={htmlCanvasRef} aria-label="Custom cover design canvas" />
            <div className="sp-floor" aria-hidden />
          </div>
          {/* one-shot light pass across the product on load */}
          {!reduce && <div className="sp-sweep" aria-hidden />}
          <div className="sp-vignette" aria-hidden />
          <p className="sp-stage-hint">Drag, resize, rotate or re-layer any element you add.</p>
        </div>
      </motion.section>

      {/* -------- RIGHT: step-by-step control panel (accordion) -------- */}
      <aside className="sp-rail">
        <div className="sp-steps">
          {/* 01 — Choose model */}
          <Step n={1} title="Choose your model" summary={model?.name ?? "Select"} active={activeStep === 1} onToggle={() => toggleStep(1)} reduce={reduce}>
            <label className="sp-field">Mobile model
              <select value={modelId} onChange={(e) => setModelId(e.target.value)}>{Object.entries(catalog.reduce<Record<string, Catalog>>((groups, item) => ({ ...groups, [item.brand]: [...(groups[item.brand] || []), item] }), {})).map(([brand, models]) => <optgroup key={brand} label={brand}>{models.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</optgroup>)}</select>
            </label>
            <p className="sp-hint">The preview reshapes its case outline and camera cutout for the selected phone.</p>
          </Step>

          {/* 02 — Choose cover */}
          <Step n={2} title="Choose your cover" summary={template ? `${template.name} · Rs. ${(template.price / 100).toFixed(0)}` : "Select"} active={activeStep === 2} onToggle={() => toggleStep(2)} reduce={reduce}>
            <label className="sp-field">Cover template
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{model?.templates.map((item) => <option value={item.id} key={item.id}>{item.name} — Rs. {(item.price / 100).toFixed(0)}</option>)}</select>
            </label>
            {catalogError && <p className="text-sm text-red-400">{catalogError}</p>}
          </Step>

          {/* 03 — Add your design (drag-and-drop) */}
          <Step n={3} title="Add your design" summary={photoAdded ? "Photo added" : "Optional"} active={activeStep === 3} onToggle={() => toggleStep(3)} reduce={reduce}>
            <label
              className={`sp-drop ${dragOver ? "is-drag" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); processImageFile(e.dataTransfer.files?.[0]); }}
            >
              <input type="file" accept="image/*" onChange={uploadImage} className="sp-sr-only" />
              <span className="sp-drop-title">Drop your artwork</span>
              <span className="sp-drop-or">or</span>
              <span className="sp-drop-btn">Upload image</span>
              <span className="sp-drop-note">JPG or PNG · up to 5 MB</span>
            </label>
            <p className="sp-hint">Drag it into place on the cover once it appears.</p>
          </Step>

          {/* 04 — Cover color */}
          <Step n={4} title="Cover color" summary={coverColor.name} active={activeStep === 4} onToggle={() => toggleStep(4)} reduce={reduce}>
            <div className="flex flex-wrap gap-2">{coverColors.map((color) => <button key={color.name} title={color.name} onClick={() => setCoverColor(color)} className={`sp-swatch ${coverColor.name === color.name ? "is-active" : ""}`} style={{ backgroundColor: color.hex }} />)}</div>
            <label className="sp-inline">Custom HEX <input type="color" value={coverColor.hex} onChange={(e) => setCoverColor({ name: "Custom", hex: e.target.value })} /></label>
          </Step>

          {/* 05 — Customize text */}
          <Step n={5} title="Customize text" summary={styleName} active={activeStep === 5} onToggle={() => toggleStep(5)} reduce={reduce}>
            <div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a name or message" className="min-w-0 flex-1" /><button onClick={addText} className="sp-add">Add</button></div>
            <div className="flex gap-3 items-center"><input aria-label="Text color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} /><input aria-label="Font size" type="range" min="14" max="64" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1" /><span className="text-xs text-slate-400">{fontSize}px</span></div>
            <div className="flex gap-2">{["♥", "★", "☺", "✦"].map((emoji) => <button key={emoji} onClick={() => addEmoji(emoji)} className="sp-chip">{emoji}</button>)}</div>
            <div className="sp-divider" />
            <div className="grid grid-cols-2 gap-2"><select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="text-sm">{["Poppins","Montserrat","Roboto","Inter","Pacifico","Dancing Script","Playfair Display","Great Vibes"].map((font) => <option key={font}>{font}</option>)}</select><select value={fontWeight} onChange={(e) => { setFontWeight(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="text-sm"><option value="normal">Regular</option><option value="bold">Bold</option></select></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => { setItalic(!italic); setTimeout(() => applyTextSettings(), 0); }} className={`sp-chip italic ${italic ? "is-active" : ""}`}>Italic</button><button onClick={() => { setUnderline(!underline); setTimeout(() => applyTextSettings(), 0); }} className={`sp-chip underline ${underline ? "is-active" : ""}`}>Underline</button><select value={textAlign} onChange={(e) => { setTextAlign(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="text-sm"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400"><label>Letter spacing<input type="range" min="0" max="20" value={letterSpacing} onChange={(e) => { setLetterSpacing(Number(e.target.value)); setTimeout(() => applyTextSettings(), 0); }} className="w-full" /></label><label>Opacity<input type="range" min="10" max="100" value={textOpacity} onChange={(e) => { setTextOpacity(Number(e.target.value)); setTimeout(() => applyTextSettings(), 0); }} className="w-full" /></label></div>
            <label className="sp-inline text-xs">Text background <input type="color" value={textBackground} onChange={(e) => { setTextBackground(e.target.value); setTimeout(() => applyTextSettings(), 0); }} /></label>
            <div><p className="sp-sublabel">Style presets</p><div className="flex flex-wrap gap-1.5">{Object.keys(presets).map((name) => <button key={name} onClick={() => { setStyleName(name); applyTextSettings(name); }} className={`sp-chip ${styleName === name ? "is-active" : ""}`}>{name}</button>)}</div></div>
            <div><p className="sp-sublabel">Text effect</p><div className="flex flex-wrap gap-1.5">{["none", "shadow", "glow", "outline"].map((name) => <button key={name} onClick={() => { setEffect(name); setTimeout(() => applyTextSettings(), 0); }} className={`sp-chip capitalize ${effect === name ? "is-active" : ""}`}>{name}</button>)}</div></div>
          </Step>

          {/* 06 — Arrange layers */}
          <Step n={6} title="Arrange layers" summary="Reorder & delete" active={activeStep === 6} onToggle={() => toggleStep(6)} reduce={reduce}>
            <div className="flex gap-2"><button onClick={() => moveLayer("up")} className="sp-chip">Bring forward</button><button onClick={() => moveLayer("down")} className="sp-chip">Send back</button><button onClick={deleteSelected} className="sp-chip sp-danger">Delete</button></div>
          </Step>

          {message && <p className="text-sm text-red-400">{message}</p>}
        </div>

        {/* premium sticky Add-to-Cart dock — always visible, fires the real cart action immediately */}
        <div className="sp-cta-dock">
          <button onClick={addToCart} disabled={!ready || !template} className="sp-cta bg-brand disabled:opacity-50">
            <span className="sp-cta-label">Add customized cover</span>
            <span className="sp-cta-price">Rs. {((template?.price || 0) / 100).toFixed(0)}</span>
            <span className="sp-cta-arrow" aria-hidden>&rarr;</span>
          </button>
          <Link href="/cart" className="block text-center text-sm text-accent-300">View cart</Link>
        </div>
      </aside>
    </div>

    {/* ================= SUPPORTING CONTENT ================= */}
    <div className="sp-strip">
      {["Premium quality", "Scratch resistant", "Vibrant colors", "Fast & safe delivery"].map((item, i) => (
        <span key={item} className="flex items-center gap-3 sm:gap-4">
          {i > 0 && <span className="sp-strip-sep" aria-hidden>&bull;</span>}
          <span className="sp-strip-item">{item}</span>
        </span>
      ))}
    </div>

    <section className="sp-how mt-6">
      <p className="sp-how-kicker">How it works</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { n: "01", t: "Choose your model", d: "Pick your exact phone — the preview reshapes to fit." },
          { n: "02", t: "Customize your cover", d: "Add photos, text and colour until it feels like yours." },
          { n: "03", t: "We print it", d: "Your design goes straight to our production line." },
        ].map((s, i) => (
          <div key={s.n} className="sp-how-step">
            {i > 0 && <span className="sp-how-arrow" aria-hidden>&rarr;</span>}
            <span className="sp-how-num">{s.n}</span>
            <p className="sp-how-title">{s.t}</p>
            <p className="sp-how-desc">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  </div>;
}

/* ------------------------------------------------------------------ *
 * One configurator step: a compact accordion row (number · title ·
 * current selection · chevron) whose body expands with a smooth
 * height+opacity transition. Only the active step's body is mounted.
 * ------------------------------------------------------------------ */
function Step({ n, title, summary, active, onToggle, reduce, children }: {
  n: number;
  title: string;
  summary: string;
  active: boolean;
  onToggle: () => void;
  reduce: boolean | null;
  children: ReactNode;
}) {
  return (
    <section className={`sp-acc ${active ? "is-open" : ""}`}>
      <button type="button" className="sp-acc-head" onClick={onToggle} aria-expanded={active}>
        <span className="sp-num">{String(n).padStart(2, "0")}</span>
        <span className="sp-acc-title">{title}</span>
        <span className="sp-acc-summary">{active ? "" : summary}</span>
        <svg className="sp-acc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="sp-acc-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
