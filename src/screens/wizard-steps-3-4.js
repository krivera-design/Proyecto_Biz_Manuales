// Wizard steps 3 (Portada y contraportada) and 4 (Descargar).
import { h, icon } from "../dom.js";
import { Button } from "../ds/button.js";
import { Input } from "../ds/input.js";
import { CoverFront, CoverBack } from "../components/cover-face.js";
import { cover, tplTone, TPL_GROUPS, groupName } from "../covers.js";
import { AREAS } from "../data.js";
import { shotImage } from "../shot-media.js";
import { exportManualPdf } from "../pdf.js";

const swatchStyle = (tone, on) => ({
  width: 14, height: 14, borderRadius: 999, cursor: "pointer", flex: "none", background: tone,
  boxShadow: on ? "0 0 0 2px #FFFFFF, 0 0 0 3px #7B00CD" : "0 0 0 1px #EBECEC",
});

// ---------------------------------------------------------------- step 3
export function Step3(store) {
  const s = store.state;
  const sel = cover(s.tplId);
  const titlePreview = s.manualTitle || "Título del manual";

  // ---- title field + AI title suggestion ----------------------------
  const titleBlock = h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 10 } },
    Input({
      label: "Título del manual",
      placeholder: "Ej. Confirming en Plataform",
      value: s.manualTitle,
      fk: "manual-title",
      onInput: (e) => store.set({ manualTitle: e.target.value }),
    }),

    s.titleAi === "error" &&
      h(
        "div",
        { style: { border: "1px solid #D31A3C", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 } },
        h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#3C3C3C" } },
          icon("error", { fontSize: 18, color: "#D31A3C" }), "No se pudo sugerir el título"),
        h("span", { style: { fontSize: 12, lineHeight: 1.5, color: "#727272", wordBreak: "break-word" } }, s.titleAiError || ""),
        h("span", {
          class: "pill-muted",
          style: { alignSelf: "flex-start", padding: "6px 14px", borderRadius: 999, background: "#F3F3F3", color: "#3C3C3C", fontSize: 13, fontWeight: 700, cursor: "pointer" },
          onClick: () => store.askTitleAi(),
        }, "Reintentar")
      ),

    s.titleAi !== "loading" && s.titleAi !== "ready" && s.titleAi !== "error" &&
      h("span", {
        class: "link-violeta",
        style: { display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", fontSize: 13, fontWeight: 700, color: "#7B00CD", cursor: "pointer" },
        onClick: () => store.askTitleAi(),
      }, icon("auto_awesome", { fontSize: 18 }), "Sugerir título con IA"),

    s.titleAi === "loading" &&
      h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#727272" } },
        icon("auto_awesome", { fontSize: 18, color: "#7B00CD" }), "Leyendo los pasos del manual…"),

    s.titleAi === "ready" && s.titleAiValue &&
      h(
        "div",
        { style: { border: "1px solid #7B00CD", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 } },
        h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#7B00CD", textTransform: "uppercase" } },
          icon("auto_awesome", { fontSize: 16 }), "Sugerencia de la IA"),
        h("span", { style: { fontSize: 15, fontWeight: 700, color: "#3C3C3C" } }, s.titleAiValue),
        h(
          "span",
          { style: { display: "flex", gap: 10 } },
          h("span", { class: "pill-brand", style: { padding: "7px 16px", borderRadius: 999, background: "#7B00CD", color: "#FFFFFF", fontSize: 13, fontWeight: 700, cursor: "pointer" },
            onClick: () => store.set({ manualTitle: s.titleAiValue, titleAi: "idle" }) }, "Aplicar"),
          h("span", { class: "pill-muted", style: { padding: "7px 16px", borderRadius: 999, background: "#F3F3F3", color: "#3C3C3C", fontSize: 13, fontWeight: 700, cursor: "pointer" },
            onClick: () => store.set({ titleAi: "idle" }) }, "Descartar")
        )
      )
  );

  // ---- área responsable ---------------------------------------------
  const areaOptions = AREAS.filter((a) => a !== "Todas las áreas").slice().sort((a, b) => a.localeCompare(b, "es"));

  const areaBlock = h(
    "label",
    { style: { display: "flex", flexDirection: "column", gap: 8, position: "relative" } },
    h("span", { style: { fontSize: 14, fontWeight: 700, color: "#727272" } }, "Área responsable"),
    h(
      "span",
      {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #B3B3B3", cursor: "pointer", fontSize: 16, color: "#3C3C3C" },
        onClick: (e) => { e.stopPropagation(); store.set({ manualAreaOpen: !s.manualAreaOpen }); },
      },
      s.manualArea,
      icon("expand_more", { fontSize: 20, color: "#727272" })
    ),
    s.manualAreaOpen &&
      h(
        "div",
        {
          style: { position: "absolute", top: 76, left: 0, right: 0, zIndex: 30, background: "#FFFFFF", border: "1px solid #EBECEC", borderRadius: 12, boxShadow: "0 8px 24px rgba(16,24,40,0.08)", padding: "8px 0" },
          onClick: (e) => e.stopPropagation(),
        },
        areaOptions.map((label) => {
          const on = label === s.manualArea;
          return h(
            "span",
            {
              class: "menu-item",
              style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", cursor: "pointer", fontSize: 14, fontWeight: 500, color: on ? "#7B00CD" : "#3C3C3C" },
              onClick: () => store.set({ manualArea: label, manualAreaOpen: false }),
            },
            h("span", { style: { width: 18, height: 18, borderRadius: 999, border: `2px solid ${on ? "#7B00CD" : "#B3B3B3"}`, boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" } },
              h("span", { style: { width: 8, height: 8, borderRadius: 999, background: on ? "#7B00CD" : "transparent" } })),
            label
          );
        })
      )
  );

  // ---- template picker ----------------------------------------------
  const rows = TPL_GROUPS
    .map((ids) => ids.filter((id) => s.tplFamily === "Todas" || cover(id).family === s.tplFamily))
    .filter((ids) => ids.length > 0)
    .map((ids) => {
      const shown = ids.indexOf(String(s.tplId)) >= 0 ? String(s.tplId) : ids[0];
      const c = cover(shown);
      const on = shown === String(s.tplId);
      return h(
        "div",
        {
          class: "tpl-row",
          style: { display: "flex", alignItems: "center", gap: 16, padding: "10px 14px", border: `1px solid ${on ? "#7B00CD" : "#EBECEC"}`, borderRadius: 8, background: "#FFFFFF", cursor: "pointer", transition: "border-color 200ms, background 200ms" },
          onClick: () => store.set({ tplId: shown }),
        },
        // Miniature: real cover art with the title reduced to two rules.
        h(
          "div",
          { style: { position: "relative", width: 48, flex: "none", aspectRatio: "612 / 792", borderRadius: 3, overflow: "hidden", boxShadow: "0 2px 8px rgba(16,24,40,0.10)", background: "#FFFFFF", containerType: "inline-size" } },
          h("img", { src: c.front, alt: "", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" } }),
          h(
            "span",
            { style: { position: "absolute", left: "16%", right: "16%", top: c.titleTop, display: "flex", flexDirection: "column", alignItems: "center", gap: "3.5cqw" } },
            h("span", { style: { height: "1.6cqw", width: "62%", borderRadius: 1, background: c.tc, opacity: 0.85 } }),
            h("span", { style: { height: "1.6cqw", width: "88%", borderRadius: 1, background: c.tc, opacity: 0.85 } })
          )
        ),
        h("span", { style: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: on ? "#7B00CD" : "#727272" } }, groupName(ids, c.name)),
        h(
          "span",
          { style: ids.length > 1 ? { display: "flex", gap: 6, alignItems: "center" } : { display: "none" } },
          ids.map((id) =>
            h("span", {
              style: swatchStyle(tplTone(id), id === String(s.tplId)),
              onClick: (e) => { e.stopPropagation(); store.set({ tplId: id }); },
            })
          )
        )
      );
    });

  return h(
    "div",
    { style: { maxWidth: 1160 } },
    h("h2", { style: { margin: "0 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "#3C3C3C" } }, "Portada y contraportada"),
    h("p", { style: { margin: "0 0 32px", fontSize: 16, color: "#727272" } },
      `Elige entre ${TPL_GROUPS.length} estructuras oficiales y su variante de color. El título entra en la portada y la contraportada se arma sola.`),

    h(
      "div",
      { class: "split-3", style: { display: "grid", gridTemplateColumns: "minmax(240px, 0.55fr) minmax(380px, 1fr)", gap: 48, alignItems: "start", marginBottom: 48 } },

      h(
        "div", null,
        h("div", { style: { display: "flex", flexDirection: "column", gap: 28 } }, titleBlock, areaBlock),

        h(
          "div",
          { style: { display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 12, borderBottom: "1px solid #EBECEC", margin: "40px 0 20px" } },
          h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Plantillas"),
          h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272", marginLeft: "auto" } }, sel.name + " · " + sel.family)
        ),

        h("div", { style: { display: "flex", flexDirection: "column", gap: 10, height: 211, overflowY: "auto", overscrollBehavior: "contain", padding: "2px 4px 4px 2px", maxWidth: 384 } }, rows)
      ),

      // ---- live portada / contraportada --------------------------------
      h(
        "div",
        { class: "covers-2", style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" } },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 12 } },
          h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Portada"),
          h("div", { style: { position: "relative", aspectRatio: "612 / 792", borderRadius: 4, overflow: "hidden", boxShadow: "0 12px 32px rgba(16,24,40,0.12)" } },
            CoverFront(sel, titlePreview, { minFont: "9px" }))
        ),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 12 } },
          h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Contraportada"),
          h("div", { style: { position: "relative", aspectRatio: "612 / 792", borderRadius: 4, overflow: "hidden", boxShadow: "0 12px 32px rgba(16,24,40,0.12)" } },
            CoverBack(sel))
        )
      )
    )
  );
}

// ---------------------------------------------------------------- step 4
export function Step4(store) {
  const s = store.state;
  const sel = cover(s.tplId);
  const shotTotal = s.shots.filter((x) => !x.kind || x.kind === "shot").length;
  const today = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

  // Full page run: portada + every editor page + contraportada.
  const finalPages = [{ kind: "cover", title: s.manualTitle || "Título del manual", label: "Portada" }]
    .concat(s.shots.map((shot, i) => {
      const k = shot.kind || "shot";
      const n = s.shots.slice(0, i + 1).filter((x) => !x.kind || x.kind === "shot").length;
      return {
        kind: k,
        shot,
        title: shot.title || (k === "shot" ? "Paso " + n : k === "heading" ? "Sección" : "Aviso"),
        desc: shot.desc,
        label: "Página " + (i + 2),
      };
    }))
    .concat([{ kind: "back", label: "Contraportada" }]);

  const fIdx = Math.min(s.fIdx || 0, finalPages.length - 1);
  const fp = finalPages[fIdx];

  const summary = [
    { k: "Título",    v: s.manualTitle || "Título del manual" },
    { k: "Pasos",     v: shotTotal + " pasos" },
    { k: "Páginas",   v: (s.shots.length + 2) + " páginas" },
    { k: "Fecha",     v: today },
    { k: "Plantilla", v: sel.name + " · " + sel.family },
    { k: "Formato",   v: "PDF · Carta vertical" },
  ];

  const bar = (style) => h("span", { style: Object.assign({ height: 7, borderRadius: 4, background: "#D0D5DD" }, style) });

  const pageBody =
    fp.kind === "cover" ? h("div", { style: { position: "relative", flex: 1 } }, CoverFront(sel, fp.title))
    : fp.kind === "back" ? h("div", { style: { position: "relative", flex: 1 } }, CoverBack(sel))
    : fp.kind === "heading" ? h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 12 } },
        h("span", { style: { fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: "#9EA1A2", textTransform: "uppercase" } }, "_Sección"),
        h("span", { style: { fontSize: 28, fontWeight: 800, lineHeight: 1.15, color: "#7B00CD", textWrap: "pretty" } }, fp.title),
        h("span", { style: { width: 64, height: 5, borderRadius: 2, background: "#7B00CD" } }),
        fp.desc && h("span", { style: { fontSize: 13, lineHeight: 1.5, color: "#3C3C3C" } }, fp.desc)
      )
    : fp.kind === "callout" ? h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 12 } },
        h(
          "div",
          { style: { borderRadius: 8, background: "#F3F3F3", padding: 24, display: "flex", gap: 14, alignItems: "flex-start" } },
          icon("info", { fontSize: 20, color: "#7B00CD", flex: "none" }),
          h(
            "span",
            { style: { display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 } },
            h("span", { style: { fontSize: 17, fontWeight: 700, color: "#3C3C3C" } }, fp.title),
            fp.desc
              ? h("span", { style: { fontSize: 13, lineHeight: 1.5, color: "#3C3C3C" } }, fp.desc)
              : [
                  h("span", { style: { height: 8, borderRadius: 4, background: "#D0D5DD" } }),
                  h("span", { style: { height: 8, borderRadius: 4, background: "#D0D5DD", width: "70%" } }),
                ]
          )
        )
      )
    : (() => {
        const img = shotImage(fp.shot, { objectFit: "contain" });
        return h(
          "div",
          { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: 12 } },
          h("span", { style: { fontSize: 18, fontWeight: 700, color: "#7B00CD" } }, fp.title),
          fp.desc
            ? h("span", { style: { fontSize: 12, lineHeight: 1.5, color: "#3C3C3C" } }, fp.desc)
            : [bar(), bar({ width: "76%" })],
          h(
            "div",
            { style: { marginTop: 8, flex: 1, minHeight: 0, borderRadius: 6, background: "#F3F3F3", border: "1px solid #EBECEC", display: "flex", flexDirection: "column", gap: 8, padding: img ? 0 : 16, overflow: "hidden" } },
            img || [
              h("span", { style: { height: 9, borderRadius: 4, background: "#7B00CD", width: "40%" } }),
              h("span", { style: { height: 6, borderRadius: 4, background: "#D0D5DD" } }),
              h("span", { style: { marginTop: "auto", height: 22, borderRadius: 999, background: "#39C2D4", width: "48%" } }),
            ]
          )
        );
      })();

  const navBtn = (glyph, onClick) =>
    h("span", {
      class: "ms carousel-nav",
      style: { flex: "none", width: 40, height: 40, borderRadius: 999, background: "#FFFFFF", color: "#7B00CD", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,24,40,0.10)" },
      onClick,
    }, glyph);

  return h(
    "div",
    { class: "split-4", style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.9fr)", gap: 48, alignItems: "start", maxWidth: 1120 } },

    // ---- left: summary + actions --------------------------------------
    h(
      "div", null,
      h(
        "span",
        { style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "#F3F3F3", marginBottom: 24 } },
        h("span", { style: { width: 8, height: 8, borderRadius: 999, background: "#00AC69" } }),
        h("span", { style: { fontSize: 14, fontWeight: 500, color: "#3C3C3C" } }, "Listo para descargar")
      ),
      h("h2", { style: { margin: "0 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "#3C3C3C" } }, "Tu manual está armado."),
      h("p", { style: { margin: "0 0 32px", fontSize: 16, color: "#727272" } }, "Revisa el resumen y descárgalo. Queda guardado en la biblioteca por si lo editas después."),

      h(
        "div",
        { style: { border: "1px solid #EBECEC", borderRadius: 8, overflow: "hidden", marginBottom: 32 } },
        summary.map((r, i) =>
          h(
            "div",
            { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 24px", background: i % 2 === 1 ? "#F3F3F3" : "#FFFFFF", borderBottom: "1px solid #EBECEC" } },
            h("span", { style: { fontSize: 14, fontWeight: 300, letterSpacing: "0.04em", color: "#727272", textTransform: "uppercase" } }, r.k),
            h("span", { style: { fontSize: 18, fontWeight: 700, color: "#3C3C3C", textAlign: "right" } }, r.v)
          )
        )
      ),

      h(
        "div",
        { style: { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" } },
        Button({
          label: s.pdfBusy ? "Generando…" : "Descargar PDF",
          variant: "primary", size: "lg", iconLeading: "download",
          disabled: !!s.pdfBusy,
          onClick: () => store.downloadPdf(),
        }),
        // Genera el PDF y lo sube a la carpeta del área en Drive.
        Button({
          label: s.driveBusy ? "Enviando…" : "Enviar a Drive",
          variant: "brand", size: "lg", iconLeading: "drive_export",
          disabled: !!s.driveBusy,
          onClick: () => store.sendToDrive(),
        }),
        Button({ label: "Guardar como borrador", variant: "secondary", size: "lg", iconLeading: "bookmark", onClick: () => store.saveDraft() }),
        s.draftSaved &&
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#00AC69" } },
            icon("check_circle", { fontSize: 18 }), "Guardado en la biblioteca"),
        s.pdfError &&
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#D31A3C" } },
            icon("error", { fontSize: 18 }), s.pdfError),

        s.driveFile &&
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#00AC69" } },
            icon("check_circle", { fontSize: 18 }),
            `Subido a ${s.driveFile.folderName} · `,
            h("a", { href: s.driveFile.webViewLink, target: "_blank", rel: "noopener noreferrer", style: { color: "#7B00CD", fontWeight: 700 } }, "Ver en Drive")),

        s.driveError &&
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#D31A3C", maxWidth: 520 } },
            icon("error", { fontSize: 18 }), "No se pudo enviar a Drive: " + s.driveError)
      )
    ),

    // ---- right: paged final view --------------------------------------
    h(
      "div", null,
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 12, borderBottom: "1px solid #EBECEC", marginBottom: 20 } },
        h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Vista final"),
        h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272", marginLeft: "auto" } }, (s.shots.length + 2) + " páginas")
      ),

      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 16, padding: "28px 20px", borderRadius: 8, background: "#F3F3F3" } },
        navBtn("chevron_left", () => store.set({ fIdx: Math.max(0, fIdx - 1) })),
        h(
          "div",
          { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 } },
          h(
            "div",
            { style: { width: "100%", maxWidth: 340, aspectRatio: "3 / 4", overflow: "hidden", boxShadow: "0 12px 32px rgba(16,24,40,0.12)", padding: fp.kind === "cover" || fp.kind === "back" ? 0 : 12, boxSizing: "border-box", display: "flex", flexDirection: "column", background: "#FFFFFF", borderRadius: 4 } },
            pageBody
          ),
          h("span", { style: { fontSize: 13, fontWeight: 300, color: "#727272" } }, fp.label)
        ),
        navBtn("chevron_right", () => store.set({ fIdx: Math.min(finalPages.length - 1, fIdx + 1) }))
      ),

      h(
        "div",
        { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, flexWrap: "wrap" } },
        finalPages.map((p, i) =>
          h("span", {
            style: { height: 8, borderRadius: 999, cursor: "pointer", width: i === fIdx ? 20 : 8, background: i === fIdx ? "#7B00CD" : "#D0D5DD" },
            onClick: () => store.set({ fIdx: i }),
          })
        )
      ),
      h("p", { style: { margin: "12px 0 0", textAlign: "center", fontSize: 13, fontWeight: 300, color: "#9EA1A2" } }, `${fIdx + 1} / ${finalPages.length}`)
    )
  );
}
