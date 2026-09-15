// The two printed cover faces. Both size their type against the container
// (cqw units) so one markup works at thumbnail, card and full-preview scale.
import { h } from "../dom.js";

const FACE = {
  position: "absolute",
  inset: 0,
  background: "#FFFFFF",
  overflow: "hidden",
  containerType: "inline-size",
};

export function CoverFront(cv, title, opts = {}) {
  const titleSize = opts.minFont ? `max(${opts.minFont}, 3.27cqw)` : "3.27cqw";
  return h(
    "div",
    { style: Object.assign({}, FACE, opts.style) },
    h("img", {
      src: cv.front,
      alt: "",
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" },
    }),
    h(
      "span",
      {
        style: {
          position: "absolute", left: "9%", right: "9%", top: cv.titleTop,
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", lineHeight: 1.2, fontSize: titleSize, color: cv.tc,
        },
      },
      h("span", { style: { fontWeight: 400 } }, "Manual Instructivo"),
      h("span", { style: { fontWeight: 700, textWrap: "pretty" } }, title)
    )
  );
}

export function CoverBack(cv, opts = {}) {
  return h(
    "div",
    { style: Object.assign({}, FACE, opts.style) },
    h("img", {
      src: cv.back,
      alt: "",
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" },
    }),
    h("span", {
      style: {
        position: "absolute", left: "14%", right: "14%", top: "47.4%",
        textAlign: "center", lineHeight: 1.22, fontSize: "3.27cqw",
        fontWeight: 700, color: cv.backFg,
      },
    }, "¡Visita nuestra página web y Síguenos en nuestras redes sociales!"),
    h("span", {
      style: {
        position: "absolute", left: 0, right: 0, top: "66.2%",
        textAlign: "center", lineHeight: 1, fontSize: "2.45cqw",
        fontWeight: 700, color: cv.pillFg,
      },
    }, "¡Clic Aquí!")
  );
}
