// Wizard steps 1 (Importar capturas) and 2 (Editar contenido).
import { h, icon } from "../dom.js";
import { Input } from "../ds/input.js";
import { pickImages, imageFilesFrom, shotImage } from "../shot-media.js";
import { draggableItem, draggableList } from "../drag-reorder.js";

const ARROW_BASE = {
  width: 32, height: 32, borderRadius: 999, background: "#F3F3F3",
  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18,
};
const arrowStyle = (on) => Object.assign({}, ARROW_BASE,
  on ? { color: "#7B00CD", cursor: "pointer", opacity: 1 }
     : { color: "#B3B3B3", cursor: "default", opacity: 0.5 });

const iconStyle = (on) => ({
  fontSize: 18, color: "#727272", cursor: "pointer", flex: "none",
  display: on ? "inline" : "none",
});

// A capture tile: the real imported image when there is one, otherwise the
// wireframe placeholder the seeded demo pages use.
function ShotTile(shot, opts = {}) {
  const img = shotImage(shot, opts.imgStyle);
  if (img) {
    return h(
      "div",
      { style: Object.assign({ background: "#F3F3F3", overflow: "hidden", display: "flex" }, opts.style) },
      img
    );
  }
  return ShotPlaceholder(Object.assign({ file: shot && shot.file }, opts));
}

// The wireframe "app screenshot" standing in for an uploaded capture.
function ShotPlaceholder(opts = {}) {
  const dot = () => h("span", { style: { width: 6, height: 6, borderRadius: 999, background: "#B3B3B3" } });
  return h(
    "div",
    { style: Object.assign({ background: "#F3F3F3", padding: 10, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 7 }, opts.style) },
    h("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
      dot(), dot(), dot(),
      opts.file && h("span", { style: { marginLeft: 8, fontSize: 10, fontWeight: 300, color: "#727272" } }, opts.file)),
    h("div", { style: { height: opts.tall ? 12 : 10, borderRadius: 2, background: "#7B00CD", width: "45%" } }),
    h("div", { style: { height: opts.tall ? 7 : 6, borderRadius: 2, background: "#D0D5DD" } }),
    h("div", { style: { height: opts.tall ? 7 : 6, borderRadius: 2, background: "#D0D5DD", width: "80%" } }),
    h("div", { style: { marginTop: "auto", height: opts.tall ? 18 : 20, borderRadius: 999, background: "#39C2D4", width: opts.tall ? "46%" : "52%" } })
  );
}

// ---------------------------------------------------------------- step 1
export function Step1(store) {
  const s = store.state;
  const shotsOnly = s.shots
    .map((shot, i) => ({ shot, i }))
    .filter(({ shot }) => (shot.kind || "shot") === "shot");
  const shotTotal = shotsOnly.length;

  return h(
    "div", null,
    h("h2", { style: { margin: "0 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "#3C3C3C" } }, "Importar capturas"),
    h("p", { style: { margin: "0 0 32px", fontSize: 16, color: "#727272" } }, "Sube las capturas desde tu computador. Puedes reordenarlas antes de editar."),

    h(
      "div",
      {
        class: "dropzone",
        style: { border: "2px dashed #B3B3B3", borderRadius: 12, padding: 48, textAlign: "center", background: "#F3F3F3", cursor: "pointer", transition: "border-color 200ms, background 200ms" },
        onClick: () => pickImages((files) => store.importFiles(files)),
        onDragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("dropping"); },
        onDragleave: (e) => e.currentTarget.classList.remove("dropping"),
        onDrop: (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("dropping");
          store.importFiles(imageFilesFrom(e.dataTransfer));
        },
      },
      icon("upload_file", { fontSize: 40, color: "#7B00CD" }),
      h("div", { style: { fontSize: 20, fontWeight: 700, color: "#3C3C3C", marginTop: 12 } }, "Arrastra y suelta tus capturas"),
      h("div", { style: { fontSize: 14, fontWeight: 300, color: "#727272", marginTop: 6 } }, "PNG o JPG · hasta 50 archivos · o haz clic para seleccionar")
    ),

    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "40px 0 20px" } },
      h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Set importado"),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 16 } },
        h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, shotTotal + " capturas"),
        shotTotal > 0 &&
          h("span", {
            class: "clear-all",
            style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #EBECEC", borderRadius: 999, fontSize: 13, fontWeight: 700, color: "#727272", background: "#FFFFFF", cursor: "pointer", transition: "color 200ms, border-color 200ms" },
            onClick: () => store.clearShots(),
          }, icon("delete_sweep", { fontSize: 16 }), "Limpiar todo")
      )
    ),

    h(
      "div",
      {
        style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 },
        ref: (el) => draggableList(el, s.shots.length, (f, t) => store.moveTo(f, t)),
      },
      shotsOnly.map(({ shot, i }, n) =>
        h(
          "div",
          {
            class: "shot-card",
            title: "Arrastra para reordenar",
            style: { border: "1px solid #EBECEC", borderRadius: 8, overflow: "hidden", background: "#FFFFFF", transition: "box-shadow 200ms", cursor: "grab" },
            ref: (el) => draggableItem(el, i, (f, t) => store.moveTo(f, t)),
          },
          ShotTile(shot, { style: { height: 130 } }),
          h(
            "div",
            { style: { padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 } },
            h("span", { style: { fontSize: 14, fontWeight: 700, color: "#7B00CD", flex: "none" } }, String(n + 1)),
            h("span", { style: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: 300, color: "#727272", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, shot.file),
            h("span", { class: "ms row-icon", style: iconStyle(i > 0), onClick: () => store.move(i, -1) }, "arrow_back"),
            h("span", { class: "ms row-icon", style: iconStyle(i < s.shots.length - 1), onClick: () => store.move(i, 1) }, "arrow_forward"),
            h("span", { class: "ms row-icon-danger", style: { fontSize: 18, color: "#727272", cursor: "pointer", flex: "none" }, onClick: () => store.remove(i) }, "delete")
          )
        )
      )
    )
  );
}

// ---------------------------------------------------------------- step 2
export function Step2(store) {
  const s = store.state;
  const { active, shots } = s;
  const cur = shots[active] || { title: "", desc: "", file: "", kind: "shot" };
  const kind = cur.kind || "shot";

  const shotTotal = shots.filter((x) => !x.kind || x.kind === "shot").length;
  const nth = shots.slice(0, active + 1).filter((x) => !x.kind || x.kind === "shot").length;

  const aiPick = s.aiSuggestion;   // lo que devolvió Claude para esta página

  const aiOn = store.props.aiSuggestions !== false;
  const titleOr = cur.title || (kind === "callout" ? "Título del aviso" : "Título de la sección");
  const descOr = cur.desc || "Escribe el texto en el panel de la derecha.";

  const eyebrow = kind === "shot" ? "Paso " + nth : kind === "heading" ? "Sección" : "Aviso";
  const activeLabel = kind === "heading" ? "_Sección" : kind === "callout" ? "_Aviso" : `_Paso ${nth} de ${shotTotal}`;

  // ---- the printed sheet preview ------------------------------------
  const sheet = h(
    "div",
    { style: { background: "#F3F3F3", borderRadius: 8, padding: 28, display: "flex", justifyContent: "center" } },
    h(
      "div",
      { style: { width: "100%", maxWidth: 400, aspectRatio: "3 / 4", background: "#FFFFFF", borderRadius: 4, boxShadow: "0 8px 24px rgba(16,24,40,0.08)", padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column" } },

      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #EBECEC", marginBottom: 16 } },
        h("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#9EA1A2", textTransform: "uppercase" } }, eyebrow),
        h("span", { style: { display: "inline-flex", alignItems: "baseline", lineHeight: 1, fontSize: 13, color: "#7B00CD" } },
          h("span", { style: { fontWeight: 700 } }, "plata"), h("span", { style: { fontWeight: 400 } }, "form"))
      ),

      kind === "shot" && h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 } },
        h("span", { style: { fontSize: 18, fontWeight: 700, lineHeight: 1.2, color: "#7B00CD", textWrap: "pretty" } }, titleOr),
        h("span", { style: { fontSize: 12, lineHeight: 1.5, color: "#3C3C3C" } }, descOr),
        ShotTile(cur, { tall: true, style: { flex: 1, minHeight: 0, borderRadius: 6, border: "1px solid #EBECEC", padding: cur.src ? 0 : 12 } })
      ),

      kind === "heading" && h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 } },
        h("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#9EA1A2", textTransform: "uppercase" } }, "_Sección"),
        h("span", { style: { fontSize: 26, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#7B00CD", textWrap: "pretty" } }, titleOr),
        h("span", { style: { width: 56, height: 4, borderRadius: 2, background: "#7B00CD" } }),
        h("span", { style: { fontSize: 13, lineHeight: 1.5, color: "#3C3C3C" } }, descOr)
      ),

      kind === "callout" && h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" } },
        h(
          "div",
          { style: { borderRadius: 8, background: "#F3F3F3", padding: 20, display: "flex", gap: 14, alignItems: "flex-start" } },
          icon("info", { fontSize: 20, color: "#7B00CD", flex: "none" }),
          h("span", { style: { display: "flex", flexDirection: "column", gap: 5 } },
            h("span", { style: { fontSize: 15, fontWeight: 700, color: "#3C3C3C" } }, titleOr),
            h("span", { style: { fontSize: 13, lineHeight: 1.5, color: "#3C3C3C" } }, descOr))
        )
      ),

      h(
        "div",
        { style: { marginTop: 16, paddingTop: 10, borderTop: "1px solid #EBECEC", display: "flex", justifyContent: "space-between" } },
        h("span", { style: { fontSize: 10, fontWeight: 300, color: "#727272" } }, "Documento interno"),
        h("span", { style: { fontSize: 10, fontWeight: 300, color: "#727272" } }, `Página ${active + 2} de ${shots.length + 2}`)
      )
    )
  );

  // ---- the editing panel --------------------------------------------
  const panel = h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 24 } },

    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 } },
      h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, activeLabel),
      h(
        "span",
        { style: { display: "inline-flex", gap: 8, alignItems: "center", position: "relative" } },
        h("span", {
          class: "insert-btn",
          style: { display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 999, background: "#F3F3F3", color: "#7B00CD", fontSize: 14, fontWeight: 700, cursor: "pointer" },
          onClick: (e) => { e.stopPropagation(); store.set({ insertOpen: !s.insertOpen }); },
        }, icon("add", { fontSize: 18 }), "Insertar"),

        s.insertOpen && h(
          "div",
          {
            style: { position: "absolute", top: 40, right: 0, zIndex: 30, minWidth: 240, background: "#FFFFFF", border: "1px solid #EBECEC", borderRadius: 12, boxShadow: "0 8px 24px rgba(16,24,40,0.08)", padding: "8px 0" },
            onClick: (e) => e.stopPropagation(),
          },
          [
            { icon: "title", label: "Insertar encabezado", kind: "heading" },
            { icon: "info", label: "Insertar aviso", kind: "callout" },
          ].map((it) =>
            h("span", {
              class: "menu-item",
              style: { display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", cursor: "pointer", color: "#3C3C3C" },
              onClick: () => store.insert(it.kind),
            }, icon(it.icon, { fontSize: 20 }), h("span", { style: { fontSize: 16, fontWeight: 500 } }, it.label))
          )
        ),

        h("span", {
          class: "ms page-delete", title: "Eliminar esta pantalla",
          style: { width: 32, height: 32, borderRadius: 999, background: "#F3F3F3", color: "#727272", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", transition: "color 200ms, background 200ms" },
          onClick: () => store.remove(active),
        }, "delete"),

        h("span", { class: "ms", style: arrowStyle(active > 0), onClick: () => { if (active > 0) store.set({ active: active - 1, ai: "idle" }); } }, "arrow_back"),
        h("span", { class: "ms", style: arrowStyle(active < shots.length - 1), onClick: () => { if (active < shots.length - 1) store.set({ active: active + 1, ai: "idle" }); } }, "arrow_forward")
      )
    ),

    // AI suggestion — idle / loading / ready
    aiOn && s.ai === "idle" && h(
      "div",
      {
        class: "ai-idle",
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 18px", border: "1px dashed #B3B3B3", borderRadius: 8, cursor: "pointer", transition: "border-color 200ms, background 200ms" },
        onClick: () => store.askAi(),
      },
      h("span", { style: { display: "flex", flexDirection: "column", gap: 2 } },
        h("span", { style: { fontSize: 15, fontWeight: 700, color: "#3C3C3C" } }, "Sugerir con IA"),
        h("span", { style: { fontSize: 13, fontWeight: 300, color: "#727272" } },
          kind === "shot" ? "Lee la captura y propone título y descripción."
          : kind === "heading" ? "Propone el título de la sección a partir de los pasos que agrupa."
          : "Propone un aviso con el riesgo o excepción del paso anterior.")),
      icon("auto_awesome", { fontSize: 22, color: "#7B00CD", flex: "none" })
    ),

    aiOn && s.ai === "loading" && h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", border: "1px solid #EBECEC", borderRadius: 8, background: "#F3F3F3" } },
      icon("auto_awesome", { fontSize: 20, color: "#7B00CD" }),
      h("span", { style: { fontSize: 14, fontWeight: 500, color: "#3C3C3C" } },
        kind === "shot" ? `Analizando ${cur.file || "la captura"}…`
        : kind === "heading" ? "Leyendo los pasos de esta sección…"
        : "Buscando la excepción del paso anterior…")
    ),

    aiOn && s.ai === "ready" && aiPick && h(
      "div",
      { style: { border: "1px solid #7B00CD", borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 12 } },
      h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#7B00CD", textTransform: "uppercase" } },
        icon("auto_awesome", { fontSize: 16 }), "Sugerencia de la IA"),
      h("span", { style: { fontSize: 16, fontWeight: 700, color: "#3C3C3C" } }, aiPick.title),
      h("span", { style: { fontSize: 14, lineHeight: 1.5, color: "#3C3C3C" } }, aiPick.desc),
      h(
        "span",
        { style: { display: "flex", gap: 10, marginTop: 4 } },
        h("span", { class: "pill-brand", style: { padding: "8px 18px", borderRadius: 999, background: "#7B00CD", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }, onClick: () => { store.patchActive({ title: aiPick.title, desc: aiPick.desc }); store.set({ ai: "idle" }); } }, "Aplicar"),
        h("span", { class: "pill-muted", style: { padding: "8px 18px", borderRadius: 999, background: "#F3F3F3", color: "#3C3C3C", fontSize: 14, fontWeight: 700, cursor: "pointer" }, onClick: () => store.set({ ai: "idle" }) }, "Descartar")
      )
    ),

    aiOn && s.ai === "error" && h(
      "div",
      { style: { display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", border: "1px solid #D31A3C", borderRadius: 8 } },
      icon("error", { fontSize: 20, color: "#D31A3C", flex: "none" }),
      h(
        "span",
        { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 } },
        h("span", { style: { fontSize: 15, fontWeight: 700, color: "#3C3C3C" } }, "No se pudo generar la sugerencia"),
        h("span", { style: { fontSize: 13, lineHeight: 1.5, color: "#727272", wordBreak: "break-word" } }, s.aiError || ""),
        h("span", {
          class: "pill-muted",
          style: { alignSelf: "flex-start", marginTop: 2, padding: "6px 14px", borderRadius: 999, background: "#F3F3F3", color: "#3C3C3C", fontSize: 13, fontWeight: 700, cursor: "pointer" },
          onClick: () => store.askAi(),
        }, "Reintentar")
      )
    ),

    Input({
      label: kind === "heading" ? "Título de la sección" : kind === "callout" ? "Título del aviso" : "Título del paso",
      placeholder: kind === "heading" ? "Ej. Antes de empezar" : kind === "callout" ? "Ej. Ten en cuenta" : "Ej. Abre el módulo de liquidaciones",
      value: cur.title,
      fk: "step-title",
      onInput: (e) => store.patchActive({ title: e.target.value }),
    }),

    h(
      "label",
      { style: { display: "flex", flexDirection: "column", gap: 8 } },
      h("span", { style: { fontSize: 14, fontWeight: 700, color: "#727272" } }, kind === "callout" ? "Texto del aviso" : "Descripción"),
      h("textarea", {
        rows: 7,
        placeholder: "Explica qué ve y qué hace la persona en esta pantalla.",
        value: cur.desc,
        "data-fk": "step-desc",
        class: "desc-area",
        style: { fontFamily: "var(--font-brand)", fontSize: 16, fontWeight: 400, color: "#3C3C3C", lineHeight: 1.5, border: "1px solid #B3B3B3", borderRadius: 8, padding: "14px 16px", resize: "vertical", outline: "none" },
        onInput: (e) => store.patchActive({ desc: e.target.value }),
      })
    ),

    // ---- page strip --------------------------------------------------
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 12 } },
      h(
        "span",
        { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" } },
        h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Contenido"),
        h(
          "span",
          { style: { display: "inline-flex", alignItems: "center", gap: 14 } },
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 300, color: "#727272" } },
            h("span", { style: { width: 8, height: 8, borderRadius: 999, background: "#00AC69" } }), "Listo"),
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 300, color: "#727272" } },
            h("span", { style: { width: 8, height: 8, borderRadius: 999, background: "#FED925" } }), "Sin título")
        )
      ),
      h(
        "div",
        {
          style: { display: "flex", gap: 10, flexWrap: "wrap" },
          ref: (el) => draggableList(el, shots.length, (f, t) => store.moveTo(f, t)),
        },
        shots.map((shot, i) => {
          const k = shot.kind || "shot";
          const num = k === "shot" ? String(shots.slice(0, i + 1).filter((x) => !x.kind || x.kind === "shot").length) : "";
          const glyph = k === "heading" ? "title" : k === "callout" ? "info" : "";
          const on = i === active;
          return h(
            "span",
            {
              class: "page-chip",
              title: "Arrastra para reordenar",
              style: {
                width: 44, height: 44, borderRadius: 8, background: "#F3F3F3",
                border: `2px solid ${on ? "#7B00CD" : "#EBECEC"}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: on ? "#7B00CD" : "#727272",
                cursor: "grab", position: "relative",
              },
              onClick: () => store.set({ active: i, ai: "idle" }),
              ref: (el) => draggableItem(el, i, (f, t) => store.moveTo(f, t)),
            },
            glyph && icon(glyph, { fontSize: 16 }),
            num,
            h("span", { style: { position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: 999, border: "2px solid #FFFFFF", background: shot.title ? "#00AC69" : "#FED925" } })
          );
        }),
        h("span", {
          class: "add-more", title: "Subir más capturas",
          style: { width: 44, height: 44, borderRadius: 8, border: "2px dashed #B3B3B3", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#7B00CD", cursor: "pointer", transition: "border-color 200ms, background 200ms" },
          onClick: () => pickImages((files) => store.importFiles(files)),
        }, icon("upload_file", { fontSize: 20 }))
      )
    )
  );

  return h(
    "div", null,
    h("h2", { style: { margin: "0 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "#3C3C3C" } }, "Editar contenido"),
    h("p", { style: { margin: "0 0 32px", fontSize: 16, color: "#727272" } }, "Escribe el paso con la captura al lado. Todo se guarda al cambiar de imagen."),
    h("div", { class: "split-2", style: { display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", gap: 32, alignItems: "start" } }, sheet, panel)
  );
}
