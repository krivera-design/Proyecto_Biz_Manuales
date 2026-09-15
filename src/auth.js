// Inicio de sesión con Google, restringido al dominio de Plataform.
//
// AVISO: la comprobación del dominio se hace leyendo el token en el navegador,
// así que sirve para guiar al usuario, no como barrera de seguridad — cualquiera
// puede saltársela desde las herramientas del navegador. Una barrera real exige
// un backend que valide la firma del token. Lo que sí está protegido de verdad
// es Drive: esas llamadas usan un token OAuth que valida Google.

import { GOOGLE_CLIENT_ID } from "./config.js";
import { loadGis } from "./gis.js";

export const ALLOWED_DOMAIN = "plataform.com";

function decodeJwt(token) {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  // el payload viaja en UTF-8; atob devuelve bytes sueltos
  return JSON.parse(decodeURIComponent(escape(json)));
}

function initials(name, email) {
  const src = (name || email || "").trim();
  const parts = src.split(/[\s.@]+/).filter(Boolean);
  return ((parts[0] || "").charAt(0) + (parts[1] || "").charAt(0)).toUpperCase() || "?";
}

/**
 * Pinta el botón oficial de Google dentro de `el`.
 * `onUser` recibe { name, email, picture, initials, domainOk }.
 */
export async function renderGoogleButton(el, onUser, onError) {
  if (!GOOGLE_CLIENT_ID) {
    onError(new Error("Falta el Client ID de Google. Pégalo en src/config.js."));
    return;
  }
  try {
    await loadGis();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // sugiere a Google que muestre solo cuentas del dominio
      hd: ALLOWED_DOMAIN,
      callback: (resp) => {
        try {
          const p = decodeJwt(resp.credential);
          const email = (p.email || "").toLowerCase();
          onUser({
            name: p.name || email,
            email,
            picture: p.picture || "",
            initials: initials(p.name, email),
            domainOk: p.hd === ALLOWED_DOMAIN || email.endsWith("@" + ALLOWED_DOMAIN),
          });
        } catch (err) {
          onError(err);
        }
      },
    });

    el.replaceChildren();
    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "center",
      locale: "es",
      width: 340,
    });
  } catch (err) {
    onError(err);
  }
}

export function signOutGoogle() {
  try { window.google?.accounts?.id?.disableAutoSelect(); } catch { /* aún no cargado */ }
}
