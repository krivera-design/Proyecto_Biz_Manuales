// Creador de Manuales — app entry.
// One store, one render pass; the whole tree is rebuilt on each state change.
import { captureFocus, restoreFocus } from "./dom.js";
import { createStore } from "./store.js";
import { LoginScreen } from "./screens/login.js";
import { Header } from "./components/header.js";
import { LibraryScreen } from "./screens/library.js";
import { PreviewModal } from "./screens/preview.js";
import { WizardScreen } from "./screens/wizard.js";

// Prototype-level knobs, overridable via the query string
// (?startScreen=wizard, ?aiSuggestions=false).
const params = new URLSearchParams(location.search);
const props = {
  startScreen: params.get("startScreen") || "login",
  aiSuggestions: params.get("aiSuggestions") !== "false",
  // Un manual nuevo empieza siempre vacío. ?seed=true carga un set de
  // páginas de ejemplo, útil solo para recorrer el flujo rápido.
  seed: params.get("seed") === "true",
};

const root = document.getElementById("app");
const store = createStore(props, render);

function render() {
  const focus = captureFocus();
  const s = store.state;

  root.replaceChildren();

  if (s.screen === "login") {
    root.appendChild(LoginScreen(store));
  } else {
    root.appendChild(Header(store));
    if (s.screen === "manuals") root.appendChild(LibraryScreen(store));
    if (s.screen === "wizard") root.appendChild(WizardScreen(store));
    const modal = PreviewModal(store);
    if (modal) root.appendChild(modal);
  }

  restoreFocus(focus, root);
}

// A click anywhere outside an open menu dismisses it.
document.addEventListener("click", () => {
  const s = store.state;
  if (s.userMenuOpen || s.areaOpen || s.insertOpen || s.manualAreaOpen) {
    store.set({ userMenuOpen: false, areaOpen: false, insertOpen: false, manualAreaOpen: false });
  }
});

// Esc closes the preview modal.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && store.state.preview) store.set({ preview: null });
});

window.addEventListener("pagehide", () => store.dispose());

render();
