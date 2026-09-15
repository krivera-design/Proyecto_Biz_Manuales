// Wizard shell — step rail, the active step's body, and the sticky footer.
import { h, icon } from "../dom.js";
import { Button } from "../ds/button.js";
import { STEP_LABELS } from "../data.js";
import { Step1, Step2 } from "./wizard-steps-1-2.js";
import { Step3, Step4 } from "./wizard-steps-3-4.js";

// What still blocks a step from being finished, as a message for the footer.
// Every page needs a title, and the manual itself needs one, before the
// wizard will let you move on.
function stepIssue(s, step) {
  if (step === 1) {
    const captures = s.shots.filter((x) => !x.kind || x.kind === "shot").length;
    return captures === 0 ? "Importa al menos una captura para continuar." : null;
  }

  if (step === 2) {
    if (!s.shots.length) return "Importa al menos una captura para continuar.";
    const untitled = s.shots.filter((x) => !(x.title || "").trim()).length;
    if (!untitled) return null;
    return untitled === 1
      ? "Falta el título de 1 página."
      : `Faltan los títulos de ${untitled} páginas.`;
  }

  if (step === 3) {
    return (s.manualTitle || "").trim() ? null : "Escribe el título del manual para continuar.";
  }

  return null;
}

// The furthest step reachable right now — the first unfinished one.
function maxReachableStep(s) {
  for (let n = 1; n <= 3; n += 1) if (stepIssue(s, n)) return n;
  return 4;
}

export function WizardScreen(store) {
  const s = store.state;
  const issue = stepIssue(s, s.step);
  const nextDisabled = !!issue;
  const reachable = maxReachableStep(s);

  const body = s.step === 1 ? Step1(store)
    : s.step === 2 ? Step2(store)
    : s.step === 3 ? Step3(store)
    : Step4(store);

  return h(
    "main",
    { style: { flex: 1, display: "flex", flexDirection: "column" } },

    // ---- step rail -----------------------------------------------------
    h(
      "div",
      { style: { borderBottom: "1px solid #EBECEC", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" } },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
        STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const on = n === s.step;
          const locked = n > reachable;
          return h(
            "span",
            {
              title: locked ? "Completa los pasos anteriores para llegar aquí" : null,
              style: {
                display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 16px 6px 8px",
                borderRadius: 999, background: on ? "#F3F3F3" : "transparent",
                cursor: locked ? "not-allowed" : "pointer",
                opacity: locked ? 0.45 : 1,
              },
              onClick: () => { if (!locked) store.set({ step: n }); },
            },
            h("span", {
              style: {
                width: 26, height: 26, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                background: on ? "#7B00CD" : "#EBECEC",
                color: on ? "#FFFFFF" : "#9EA1A2",
              },
            }, String(n)),
            h("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", color: on ? "#3C3C3C" : "#727272" } }, label)
          );
        })
      ),
      Button({ label: "Salir", variant: "tertiary", size: "sm", iconLeading: "close", onClick: () => store.set({ screen: "manuals" }) })
    ),

    // ---- step body -----------------------------------------------------
    h("div", { style: { flex: 1, padding: 40, maxWidth: 1280, width: "100%", margin: "0 auto", boxSizing: "border-box" } }, body),

    // ---- footer --------------------------------------------------------
    h(
      "div",
      { style: { borderTop: "1px solid #EBECEC", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#FFFFFF", position: "sticky", bottom: 0 } },
      Button({
        label: "Atrás", variant: "tertiary", iconLeading: "arrow_back",
        onClick: () => (s.step === 1 ? store.set({ screen: "manuals" }) : store.set({ step: s.step - 1 })),
      }),
      issue
        ? h(
            "span",
            { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#727272", textAlign: "center" } },
            icon("info", { fontSize: 18, color: "#FF9E18" }),
            issue
          )
        : h("span", { style: { fontSize: 14, fontWeight: 300, color: "#727272" } }, `Paso ${s.step} de 4 · ${STEP_LABELS[s.step - 1]}`),
      s.step < 4
        ? Button({
            label: "Continuar", variant: "primary", icon: "arrow_forward", disabled: nextDisabled,
            onClick: () => { if (!nextDisabled) store.set({ step: Math.min(4, s.step + 1) }); },
          })
        : h("span", { style: { width: 150 } })
    )
  );
}
