// Sugerencias de la IA en producción (Netlify Function).
//
// Equivalente a /api/suggest de serve.py, que solo corre en local: Netlify no
// ejecuta Python. Sin dependencias a propósito — llama a la API REST de Gemini
// con fetch, así no hay nada que instalar ni que se rompa al actualizar.
//
// La clave se configura en Netlify (Site settings → Environment variables),
// nunca en el repositorio.

const API = "https://generativelanguage.googleapis.com/v1beta";

const MODELOS_PREFERIDOS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3-flash",
  "gemini-2.5-flash",
];
const EXCLUIR = ["-image", "-tts", "embedding", "-audio", "-live", "-native-audio"];

const SYSTEM = `Eres el asistente de redacción del Creador de Manuales de Plataform, \
una plataforma colombiana de financiación de facturas (confirming, pagadores, \
inversionistas).

Escribes pasos de manuales instructivos internos. Reglas:
- Español de Colombia, tuteando a quien lee.
- El título es una acción corta en imperativo, máximo 6 palabras. Sin punto final.
- La descripción son 1 o 2 frases: qué ve la persona y qué tiene que hacer.
- Nombra los elementos de la pantalla tal como aparecen escritos en la captura.
- No inventes botones, menús ni datos que no se vean. Si la captura no se \
entiende, descríbela de forma genérica en vez de suponer.
- Nada de relleno ni de frases como "en esta pantalla podrás".`;

// Se conservan entre invocaciones mientras la función siga caliente.
let modeloResuelto = null;
const descartados = new Set();

async function resolverModelo(key) {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  if (modeloResuelto) return modeloResuelto;

  const res = await fetch(`${API}/models?key=${key}&pageSize=200`);
  if (!res.ok) throw new Error(`no se pudo listar modelos: ${res.status}`);
  const { models = [] } = await res.json();

  const disponibles = models
    .filter((m) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => (m.name || "").replace("models/", ""))
    .filter((n) => n && !EXCLUIR.some((x) => n.includes(x)) && !descartados.has(n));

  for (const preferido of MODELOS_PREFERIDOS) {
    const hit = disponibles.find((n) => n.startsWith(preferido));
    if (hit) return (modeloResuelto = hit);
  }
  const flash = disponibles.find((n) => n.includes("flash"));
  if (flash) return (modeloResuelto = flash);

  throw new Error("ningún modelo de Gemini utilizable en esta cuenta");
}

function construirPrompt(kind, ctx) {
  const manual = ctx.manualTitle || "(sin título todavía)";
  const area = ctx.area || "(sin área)";
  const vecinos = (ctx.neighbourTitles || []).filter(Boolean);
  const lista = vecinos.length
    ? vecinos.map((t) => `- ${t}`).join("\n")
    : "- (todavía no hay otros pasos escritos)";

  if (kind === "manual-title") {
    return `Propón el título de un manual del área ${area}, a partir de los pasos que lo componen.

Pasos:
${lista}

La portada ya imprime «Manual Instructivo» encima del título, así que NO empieces por «Manual de» ni repitas esa palabra. Máximo 6 palabras. Nombra el procedimiento completo, no un paso suelto.`;
  }

  if (kind === "heading") {
    return `Escribe el título y el texto de una SECCIÓN que agrupa los pasos siguientes del manual «${manual}» (área ${area}).

Pasos del manual:
${lista}

El título nombra el bloque (no es un paso); el texto explica en una frase qué cubre la sección.`;
  }

  if (kind === "callout") {
    return `Escribe un AVISO para el manual «${manual}» (área ${area}): una advertencia, excepción o cosa que suele salir mal en este punto.

Pasos alrededor:
${lista}

El título es corto (por ejemplo «Ten en cuenta»); el texto explica el riesgo concreto en una o dos frases.`;
  }

  return `Esta es la captura del paso ${ctx.stepNumber} del manual «${manual}» (área ${area}).

Otros pasos ya escritos:
${lista}

Mira la captura y escribe el título y la descripción de ESTE paso, basándote solo en lo que se ve en ella.`;
}

async function pedirSugerencia(key, payload) {
  const kind = payload.kind || "shot";
  const ctx = payload.context || {};

  const parts = [];
  if (payload.image) {
    parts.push({
      inline_data: { mime_type: payload.mediaType || "image/png", data: payload.image },
    });
  }
  parts.push({ text: construirPrompt(kind, ctx) });

  const properties = { title: { type: "STRING" } };
  const required = ["title"];
  if (kind !== "manual-title") {
    properties.desc = { type: "STRING" };
    required.push("desc");
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
      responseSchema: { type: "OBJECT", properties, required },
      // Sin esto el modelo razona largo y la sugerencia tarda decenas de segundos.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  // Google lista modelos que luego devuelven 404: se descartan y se reintenta.
  for (let intento = 0; intento < 3; intento += 1) {
    const modelo = await resolverModelo(key);
    const res = await fetch(`${API}/models/${modelo}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 404) {
      descartados.add(modelo);
      modeloResuelto = null;
      continue;
    }
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Gemini respondió ${res.status}: ${detalle.slice(0, 300)}`);
    }

    const data = await res.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) throw new Error("el modelo no devolvió texto (¿filtro de seguridad?)");

    const datos = JSON.parse(texto);
    const salida = { title: String(datos.title).trim() };
    if (datos.desc !== undefined) salida.desc = String(datos.desc).trim();
    return salida;
  }

  throw new Error("ningún modelo de Gemini respondió");
}

export default async (req) => {
  const json = (code, body) =>
    new Response(JSON.stringify(body), {
      status: code,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  if (req.method !== "POST") return json(405, { error: "usa POST" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json(503, {
      error: "El sitio no tiene GEMINI_API_KEY. Configúrala en Netlify: " +
             "Site settings → Environment variables.",
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "petición mal formada" });
  }

  try {
    return json(200, await pedirSugerencia(key, payload));
  } catch (err) {
    console.error("[suggest]", err);
    return json(502, { error: err?.message || String(err) });
  }
};

export const config = { path: "/api/suggest" };
