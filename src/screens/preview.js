// Previsualización modal — page-by-page thumbnails of a library manual,
// bookended by its real portada and contraportada.
import { h, icon } from "../dom.js";
import { Button } from "../ds/button.js";
import { CoverFront, CoverBack } from "../components/cover-face.js";
import { cover } from "../covers.js";
import { shotImage } from "../shot-media.js";

// Placeholder rules standing in for a rendered step page.
function StepPagePlaceholder(title) {
  const bar = (style) => h("div", { style: Object.assign({ height: 5, borderRadius: 2, background: "#D0D5DD" }, style) });
  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 } },
    h("div", { style: { fontSize: 12, fontWeight: 700, color: "#7B00CD" } }, title),
    bar(),
    bar({ width: "78%" }),
    h(
      "div",
      { style: { marginTop: 6, flex: 1, borderRadius: 4, background: "#F3F3F3", border: "1px solid #EBECEC", display: "flex", flexDirection: "column", gap: 5, padding: 10 } },
      h("div", { style: { height: 6, borderRadius: 2, background: "#7B00CD", width: "42%" } }),
      h("div", { style: { height: 4, borderRadius: 2, background: "#D0D5DD" } }),
      h("div", { style: { height: 4, borderRadius: 2, background: "#D0D5DD", width: "66%" } }),
      h("div", { style: { marginTop: "auto", height: 12, borderRadius: 999, background: "#39C2D4", width: "50%" } })
    )
  );
}

// A page the user actually authored: real title, text and capture.
function SavedPage(page) {
  const kind = page.kind || "shot";
  const title = page.title || (kind === "heading" ? "Sección" : kind === "callout" ? "Aviso" : "Paso");

  if (kind === "heading") {
    return h(
      "div",
      { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 7 } },
      h("span", { style: { fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#9EA1A2", textTransform: "uppercase" } }, "_Sección"),
      h("span", { style: { fontSize: 15, fontWeight: 800, lineHeight: 1.15, color: "#7B00CD", textWrap: "pretty" } }, title),
      h("span", { style: { width: 34, height: 3, borderRadius: 2, background: "#7B00CD" } }),
      page.desc && h("span", { style: { fontSize: 9, lineHeight: 1.45, color: "#3C3C3C" } }, page.desc)
    );
  }

  if (kind === "callout") {
    return h(
      "div",
      { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" } },
      h(
        "div",
        { style: { borderRadius: 6, background: "#F3F3F3", padding: 12, display: "flex", gap: 8, alignItems: "flex-start" } },
        icon("info", { fontSize: 12, color: "#7B00CD", flex: "none" }),
        h(
          "span",
          { style: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 } },
          h("span", { style: { fontSize: 11, fontWeight: 700, color: "#3C3C3C" } }, title),
          page.desc && h("span", { style: { fontSize: 9, lineHeight: 1.45, color: "#3C3C3C" } }, page.desc)
        )
      )
    );
  }

  const img = shotImage(page, { objectFit: "contain" });
  return h(
    "div",
    { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 6 } },
    h("span", { style: { fontSize: 11, fontWeight: 700, color: "#7B00CD", lineHeight: 1.2 } }, title),
    page.desc && h("span", { style: { fontSize: 9, lineHeight: 1.45, color: "#3C3C3C" } }, page.desc),
    h(
      "div",
      { style: { marginTop: 2, flex: 1, minHeight: 0, borderRadius: 4, background: "#F3F3F3", border: "1px solid #EBECEC", overflow: "hidden", display: "flex" } },
      img || h("span", { style: { margin: "auto", fontSize: 9, fontWeight: 300, color: "#9EA1A2" } }, page.file || "Sin captura")
    )
  );
}

export function PreviewModal(store) {
  const s = store.state;
  const pv = s.preview;
  if (!pv) return null;

  const cv = cover(pv.tpl);
  const saved = pv.pages || null;

  // A saved manual previews its own pages; the seeded demo entries only know
  // how many steps they have, so they keep the wireframe stand-ins.
  const body = saved
    ? saved.map((page, i) => ({ kind: "saved", page, label: "Página " + (i + 2) }))
    : Array.from({ length: parseInt(pv.meta, 10) || 6 }, (_, i) => ({
        kind: "step", title: "Paso " + (i + 1), label: "Página " + (i + 2),
      }));

  const pages = [{ kind: "cover", label: "Portada" }]
    .concat(body)
    .concat([{ kind: "back", label: "Contraportada" }]);
  const steps = pages.length - 2;

  const close = () => store.set({ preview: null });

  return h(
    "div",
    {
      style: { position: "fixed", inset: 0, zIndex: 60, background: "rgba(60,60,60,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, boxSizing: "border-box" },
      onClick: close,
    },
    h(
      "div",
      {
        style: {
          width: 920, maxWidth: "100%", maxHeight: "100%", background: "#FFFFFF", borderRadius: 8,
          boxShadow: "2px 10px 50px 12px rgba(60,60,60,0.30)", display: "flex", flexDirection: "column", overflow: "hidden",
        },
        onClick: (e) => e.stopPropagation(),
      },

      // ---- Modal header ------------------------------------------------
      h(
        "div",
        { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "24px 32px", borderBottom: "1px solid #EBECEC" } },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 } },
          h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase" } }, "_Previsualización"),
          h("span", { style: { fontSize: 24, fontWeight: 700, color: "#3C3C3C" } }, pv.title),
          h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, pv.meta + " · " + pv.owner)
        ),
        h(
          "span",
          { style: { display: "inline-flex", alignItems: "center", gap: 16, flex: "none" } },
          h(
            "span",
            { style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "#F3F3F3" } },
            h("span", { style: { width: 8, height: 8, borderRadius: 999, background: pv.dot } }),
            h("span", { style: { fontSize: 14, fontWeight: 500, color: "#3C3C3C" } }, pv.state)
          ),
          h("span", { class: "close-x ms", style: { fontSize: 24, color: "#727272", cursor: "pointer" }, onClick: close }, "close")
        )
      ),

      // ---- Page grid ---------------------------------------------------
      h(
        "div",
        { style: { flex: 1, overflow: "auto", background: "#F3F3F3", padding: 32 } },
        h(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 } },
          pages.map((p) =>
            h(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              h(
                "div",
                {
                  style: {
                    aspectRatio: "3 / 4", overflow: "hidden", boxShadow: "0 8px 24px rgba(16,24,40,0.08)",
                    padding: p.kind === "step" || p.kind === "saved" ? 14 : 0, boxSizing: "border-box",
                    display: "flex", flexDirection: "column", gap: 8, background: "#FFFFFF", borderRadius: 4,
                  },
                },
                p.kind === "cover" && h("div", { style: { position: "relative", flex: 1 } }, CoverFront(cv, pv.title)),
                p.kind === "back"  && h("div", { style: { position: "relative", flex: 1 } }, CoverBack(cv)),
                p.kind === "step"  && StepPagePlaceholder(p.title),
                p.kind === "saved" && SavedPage(p.page)
              ),
              h("span", { style: { fontSize: 12, fontWeight: 300, color: "#727272", textAlign: "center" } }, p.label)
            )
          )
        )
      ),

      // ---- Modal footer ------------------------------------------------
      h(
        "div",
        { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 32px", borderTop: "1px solid #EBECEC" } },
        h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, (steps + 2) + " páginas · PDF Carta vertical"),
        h(
          "span",
          { style: { display: "inline-flex", gap: 12 } },
          Button({ label: "Editar", variant: "tertiary", iconLeading: "edit", onClick: () => store.editManual(pv) }),
          Button({ label: "Descargar", variant: "brand", iconLeading: "download", onClick: () => store.downloadPdf(pv) })
        )
      )
    )
  );
}
