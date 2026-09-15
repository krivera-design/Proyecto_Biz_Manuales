// Minimal DOM helpers. The app re-renders wholesale on every state change —
// the tree is small enough that this stays cheap, and it keeps the port close
// to the prototype's single renderVals() pass.

const SVG_NS = "http://www.w3.org/2000/svg";

function applyStyle(el, style) {
  if (!style) return;
  if (typeof style === "string") { el.style.cssText = style; return; }
  Object.keys(style).forEach((k) => {
    const v = style[k];
    if (v == null || v === false) return;
    if (k.startsWith("--")) el.style.setProperty(k, String(v));
    else el.style[k] = typeof v === "number" && !UNITLESS[k] ? v + "px" : v;
  });
}

const UNITLESS = {
  opacity: 1, zIndex: 1, flex: 1, flexGrow: 1, flexShrink: 1, order: 1,
  fontWeight: 1, lineHeight: 1, aspectRatio: 1,
};

export function h(tag, props, ...children) {
  const el = tag === "svg" || tag === "path" || tag === "circle"
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  const p = props || {};
  Object.keys(p).forEach((key) => {
    const val = p[key];
    if (val == null || val === false) return;

    if (key === "style") applyStyle(el, val);
    else if (key === "class") el.setAttribute("class", val);
    else if (key === "html") el.innerHTML = val;
    else if (key === "ref") val(el);
    else if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === "value" && (tag === "input" || tag === "textarea")) {
      el.value = val;
    } else if (key === "checked" || key === "disabled" || key === "selected") {
      el[key] = !!val;
    } else {
      el.setAttribute(key, String(val));
    }
  });

  const add = (c) => {
    if (c == null || c === false || c === true) return;
    if (Array.isArray(c)) { c.forEach(add); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  children.forEach(add);

  return el;
}

// Material Symbols glyph.
export function icon(name, style) {
  return h("span", { class: "ms", style }, name);
}

// Captures which field had focus (and where the caret sat) so a full re-render
// doesn't interrupt typing. Fields opt in with a stable `data-fk`.
export function captureFocus() {
  const a = document.activeElement;
  if (!a || !a.dataset || !a.dataset.fk) return null;
  return {
    fk: a.dataset.fk,
    start: a.selectionStart,
    end: a.selectionEnd,
    scrollTop: a.scrollTop,
  };
}

export function restoreFocus(snap, root) {
  if (!snap) return;
  const el = root.querySelector(`[data-fk="${CSS.escape(snap.fk)}"]`);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (snap.start != null && el.setSelectionRange) {
    try { el.setSelectionRange(snap.start, snap.end); } catch { /* type has no caret */ }
  }
  if (snap.scrollTop) el.scrollTop = snap.scrollTop;
}
