// ============================================================
//  Google Drive — configuración
// ------------------------------------------------------------
//  Pega aquí el Client ID de OAuth que creaste en Google Cloud.
//  Tiene esta forma:
//    812345678901-a1b2c3d4e5f6g7h8.apps.googleusercontent.com
//
//  El Client ID no es un secreto: viaja en el código del
//  navegador y es normal que se vea. Lo que impide que otro
//  sitio lo use es la lista de "Orígenes autorizados de
//  JavaScript" del proyecto en Google Cloud, que debe incluir
//  exactamente el origen desde el que sirves la app:
//    http://localhost:4173
// ============================================================

export const GOOGLE_CLIENT_ID =
  "939364446007-rhu2jg327gbgv76agiat1p657d2jjgmt.apps.googleusercontent.com";

// Opción A: acceso completo a Drive. Permite escribir dentro de
// "Manuales - Plataform", una carpeta que la app no creó.
// Con la pantalla de consentimiento en modo Interno, Google no
// exige verificación para este scope.
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

// Carpeta destino: "Manuales - Plataform".
export const DRIVE_ROOT_FOLDER_ID = "18xt8V5u6oN5cKdUkLzJundEyKLJ0b1RO";
