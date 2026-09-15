// Manual → PDF export.
//
// Page geometry follows the design system's cover artwork (612×792pt), so the
// portada and contraportada sit full-bleed without distortion and their type
// lands where the app places it. Mr Eaves is embedded so the file carries the
// brand typeface rather than falling back to a system font.

import { cover } from "./covers.js";

const W = 612, H = 792, MARGIN = 64;

const VIOLETA = [0x7B, 0x00, 0xCD];
const TEXTO   = [0x3C, 0x3C, 0x3C];
const GRIS    = [0x72, 0x72, 0x72];
const GRIS_L  = [0x9E, 0xA1, 0xA2];
const LINEA   = [0xEB, 0xEC, 0xEC];
const FILL    = [0xF3, 0xF3, 0xF3];

const FONT_DIR = "assets/_ds/assets/fonts";
const FACES = [
  { file: "MrEavesXLModOT-Book.ttf", style: "normal" },
  { file: "MrEavesXLModOT-Bold.ttf", style: "bold" },
];

function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Chunked so a ~120KB font doesn't blow the argument limit of String.fromCharCode.
function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

let fontCache = null;
async function embedFonts(doc) {
  if (!fontCache) {
    fontCache = await Promise.all(FACES.map(async (f) => ({
      ...f,
      data: bufferToBase64(await (await fetch(`${FONT_DIR}/${f.file}`)).arrayBuffer()),
    })));
  }
  fontCache.forEach((f) => {
    doc.addFileToVFS(f.file, f.data);
    doc.addFont(f.file, "eaves", f.style);
  });
}

const imageCache = new Map();
async function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("no se pudo cargar " + src));
    el.src = src;
  });
  imageCache.set(src, img);
  return img;
}

// Draws an image contained inside a box, preserving its aspect ratio.
function drawContained(doc, img, x, y, w, h, pad = 8) {
  const scale = Math.min((w - pad * 2) / img.naturalWidth, (h - pad * 2) / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  doc.addImage(img, "PNG", x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

// El icono "info" de Material Symbols (contorno), dibujado con primitivas:
// el PDF no lleva la fuente de iconos, así que se traza a mano sobre la
// retícula de 24×24 del original. `size` es el diámetro en puntos.
function infoIcon(doc, cx, cy, size, rgb) {
  const u = size / 24;
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(2 * u);
  doc.circle(cx, cy, 10 * u, "S");          // aro
  doc.circle(cx, cy - 4.5 * u, 1.15 * u, "F"); // punto
  doc.setLineCap("round");
  doc.line(cx, cy - 0.5 * u, cx, cy + 5 * u);  // asta
  doc.setLineCap("butt");
  doc.setLineWidth(0.7);
}

// ---- page chrome ----------------------------------------------------------
function chrome(doc, eyebrow, folio) {
  doc.setFont("eaves", "bold").setFontSize(10);
  setColor(doc, GRIS_L);
  doc.text(eyebrow.toUpperCase(), MARGIN, MARGIN + 8);

  // "plataform" wordmark, right aligned
  setColor(doc, VIOLETA);
  doc.setFont("eaves", "bold").setFontSize(13);
  const plataW = doc.getTextWidth("plata");
  doc.setFont("eaves", "normal");
  const formW = doc.getTextWidth("form");
  const wx = W - MARGIN - (plataW + formW);
  doc.setFont("eaves", "bold");
  doc.text("plata", wx, MARGIN + 8);
  doc.setFont("eaves", "normal");
  doc.text("form", wx + plataW, MARGIN + 8);

  doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]).setLineWidth(0.7);
  doc.line(MARGIN, MARGIN + 22, W - MARGIN, MARGIN + 22);
  doc.line(MARGIN, H - MARGIN - 18, W - MARGIN, H - MARGIN - 18);

  doc.setFont("eaves", "normal").setFontSize(9);
  setColor(doc, GRIS);
  doc.text("Documento interno", MARGIN, H - MARGIN - 4);
  doc.text(folio, W - MARGIN, H - MARGIN - 4, { align: "right" });
}

// ---- covers ---------------------------------------------------------------
async function coverFront(doc, cv, title) {
  doc.addImage(await loadImage(cv.front), "PNG", 0, 0, W, H);
  const size = W * 0.0327;               // 3.27cqw, as on screen
  const top = parseFloat(cv.titleTop) / 100 * H;
  setColor(doc, hexToRgb(cv.tc));

  doc.setFont("eaves", "normal").setFontSize(size);
  doc.text("Manual Instructivo", W / 2, top + size, { align: "center" });

  doc.setFont("eaves", "bold");
  const lines = doc.splitTextToSize(title, W * 0.82);
  lines.forEach((ln, i) => doc.text(ln, W / 2, top + size * (2.2 + i * 1.2), { align: "center" }));
}

async function coverBack(doc, cv) {
  doc.addImage(await loadImage(cv.back), "PNG", 0, 0, W, H);

  const size = W * 0.0327;
  doc.setFont("eaves", "bold").setFontSize(size);
  setColor(doc, hexToRgb(cv.backFg));
  const msg = doc.splitTextToSize("¡Visita nuestra página web y Síguenos en nuestras redes sociales!", W * 0.72);
  msg.forEach((ln, i) => doc.text(ln, W / 2, H * 0.474 + size * (1 + i * 1.22), { align: "center" }));

  const small = W * 0.0245;
  doc.setFontSize(small);
  setColor(doc, hexToRgb(cv.pillFg));
  doc.text("¡Clic Aquí!", W / 2, H * 0.662 + small, { align: "center" });
}

// ---- content pages --------------------------------------------------------
async function stepPage(doc, n, pageNo, total, page) {
  chrome(doc, `Paso ${n}`, `Página ${pageNo} de ${total}`);
  const inner = W - MARGIN * 2;
  let y = MARGIN + 44;

  doc.setFont("eaves", "bold").setFontSize(24);
  setColor(doc, VIOLETA);
  const title = doc.splitTextToSize(page.title || `Paso ${n}`, inner);
  title.forEach((ln, i) => doc.text(ln, MARGIN, y + 18 + i * 28));
  y += 18 + title.length * 28;

  if (page.desc) {
    doc.setFont("eaves", "normal").setFontSize(12);
    setColor(doc, TEXTO);
    const desc = doc.splitTextToSize(page.desc, inner);
    desc.forEach((ln, i) => doc.text(ln, MARGIN, y + 14 + i * 18));
    y += 14 + desc.length * 18;
  }

  y += 14;
  const boxH = (H - MARGIN - 34) - y;
  if (boxH > 60) {
    doc.setFillColor(FILL[0], FILL[1], FILL[2]);
    doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]);
    doc.rect(MARGIN, y, inner, boxH, "FD");
    if (page.src) {
      try { drawContained(doc, await loadImage(page.src), MARGIN, y, inner, boxH); }
      catch { /* a capture that no longer resolves falls back to its name */ }
    } else {
      doc.setFont("eaves", "normal").setFontSize(10);
      setColor(doc, GRIS_L);
      doc.text(page.file || "Sin captura", W / 2, y + boxH / 2, { align: "center" });
    }
  }
}

function notePage(doc, kind, pageNo, total, page) {
  chrome(doc, kind === "heading" ? "Sección" : "Aviso", `Página ${pageNo} de ${total}`);
  const inner = W - MARGIN * 2;
  let y = H * 0.36;

  if (kind === "heading") {
    doc.setFont("eaves", "bold").setFontSize(34);
    setColor(doc, VIOLETA);
    const t = doc.splitTextToSize(page.title || "Sección", inner);
    t.forEach((ln, i) => doc.text(ln, MARGIN, y + 26 + i * 38));
    y += 26 + t.length * 38;

    doc.setFillColor(VIOLETA[0], VIOLETA[1], VIOLETA[2]);
    doc.rect(MARGIN, y + 6, 72, 5, "F");
    y += 32;

    if (page.desc) {
      doc.setFont("eaves", "normal").setFontSize(13);
      setColor(doc, TEXTO);
      doc.splitTextToSize(page.desc, inner)
        .forEach((ln, i) => doc.text(ln, MARGIN, y + i * 19));
    }
    return;
  }

  // callout: se mide el texto, se pinta el panel detrás y el icono al lado
  const pad = 26;
  const iconSize = 20;
  const gap = 14;
  const textX = MARGIN + pad + iconSize + gap;
  const textW = inner - pad * 2 - iconSize - gap;

  doc.setFont("eaves", "bold").setFontSize(18);
  const t = doc.splitTextToSize(page.title || "Aviso", textW);
  doc.setFont("eaves", "normal").setFontSize(13);
  const d = page.desc ? doc.splitTextToSize(page.desc, textW) : [];
  const textH = t.length * 22 + (d.length ? 8 + d.length * 19 : 0);
  const panelH = pad * 2 + Math.max(textH, iconSize);

  doc.setFillColor(FILL[0], FILL[1], FILL[2]);
  doc.rect(MARGIN, y, inner, panelH, "F");

  // el icono se alinea con la primera línea del título
  infoIcon(doc, MARGIN + pad + iconSize / 2, y + pad + iconSize / 2 - 1, iconSize, VIOLETA);

  doc.setFont("eaves", "bold").setFontSize(18);
  setColor(doc, TEXTO);
  t.forEach((ln, i) => doc.text(ln, textX, y + pad + 14 + i * 22));

  if (d.length) {
    doc.setFont("eaves", "normal").setFontSize(13);
    const dy = y + pad + 14 + t.length * 22 + 8;
    d.forEach((ln, i) => doc.text(ln, textX, dy + i * 19));
  }
}

/**
 * Builds the manual as a jsPDF document and returns it along with its filename.
 * Kept separate from saving so the same document can be handed to a download,
 * a preview, or an upload.
 * `manual` = { title, area, owner, tplId, pages:[{kind,title,desc,file,src}] }
 */
export async function buildManualPdf(manual) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: [W, H], compress: true });

  await embedFonts(doc);

  const cv = cover(manual.tplId);
  const pages = manual.pages || [];
  const total = pages.length + 2;
  const title = (manual.title || "").trim() || "Título del manual";

  doc.setProperties({
    title,
    author: manual.owner || "",
    subject: `Manual Instructivo · ${manual.area || ""}`,
  });

  await coverFront(doc, cv, title);

  let step = 0;
  for (let i = 0; i < pages.length; i += 1) {
    doc.addPage([W, H]);
    const p = pages[i];
    const kind = p.kind || "shot";
    if (kind === "shot") {
      step += 1;
      await stepPage(doc, step, i + 2, total, p);
    } else {
      notePage(doc, kind, i + 2, total, p);
    }
  }

  doc.addPage([W, H]);
  await coverBack(doc, cv);

  return { doc, filename: `${title}.pdf`, pages: total };
}

/** Builds the manual and hands the browser a PDF to save. */
export async function exportManualPdf(manual) {
  const { doc, filename, pages } = await buildManualPdf(manual);
  doc.save(filename);
  return pages;
}
