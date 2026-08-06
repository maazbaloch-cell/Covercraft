"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartStore";

type Catalog = { id: string; name: string; brand: string; templates: { id: string; name: string; price: number; imageUrl?: string | null }[] }[];

const coverColors = [{ name: "Black", hex: "#161616" }, { name: "White", hex: "#ffffff" }, { name: "Red", hex: "#dc2626" }, { name: "Blue", hex: "#2563eb" }, { name: "Green", hex: "#16a34a" }, { name: "Pink", hex: "#ec4899" }, { name: "Purple", hex: "#7c3aed" }, { name: "Gold", hex: "#d4a72c" }, { name: "Silver", hex: "#a8a8a8" }, { name: "Transparent", hex: "#dfe3e8" }];
const presets: Record<string, any> = { Minimal: { fontFamily: "Inter", fontSize: 24, fill: "#1a1a2e" }, Luxury: { fontFamily: "Playfair Display", fontSize: 32, fill: "#d4a72c", fontWeight: "bold" }, Neon: { fontFamily: "Montserrat", fontSize: 30, fill: "#ec4899", shadow: "glow" }, Bold: { fontFamily: "Roboto", fontSize: 38, fill: "#1a1a2e", fontWeight: "bold" }, Signature: { fontFamily: "Dancing Script", fontSize: 36, fill: "#1a1a2e", fontStyle: "italic" }, Elegant: { fontFamily: "Great Vibes", fontSize: 38, fill: "#7c3aed" } };

export default function CustomCoverDesigner() {
  const router = useRouter();
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
      const canvas = new fabric.Canvas(htmlCanvasRef.current, { width: 300, height: 440, backgroundColor: "#f3f4f6", preserveObjectStacking: true });
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

      const modelName = `${model.brand} ${model.name}`.toLowerCase();
      const isIphone = modelName.includes("iphone") || model.brand.toLowerCase() === "apple";
      const isPixel = modelName.includes("pixel") || model.brand.toLowerCase() === "google";
      const isSamsung = modelName.includes("samsung") || model.brand.toLowerCase() === "samsung";
      const isXiaomi = model.brand.toLowerCase() === "xiaomi" || modelName.includes("redmi");
      const isOnePlus = model.brand.toLowerCase() === "oneplus";
      const isOppoVivo = ["oppo", "vivo", "realme"].includes(model.brand.toLowerCase());
      const isHuawei = model.brand.toLowerCase() === "huawei";
      const isTecnoInfinix = ["tecno", "infinix"].includes(model.brand.toLowerCase());

      cameraParts.current.forEach((part) => canvas.remove(part));
      cameraParts.current = [];
      const addPart = (part: any) => { part.set({ selectable: false, evented: false }); cameraParts.current.push(part); canvas.add(part); };
      const makeCircle = (left: number, top: number, radius: number) => new fabric.Circle({ left, top, radius, fill: "#1f2937", stroke: "#94a3b8", strokeWidth: 2 });

    if (isIphone) {
      shell.set({ left: 25, top: 15, width: 250, height: 410, rx: 34, ry: 34 });
      addPart(new fabric.Rect({ left: 45, top: 36, width: 88, height: 92, rx: 21, ry: 21, fill: "#d1d5db" }));
      addPart(makeCircle(57, 48, 15)); addPart(makeCircle(96, 48, 15)); addPart(makeCircle(57, 87, 15));
      addPart(new fabric.Circle({ left: 102, top: 94, radius: 7, fill: "#f8fafc" }));
    } else if (isPixel) {
      shell.set({ left: 25, top: 15, width: 250, height: 410, rx: 30, ry: 30 });
      addPart(new fabric.Rect({ left: 35, top: 55, width: 230, height: 40, rx: 12, ry: 12, fill: "#64748b" }));
      addPart(makeCircle(65, 60, 14)); addPart(makeCircle(108, 60, 14));
    } else if (isSamsung) {
      shell.set({ left: 28, top: 12, width: 244, height: 416, rx: 20, ry: 20 });
      addPart(makeCircle(55, 48, 18)); addPart(makeCircle(55, 98, 18)); addPart(makeCircle(55, 148, 18));
      if (modelName.includes("ultra")) addPart(makeCircle(105, 48, 11));
    } else if (isXiaomi) {
      shell.set({ left: 27, top: 13, width: 246, height: 414, rx: 25, ry: 25 });
      addPart(new fabric.Rect({ left: 43, top: 37, width: 93, height: 100, rx: 18, ry: 18, fill: "#334155" }));
      addPart(makeCircle(57, 51, 17)); addPart(makeCircle(96, 51, 17)); addPart(makeCircle(57, 92, 17));
    } else if (isOnePlus) {
      shell.set({ left: 27, top: 12, width: 246, height: 416, rx: 28, ry: 28 });
      addPart(new fabric.Circle({ left: 58, top: 43, radius: 40, fill: "#334155", stroke: "#94a3b8", strokeWidth: 2 }));
      addPart(makeCircle(69, 54, 12)); addPart(makeCircle(101, 54, 12)); addPart(makeCircle(85, 82, 12));
    } else if (isOppoVivo) {
      shell.set({ left: 28, top: 12, width: 244, height: 416, rx: 24, ry: 24 });
      addPart(new fabric.Rect({ left: 47, top: 42, width: 80, height: 118, rx: 21, ry: 21, fill: "#475569" }));
      addPart(makeCircle(60, 55, 16)); addPart(makeCircle(60, 98, 16)); addPart(makeCircle(99, 55, 12));
    } else if (isHuawei) {
      shell.set({ left: 27, top: 12, width: 246, height: 416, rx: 28, ry: 28 });
      addPart(new fabric.Circle({ left: 57, top: 39, radius: 43, fill: "#334155", stroke: "#94a3b8", strokeWidth: 2 }));
      addPart(makeCircle(68, 50, 12)); addPart(makeCircle(102, 50, 12)); addPart(makeCircle(85, 79, 12));
    } else if (isTecnoInfinix) {
      shell.set({ left: 28, top: 12, width: 244, height: 416, rx: 23, ry: 23 });
      addPart(new fabric.Rect({ left: 48, top: 40, width: 75, height: 125, rx: 20, ry: 20, fill: "#475569" }));
      addPart(makeCircle(59, 52, 16)); addPart(makeCircle(59, 96, 16)); addPart(makeCircle(59, 140, 16));
    } else {
      shell.set({ left: 27, top: 14, width: 246, height: 412, rx: 24, ry: 24 });
      addPart(new fabric.Rect({ left: 47, top: 42, width: 76, height: 88, rx: 18, ry: 18, fill: "#cbd5e1" }));
      addPart(makeCircle(59, 54, 16)); addPart(makeCircle(93, 91, 16));
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

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas.current) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setMessage("Choose an image smaller than 5 MB."); return; }
    const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    const fabric = await import("fabric");
    const image = await fabric.FabricImage.fromURL(url);
    image.scaleToWidth(180); image.set({ left: 60, top: 145 });
    fabricCanvas.current.add(image); fabricCanvas.current.setActiveObject(image); fabricCanvas.current.renderAll();
  };

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

  return <div className="design-studio max-w-6xl mx-auto px-6 py-10">
    <div className="mb-8"><p className="text-sm text-brand-accent font-semibold uppercase tracking-wide">Create your own</p><h1 className="text-3xl font-bold">Custom Mobile Cover Designer</h1><p className="text-gray-600 mt-2">Upload images, add text and make a cover that is uniquely yours.</p></div>
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <section className="bg-white border rounded-xl p-5 shadow-sm"><div className="flex justify-center bg-gray-50 rounded-xl py-6"><canvas ref={htmlCanvasRef} aria-label="Custom cover design canvas" /></div><p className="text-center text-xs text-gray-500 mt-3">Select an item to move, resize, rotate, or change its layer.</p></section>
      <aside className="space-y-5">
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-semibold">1. Choose your cover</h2><label className="block text-sm">Mobile model<select value={modelId} onChange={(e) => setModelId(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">{Object.entries(catalog.reduce<Record<string, Catalog>>((groups, item) => ({ ...groups, [item.brand]: [...(groups[item.brand] || []), item] }), {})).map(([brand, models]) => <optgroup key={brand} label={brand}>{models.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</optgroup>)}</select></label><p className="text-xs text-gray-500">The preview changes its case outline and camera cutout for the selected phone family.</p><label className="block text-sm">Cover template<select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">{model?.templates.map((item) => <option value={item.id} key={item.id}>{item.name} — Rs. {(item.price / 100).toFixed(0)}</option>)}</select></label>{catalogError && <p className="text-sm text-red-500">{catalogError}</p>}</section>
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-semibold">2. Personalize</h2><label className="block text-sm">Upload a photo<input type="file" accept="image/*" onChange={uploadImage} className="mt-1 block w-full text-sm" /></label><div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a name or message" className="min-w-0 flex-1 border rounded px-3 py-2" /><button onClick={addText} className="bg-brand text-white px-3 rounded">Add</button></div><div className="flex gap-3 items-center"><input aria-label="Text color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} /><input aria-label="Font size" type="range" min="14" max="64" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1" /><span className="text-xs">{fontSize}px</span></div><div className="flex gap-2">{["♥", "★", "☺", "✦"].map((emoji) => <button key={emoji} onClick={() => addEmoji(emoji)} className="border rounded px-3 py-1 hover:bg-gray-50">{emoji}</button>)}</div></section>
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-semibold">Cover color</h2><div className="flex flex-wrap gap-2">{coverColors.map((color) => <button key={color.name} title={color.name} onClick={() => setCoverColor(color)} className={`h-7 w-7 rounded-full border-2 ${coverColor.name === color.name ? "border-brand" : "border-white"}`} style={{ backgroundColor: color.hex }} />)}</div><label className="block text-sm">Custom HEX <input type="color" value={coverColor.hex} onChange={(e) => setCoverColor({ name: "Custom", hex: e.target.value })} /></label></section>
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-semibold">Advanced text</h2><div className="grid grid-cols-2 gap-2"><select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-2 py-2 text-sm">{["Poppins","Montserrat","Roboto","Inter","Pacifico","Dancing Script","Playfair Display","Great Vibes"].map((font) => <option key={font}>{font}</option>)}</select><select value={fontWeight} onChange={(e) => { setFontWeight(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-2 py-2 text-sm"><option value="normal">Regular</option><option value="bold">Bold</option></select></div><div className="flex gap-2"><button onClick={() => { setItalic(!italic); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-3 py-1 text-sm italic">Italic</button><button onClick={() => { setUnderline(!underline); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-3 py-1 text-sm underline">Underline</button><select value={textAlign} onChange={(e) => { setTextAlign(e.target.value); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-2 py-1 text-sm"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div><div className="grid grid-cols-2 gap-2 text-xs"><label>Letter spacing<input type="range" min="0" max="20" value={letterSpacing} onChange={(e) => { setLetterSpacing(Number(e.target.value)); setTimeout(() => applyTextSettings(), 0); }} className="w-full" /></label><label>Opacity<input type="range" min="10" max="100" value={textOpacity} onChange={(e) => { setTextOpacity(Number(e.target.value)); setTimeout(() => applyTextSettings(), 0); }} className="w-full" /></label></div><label className="text-xs">Text background <input type="color" value={textBackground} onChange={(e) => { setTextBackground(e.target.value); setTimeout(() => applyTextSettings(), 0); }} /></label><div className="flex flex-wrap gap-1">{Object.keys(presets).map((name) => <button key={name} onClick={() => { setStyleName(name); applyTextSettings(name); }} className="border rounded px-2 py-1 text-xs">{name}</button>)}</div><div className="flex flex-wrap gap-1">{["none", "shadow", "glow", "outline"].map((name) => <button key={name} onClick={() => { setEffect(name); setTimeout(() => applyTextSettings(), 0); }} className="border rounded px-2 py-1 text-xs capitalize">{name}</button>)}</div></section>
        <section className="bg-white border rounded-xl p-5"><h2 className="font-semibold mb-3">3. Arrange layers</h2><div className="flex gap-2"><button onClick={() => moveLayer("up")} className="border rounded px-3 py-2 text-sm">Bring forward</button><button onClick={() => moveLayer("down")} className="border rounded px-3 py-2 text-sm">Send back</button><button onClick={deleteSelected} className="text-red-500 border border-red-200 rounded px-3 py-2 text-sm">Delete</button></div></section>
        {message && <p className="text-sm text-red-500">{message}</p>}<button onClick={addToCart} disabled={!ready || !template} className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-accent disabled:opacity-50">Add Customized Cover to Cart — Rs. {((template?.price || 0) / 100).toFixed(0)}</button><Link href="/cart" className="block text-center text-sm text-brand-accent">View cart</Link>
      </aside>
    </div>
  </div>;
}
