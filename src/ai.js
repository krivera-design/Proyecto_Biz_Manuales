// Sugerencias de la IA: manda la captura al servidor, que es quien habla con
// Claude. La clave de la API nunca llega al navegador.

const ENDPOINT = "/api/suggest";
const MAX_SIDE = 1280;   // la captura se reduce antes de enviarla

// Reescala la captura y la devuelve como base64 sin la cabecera data:.
async function encodeCapture(src) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("no se pudo leer la captura"));
    el.src = src;
  });

  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/png");
  return { data: dataUrl.slice(dataUrl.indexOf(",") + 1), mediaType: "image/png" };
}

/** Pide un título para el manual, a partir de los títulos de sus pasos. */
export async function suggestManualTitle(context) {
  return post({ kind: "manual-title", context });
}

/**
 * Pide una sugerencia para la página activa.
 * `page` = { kind, src }, `context` = { manualTitle, area, stepNumber, neighbourTitles }
 */
export async function suggestForPage(page, context) {
  const kind = (page && page.kind) || "shot";
  const body = { kind, context };

  if (kind === "shot" && page && page.src) {
    const { data, mediaType } = await encodeCapture(page.src);
    body.image = data;
    body.mediaType = mediaType;
  }

  return post(body);
}

async function post(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload = null;
  try { payload = await res.json(); } catch { /* respuesta no JSON */ }

  if (!res.ok) {
    throw new Error((payload && payload.error) || `el servidor respondió ${res.status}`);
  }
  return payload;
}
