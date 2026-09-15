// Plataform / Mesfix Button — ported from the design system's Button.jsx.
// Fully pill-shaped, Mr Eaves XL Bold label.
// Variants: primary (Aqua), brand (Violeta), secondary (outline), tertiary (text).
import { h, icon } from "../dom.js";

const SIZES = {
  sm: { height: 32, padding: "0 16px", font: 14 },
  md: { height: 40, padding: "0 20px", font: 16 },
  lg: { height: 48, padding: "0 28px", font: 18 },
};

const VARIANTS = {
  primary:   { background: "var(--action-primary)", color: "var(--color-blanco)" },
  brand:     { background: "var(--action-brand)",   color: "var(--color-blanco)" },
  secondary: { background: "transparent", color: "var(--action-primary)", borderColor: "var(--action-primary)" },
  tertiary:  { background: "transparent", color: "var(--action-primary)" },
};

function disabledStyle(variant) {
  if (variant === "secondary") {
    return { background: "transparent", color: "var(--action-disabled)", borderColor: "var(--action-disabled)" };
  }
  if (variant === "tertiary") {
    return { background: "transparent", color: "var(--action-disabled)" };
  }
  return { background: "var(--action-disabled)", color: "var(--color-blanco)" };
}

function interaction(variant, press) {
  switch (variant) {
    case "primary":   return { background: press ? "var(--action-primary-press)" : "var(--action-primary-hover)" };
    case "brand":     return { background: press ? "var(--action-brand-press)"   : "var(--action-brand-hover)" };
    case "secondary": return { background: "color-mix(in srgb, var(--action-primary) 10%, transparent)" };
    case "tertiary":  return { background: "color-mix(in srgb, var(--action-primary) 12%, transparent)" };
    default:          return null;
  }
}

export function Button(opts = {}) {
  const {
    label,
    variant = "primary",
    size = "md",
    icon: trailing,
    iconLeading: leading,
    disabled = false,
    fullWidth = false,
    type = "button",
    onClick,
    style,
  } = opts;

  const s = SIZES[size] || SIZES.md;

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: s.height,
    padding: s.padding,
    width: fullWidth ? "100%" : "auto",
    borderRadius: "var(--radius-pill)",
    fontFamily: "var(--font-brand)",
    fontWeight: 700,
    fontSize: s.font,
    lineHeight: 1,
    border: "1.5px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    transition:
      "background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), " +
      "border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  const settled = Object.assign({}, base, VARIANTS[variant], disabled ? disabledStyle(variant) : null, style);
  const iconStyle = { fontSize: Math.round(s.font * 1.15), lineHeight: 1 };

  const el = h(
    "button",
    {
      type,
      disabled,
      style: settled,
      onClick: disabled ? null : onClick,
    },
    leading && icon(leading, iconStyle),
    label,
    trailing && icon(trailing, iconStyle)
  );

  if (!disabled) {
    const paint = (extra) => {
      Object.assign(el.style, VARIANTS[variant]);
      if (extra) Object.assign(el.style, extra);
    };
    el.addEventListener("mouseenter", () => paint(interaction(variant, false)));
    el.addEventListener("mouseleave", () => paint(null));
    el.addEventListener("mousedown",  () => paint(interaction(variant, true)));
    el.addEventListener("mouseup",    () => paint(interaction(variant, false)));
  }

  return el;
}
