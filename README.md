# Proyecto_Biz_Manuales

Proyecto de creación de manuales para Biz Nation.

---

Implementation of `ProductLab.dc.html` from the Claude Design project
*Creador de manuales*, built against the **Plataform / Mesfix** design system.

## Running

```bash
python3 serve.py          # → http://localhost:4173
```

Para las sugerencias de la IA hace falta una clave de Google AI Studio, que es
**gratuita** (con límites de uso diarios): https://aistudio.google.com/apikey

Copia `.env.example` como `.env` y pega la tuya:

```
GEMINI_API_KEY=...
```

El servidor lee ese archivo al arrancar, así que la clave se pone una sola vez
y funciona sin importar cómo se lance (terminal, editor, botón de preview). Lo
que ya esté en el entorno tiene prioridad, y `.env` está en `.gitignore`.

Sin la clave la app funciona entera menos las sugerencias, que devuelven un
error explicando qué falta.

ES modules require an http:// origin, so open it through the server rather
than double-clicking `index.html`. No build step and no dependencies.

### Prototype knobs

The design exposed two props; both are available as query parameters:

| Parameter        | Values                          | Default |
| ---------------- | ------------------------------- | ------- |
| `startScreen`    | `login` · `manuals` · `wizard`  | `login` |
| `aiSuggestions`  | `true` · `false`                | `true`  |
| `seed`           | `true` · `false`                | `false` |

e.g. `http://localhost:4173/?startScreen=wizard`

A new manual always starts empty. `seed=true` loads a set of example pages,
useful only for walking through the flow quickly:

```
http://localhost:4173/?startScreen=wizard&seed=true
```

## Sugerencias de la IA

"Sugerir con IA" manda la captura de la página al servidor (`POST /api/suggest`),
que se la pasa a Gemini junto con el título del manual, su área y los títulos
de los pasos vecinos. El modelo se elige solo: el servidor consulta los que hay
en tu cuenta y coge el primer *flash* disponible (se puede fijar con
`GEMINI_MODEL` en el `.env`). Vuelve un `{title, desc}` en español,
que se aplica a la página con **Aplicar**.

**La clave de la API vive solo en el servidor.** Nunca se envía al navegador:
por eso la llamada pasa por `/api/suggest` en vez de ir directa a la API desde
el cliente, donde cualquiera podría leerla.

Detalles que importan:
- La captura se reduce a 1280px de lado máximo antes de enviarla.
- El pensamiento extendido va desactivado (`thinking_budget=0`). Con él
  encendido una sugerencia tardaba ~43s; sin él, ~4s, y para leer una pantalla
  y escribir dos frases no aporta nada.
- Google lista modelos que luego devuelven 404 (retirados para cuentas nuevas).
  Cuando pasa, el servidor descarta ese modelo y prueba el siguiente de
  `MODELOS_PREFERIDOS` en vez de fallar.
- El prompt le prohíbe inventar botones o menús que no se vean, y le pide
  nombrar los elementos tal como aparecen escritos en la pantalla.
- La respuesta viene con salida estructurada (`response_schema`), así que
  siempre es un JSON válido con título y descripción.
- Encabezados y avisos no llevan captura: se redactan a partir de los títulos
  de los pasos de alrededor.
- **Sugerir título con IA** (paso 3) usa el mismo endpoint con
  `kind: "manual-title"`: lee los títulos de los pasos ya escritos y propone un
  título para el manual. Como la portada ya imprime «Manual Instructivo»
  encima, el prompt le prohíbe empezar por «Manual de». Esa respuesta solo trae
  `title`, sin descripción.
- Si algo falla (sin clave, sin red, error de la API), la tarjeta muestra el
  mensaje real y un botón de reintentar.

## Sign-in

The login screen renders Google's official button (Google Identity Services)
and accepts only `@plataform.com` accounts. The signed-in profile drives the
header avatar and menu, and stamps the owner on manuals that get saved.

**This domain check is not a security boundary.** The token is decoded in the
browser, so anyone can bypass it from devtools. Real enforcement needs a
backend that verifies the token signature. What *is* genuinely protected is
Drive: those calls carry an OAuth token that Google validates.

Deep links that skip the login (`?startScreen=manuals`) fall back to a demo
profile so the header isn't left half-empty.

## Importing captures

Step 1 takes real images — click the zone to open the file picker, or drag
files onto it. PNG, JPEG, WebP and GIF are accepted; non-images are ignored.
Imported captures appear as real thumbnails and carry through the whole flow:
the step 2 sheet preview, and the step 4 final page view alongside the title
and description you wrote.

## Exporting to PDF

Step 4 has **Descargar PDF**, and the Previsualización modal's **Descargar**
exports a saved manual. Both build the document in the browser — no server,
nothing uploaded.

The PDF mirrors the on-screen design: the portada and contraportada use the
real cover artwork full-bleed with their type drawn on top, step pages carry
the title, description and the imported capture, and Mr Eaves is embedded so
the file travels with the brand typeface.

Pages are **612×792pt (Carta)**, matching the cover artwork's own proportions,
and the app reports the format as "PDF · Carta vertical". The design's 56 cover
assets are Letter-proportioned, so rendering at A4 would distort them — moving
to A4 would mean re-exporting the cover art at 595×842, not a change in this
code.

`pdf.js` exposes `buildManualPdf()` (returns the jsPDF document) separately
from `exportManualPdf()` (builds, then saves), so the same document can later
be handed to an upload instead of a download.

## Reordering pages

Pages can be dragged into any order, in two places:

- **Step 1**, the imported-capture grid — the arrows still nudge one position
  at a time; dragging moves a capture anywhere.
- **Step 2**, the `_Contenido` strip — drag a chip onto the half of another
  chip you want to land on; a violeta rule marks where it will go. Dropping on
  the strip's empty space sends it to the end.

The page you are editing stays selected as content moves around it, so a
reorder never yanks you onto a different page.

Captures are held in the browser as object URLs — nothing is uploaded, and
nothing survives a reload, including saved manuals. They are released when a
page is deleted, when *Limpiar todo* is used, and when the tab closes — but
never while a saved manual still references them.

## Screens

- **Login** — glass card over the brand photograph. Sign-in is **Google only**,
  restricted to `@plataform.com` accounts. See *Sign-in* below.
- **Biblioteca** — state filter pills, área dropdown and the manual grid.
  Opening a card raises the **Previsualización** modal (portada → pages →
  contraportada). *Guardar como borrador* in step 4 adds the manual here;
  saving again updates it in place instead of adding a duplicate, and *Editar*
  reopens it in the wizard with its pages and title intact. Manuals you saved
  preview their real pages; the seeded demo entries keep wireframe stand-ins,
  since they have only a step count behind them.
- **Wizard** — 4 steps: *Importar capturas* → *Editar contenido* →
  *Portada y contraportada* → *Descargar*.

### Completing a step

*Continuar* stays disabled until the current step is actually finished, and
the footer says what is missing:

| Step | Required |
| ---- | -------- |
| 1 · Importar | at least one capture |
| 2 · Editar   | every page has a title |
| 3 · Portada  | the manual has a title |

Titles must be more than whitespace. The step rail follows the same rule —
you can always go back, but you cannot jump ahead to a step whose predecessors
are unfinished; locked steps are dimmed.

## Layout

```
index.html            page shell — links the design system, then styles.css
styles.css            page chrome + the hover states the prototype inlined
serve.py              static server
src/
  main.js             entry: store wiring, render pass, global dismissers
  store.js            application state and the actions that mutate it
  dom.js              h() element helper + focus preservation
  data.js             seed manuals, filter vocabulary, canned AI suggestions
  ai.js               sugerencias: reduce la captura y llama a /api/suggest
  gis.js              carga única de Google Identity Services
  auth.js             inicio de sesión con Google + comprobación de dominio
  drive.js            subida a Drive: token, carpeta del área, multipart
  config.js           Client ID de Google, scope y carpeta raíz de Drive
  shot-media.js       capture import, object-URL lifetime, cached <img> nodes
  pdf.js              PDF export — page layout, embedded fonts, cover art
  drag-reorder.js     drag-to-reorder for the page strip and capture grid
  cover-data.js       COVER_TPL — 56 cover structures, verbatim from the design
  covers.js           cover() derivation + structural grouping of templates
  ds/
    button.js         Button, ported from the design system's Button.jsx
    input.js          Input, ported from the design system's Input.jsx
  components/
    header.js         sticky header + user menu
    cover-face.js     the two printed cover faces
  screens/
    login.js
    library.js
    preview.js        Previsualización modal
    wizard.js         step rail, active step, footer
    wizard-steps-1-2.js
    wizard-steps-3-4.js
assets/
  vendor/             jsPDF 2.5.1 (vendored — no CDN dependency at runtime)
  _ds/                design system: styles.css, tokens/, Mr Eaves webfonts
  covers/png/         112 cover faces (56 templates × front/back)
  login-bg.png
```

## Notes on the port

- **Rendering.** The prototype was one `DCLogic` class with a single
  `renderVals()` pass. That shape is preserved: one store, and the whole tree
  is rebuilt on each state change. Fields carry a `data-fk` key so focus and
  caret survive a re-render.
- **Design system.** `Button` and `Input` are ported from the system's own
  `.jsx` sources and read design tokens (`--action-brand`, `--font-brand`,
  `--radius-pill`, …) rather than hard-coded values. The prototype's
  `_ds_bundle.js` global-scope shim is not used.
- **Cover templates.** `COVER_TPL` is copied verbatim. `covers.js` reproduces
  the original derivation: largest non-white block sets the colour family,
  title colour flips to violeta on a light ground, and templates that share a
  silhouette are grouped so each row offers colour swatches. Template 55
  (blank) stays hidden and template 10's faces stay swapped.
- **Capture media.** `shot-media.js` caches one `<img>` per object URL and
  re-attaches it across renders. Without that, the full re-render would
  recreate the element on every keystroke and the preview would flicker as the
  browser re-decoded the image.
- **Dragging.** `drag-reorder.js` paints the insertion hint straight onto the
  DOM and commits only on drop, so a drag in flight never triggers a re-render
  that would tear the drag down mid-gesture.
- **Responsive.** The prototype assumed a fixed 1426px canvas. The two-column
  wizard layouts stack below 1180/1040/900px so nothing overflows the page.
