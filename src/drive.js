// Subida a Google Drive desde el navegador.
//
// Usa Google Identity Services para pedir un token de acceso y la REST API de
// Drive para crear la carpeta del área y subir el PDF. No hay servidor: el
// token vive en memoria y se pide de nuevo cuando caduca.

import { GOOGLE_CLIENT_ID, DRIVE_SCOPE, DRIVE_ROOT_FOLDER_ID } from "./config.js";
import { loadGis } from "./gis.js";

const FOLDER_MIME = "application/vnd.google-apps.folder";

let token = null;        // { value, expiresAt }
let tokenClient = null;

/**
 * Devuelve un token de acceso válido, pidiéndolo al usuario si hace falta.
 * La primera vez abre el diálogo de permisos de Google; después reutiliza el
 * token hasta que caduca.
 */
async function getAccessToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Falta el Client ID de Google. Pégalo en src/config.js.");
  }
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;

  await loadGis();

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: () => {},          // reemplazado en cada petición
    });
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      token = {
        value: resp.access_token,
        expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000,
      };
      resolve(token.value);
    };
    try {
      // '' deja que Google decida si mostrar el diálogo o reusar el consentimiento
      tokenClient.requestAccessToken({ prompt: token ? "" : "consent" });
    } catch (err) {
      reject(err);
    }
  });
}

async function driveFetch(url, options, what) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body && body.error && body.error.message ? ` — ${body.error.message}` : "";
    } catch { /* la respuesta no era JSON */ }
    if (res.status === 401 || res.status === 403) token = null;   // fuerza reautorización
    throw new Error(`${what}: ${res.status}${detail}`);
  }
  return res.json();
}

/** Busca la carpeta del área dentro de la carpeta raíz; la crea si no existe. */
async function findOrCreateFolder(name, parentId, accessToken) {
  const safe = String(name).replace(/'/g, "\\'");
  const q = `name = '${safe}' and mimeType = '${FOLDER_MIME}' and '${parentId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;

  const found = await driveFetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, "buscando la carpeta del área");

  if (found.files && found.files.length) return found.files[0];

  return driveFetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  }, "creando la carpeta del área");
}

/** Sube el PDF a la carpeta indicada (multipart: metadatos + contenido). */
async function uploadPdf(blob, filename, folderId, accessToken) {
  const boundary = "creadordemanuales" + Math.random().toString(36).slice(2);
  const metadata = { name: filename, mimeType: "application/pdf", parents: [folderId] };

  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    blob,
    `\r\n--${boundary}--\r\n`,
  ]);

  return driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
    "subiendo el PDF"
  );
}

/**
 * Sube el manual: crea (o encuentra) la carpeta del área dentro de
 * "Manuales - Plataform" y deja el PDF ahí.
 * Devuelve { file, folder } con el enlace para abrirlo.
 */
export async function sendManualToDrive({ blob, filename, area }) {
  const accessToken = await getAccessToken();
  const folder = await findOrCreateFolder(area || "Sin área", DRIVE_ROOT_FOLDER_ID, accessToken);
  const file = await uploadPdf(blob, filename, folder.id, accessToken);
  return { file, folder };
}

export function isDriveConfigured() {
  return !!GOOGLE_CLIENT_ID;
}
