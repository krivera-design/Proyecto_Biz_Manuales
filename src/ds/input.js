// Plataform / Mesfix Input — ported from the design system's Input.jsx.
// Underline-style field: a single bottom border with the label above.
// Default line is Gris input; on focus or when filled, label + line turn Aqua.
import { h } from "../dom.js";

export function Input(opts = {}) {
  const {
    label,
    value = "",
    placeholder,
    type = "text",
    helper,
    error,
    disabled = false,
    onInput,
    fk,                 // focus key — lets the field survive a re-render
    style,
  } = opts;

  const filled = value != null && String(value).length > 0;

  // `focused` is only known at paint time for the field that currently has
  // focus; the live focus/blur handlers below repaint on interaction.
  const lineColor = (active) =>
    error ? "var(--status-error)"
    : active && !disabled ? "var(--action-primary)"
    : "var(--border-input)";

  const labelColor = (active) =>
    error ? "var(--status-error)"
    : active && !disabled ? "var(--action-primary)"
    : "var(--text-muted)";

  const labelEl = h("label", {
    style: {
      fontFamily: "var(--font-brand)",
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: "0.01em",
      color: labelColor(filled),
      marginBottom: 4,
      transition: "color var(--dur-base) var(--ease-standard)",
    },
  }, label);

  const inputEl = h("input", {
    type,
    value,
    placeholder,
    disabled,
    "data-fk": fk,
    style: {
      fontFamily: "var(--font-brand)",
      fontWeight: 400,
      fontSize: 16,
      color: disabled ? "var(--text-subtle)" : "var(--text-body)",
      background: "transparent",
      border: "none",
      borderBottom: `1.5px solid ${lineColor(filled)}`,
      padding: "6px 0",
      outline: "none",
      width: "100%",
      transition: "border-color var(--dur-base) var(--ease-standard)",
    },
    onInput,
  });

  const repaint = (active) => {
    inputEl.style.borderBottom = `1.5px solid ${lineColor(active)}`;
    labelEl.style.color = labelColor(active);
  };
  inputEl.addEventListener("focus", () => repaint(true));
  inputEl.addEventListener("blur", () => repaint(inputEl.value.length > 0));

  return h(
    "div",
    { style: Object.assign({ display: "flex", flexDirection: "column" }, style) },
    labelEl,
    inputEl,
    (helper || error) &&
      h("span", {
        style: {
          fontFamily: "var(--font-brand)",
          fontSize: 12,
          marginTop: 4,
          color: error ? "var(--status-error)" : "var(--text-muted)",
        },
      }, error || helper)
  );
}
