// Biblioteca — the team's manual shelf: state filter pills, área dropdown
// and a card grid whose thumbnails render the real cover template.
import { h, icon } from "../dom.js";
import { Button } from "../ds/button.js";
import { CoverFront } from "../components/cover-face.js";
import { FILTERS, AREAS } from "../data.js";
import { cover } from "../covers.js";

export function LibraryScreen(store) {
  const s = store.state;
  const inArea = (m) => s.area === "Todas las áreas" || m.area === s.area;

  const library = s.library;
  const visible = library.filter(inArea).filter((m) => s.filter === "Todos" || m.state === s.filter);

  return h(
    "main",
    { style: { flex: 1, padding: "56px 40px 80px", maxWidth: 1280, width: "100%", margin: "0 auto", boxSizing: "border-box" } },

    // ---- Page heading ------------------------------------------------
    h(
      "div",
      { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 40 } },
      h(
        "div", null,
        h("div", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#727272", textTransform: "uppercase", marginBottom: 12 } }, "_Biblioteca"),
        h("h1", { style: { margin: "0 0 8px", fontSize: 40, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#3C3C3C" } }, "Manuales del equipo"),
        h("p", { style: { margin: 0, fontSize: 16, color: "#727272" } }, "Todo lo que documentamos, en un solo estante.")
      ),
      h("div", { style: { flex: "none" } },
        Button({
          label: "Nuevo manual", variant: "brand", size: "lg", iconLeading: "add",
          onClick: () => store.newManual(),
        })
      )
    ),

    // ---- Filter row --------------------------------------------------
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingBottom: 20, borderBottom: "1px solid #EBECEC", marginBottom: 32 } },

      FILTERS.map((label) => {
        const on = label === s.filter;
        const count = library.filter(inArea).filter((m) => label === "Todos" || m.state === label).length;
        return h(
          "span",
          {
            style: {
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
              borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 700,
              background: on ? "#7B00CD" : "#FFFFFF",
              color: on ? "#FFFFFF" : "#3C3C3C",
              border: `1px solid ${on ? "#7B00CD" : "#EBECEC"}`,
              transition: "background 200ms cubic-bezier(.4,0,.2,1)",
            },
            onClick: () => store.set({ filter: label }),
          },
          label,
          h("span", { style: { fontWeight: 300, color: on ? "rgba(255,255,255,0.85)" : "#727272" } }, String(count))
        );
      }),

      // Área dropdown
      h(
        "span",
        { style: { marginLeft: "auto", position: "relative", display: "inline-block" } },
        h(
          "span",
          {
            class: "area-trigger",
            style: {
              display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px",
              border: "1px solid #EBECEC", borderRadius: 8, background: "#FFFFFF",
              cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#3C3C3C",
            },
            onClick: (e) => { e.stopPropagation(); store.set({ areaOpen: !s.areaOpen }); },
          },
          icon("filter_alt", { fontSize: 18, color: "#727272" }),
          s.area,
          icon("expand_more", { fontSize: 18, color: "#727272" })
        ),

        s.areaOpen &&
          h(
            "div",
            {
              style: {
                position: "absolute", top: 46, right: 0, zIndex: 30, minWidth: 240,
                background: "#FFFFFF", border: "1px solid #EBECEC", borderRadius: 12,
                boxShadow: "0 8px 24px rgba(16,24,40,0.08)", padding: "8px 0",
              },
              onClick: (e) => e.stopPropagation(),
            },
            AREAS.map((label) => {
              const on = label === s.area;
              return h(
                "span",
                {
                  class: "menu-item",
                  style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", cursor: "pointer", fontSize: 14, fontWeight: 500, color: on ? "#7B00CD" : "#3C3C3C" },
                  onClick: () => store.set({ area: label, areaOpen: false }),
                },
                h("span", {
                  style: {
                    width: 18, height: 18, borderRadius: 999, border: `2px solid ${on ? "#7B00CD" : "#B3B3B3"}`,
                    boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
                  },
                }, h("span", { style: { width: 8, height: 8, borderRadius: 999, background: on ? "#7B00CD" : "transparent" } })),
                label
              );
            })
          )
      )
    ),

    // ---- Card grid ---------------------------------------------------
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 } },
      visible.map((m) => {
        const cv = cover(m.tpl);
        const action = m.state === "Listo para descargar" ? "download" : "edit";
        return h(
          "div",
          {
            class: "manual-card",
            style: {
              border: "1px solid #EBECEC", borderRadius: 8, overflow: "hidden", background: "#FFFFFF",
              display: "flex", flexDirection: "column", cursor: "pointer",
              transition: "box-shadow 200ms cubic-bezier(.4,0,.2,1), transform 200ms cubic-bezier(.4,0,.2,1)",
            },
            onClick: () => store.set({ preview: m }),
          },

          h(
            "div",
            { style: { height: 190, borderBottom: "1px solid #EBECEC", background: "#F3F3F3", display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0", boxSizing: "border-box" } },
            h(
              "div",
              { style: { position: "relative", height: "100%", aspectRatio: "612 / 792", background: "#FFFFFF", overflow: "hidden", boxShadow: "0 4px 14px rgba(16,24,40,0.14)", containerType: "inline-size" } },
              CoverFront(cv, m.title)
            )
          ),

          h(
            "div",
            { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14, flex: 1 } },
            h(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 4 } },
              // El área encabeza la ficha: es la categoría por la que se filtra.
              h("span", {
                style: {
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: "#9EA1A2",
                },
              }, m.area),
              h("span", { style: { fontSize: 18, fontWeight: 700, color: "#3C3C3C", textWrap: "pretty" } }, m.title && m.title.trim() ? m.title : "(untitled)"),
              h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, m.meta),
              h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, m.owner)
            ),
            h(
              "div",
              { style: { marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 } },
              h(
                "span",
                { style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "#F3F3F3" } },
                h("span", { style: { width: 8, height: 8, borderRadius: 999, background: m.dot } }),
                h("span", { style: { fontSize: 14, fontWeight: 500, color: "#3C3C3C" } }, m.state)
              ),
              icon(action, { fontSize: 20, color: "#7B00CD", cursor: "pointer" })
            )
          )
        );
      })
    )
  );
}
