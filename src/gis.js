// Carga única de Google Identity Services, compartida por el inicio de sesión
// y por la subida a Drive.

const GIS_SRC = "https://accounts.google.com/gsi/client";
let gisPromise = null;

export function loadGis() {
  if (window.google && window.google.accounts) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GIS_SRC;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("no se pudo cargar Google Identity Services (¿sin conexión?)"));
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}
