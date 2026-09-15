// Application state — mirrors the prototype's DCLogic component state and the
// actions that mutate it. Any setState schedules one re-render.
import { SEED, LIBRARY } from "./data.js";
import { makeShot, releaseShot } from "./shot-media.js";
import { exportManualPdf, buildManualPdf } from "./pdf.js";
import { sendManualToDrive } from "./drive.js";
import { signOutGoogle, ALLOWED_DOMAIN } from "./auth.js";
import { suggestForPage, suggestManualTitle } from "./ai.js";

// Cuando se entra directo a una pantalla interna (?startScreen=manuals|wizard)
// no hay sesión de Google, así que se usa este usuario para no dejar la cabecera
// a medias.
const DEMO_USER = {
  name: "Katherine Rivera",
  email: "katherine.rivera@plataform.com",
  picture: "",
  initials: "KR",
};

const initial = (props) => ({
  screen: props.startScreen === "wizard" ? "wizard" : props.startScreen === "manuals" ? "manuals" : "login",
  user: props.startScreen === "login" ? null : DEMO_USER,
  loginError: false,
  step: 1,
  active: 0,
  shots: props.seed ? SEED.map((s) => ({ ...s })) : [],
  library: LIBRARY.map((m) => ({ ...m })),
  manualId: null,
  manualTitle: "",
  filter: "Todos",
  area: "Todas las áreas",
  preview: null,
  insertOpen: false,
  draftSaved: false,
  ai: "idle",
  aiSuggestion: null,
  aiError: null,
  tplId: "1",
  tplFamily: "Todas",
  userMenuOpen: false,
  areaOpen: false,
  manualArea: "Comercial",
  manualAreaOpen: false,
  titleAi: "idle",
  titleAiValue: "",
  titleAiError: null,
  fIdx: 0,
  pdfBusy: false,
  pdfError: null,
  driveBusy: false,
  driveError: null,
  driveFile: null,
});

export function createStore(props, onChange) {
  let state = initial(props);
  let queued = false;
  let aiTimer = null;

  // Coalesce updates into one render. requestAnimationFrame never fires while
  // the tab is hidden, so a timer backs it up — otherwise state changes made in
  // a background tab would sit unrendered.
  const schedule = () => {
    if (queued) return;
    queued = true;
    const run = () => {
      if (!queued) return;
      queued = false;
      onChange();
    };
    requestAnimationFrame(run);
    setTimeout(run, 50);
  };

  const setState = (patch) => {
    state = Object.assign({}, state, typeof patch === "function" ? patch(state) : patch);
    schedule();
  };

  // A capture kept by a saved manual must outlive its removal from the wizard.
  const usedByLibrary = (src) =>
    state.library.some((m) => (m.pages || []).some((p) => p.src === src));

  const releaseUnused = (shot) => {
    if (shot && shot.src && !usedByLibrary(shot.src)) releaseShot(shot);
  };

  const api = {
    props,
    get state() { return state; },
    set: setState,
    setState,

    // --- steps / pages ------------------------------------------------
    move(i, delta) {
      const shots = state.shots.slice();
      const j = i + delta;
      if (j < 0 || j >= shots.length) return;
      const t = shots[i];
      shots[i] = shots[j];
      shots[j] = t;
      setState({ shots, active: state.active === i ? j : state.active });
    },

    insert(kind) {
      const shots = state.shots.slice();
      const at = state.active + 1;
      const n = shots.filter((x) => !x.kind || x.kind === "shot").length;
      shots.splice(at, 0, kind === "shot"
        ? { kind: "shot", file: "captura-" + String(n + 1).padStart(2, "0") + ".png", title: "", desc: "" }
        : { kind, file: "", title: "", desc: "" });
      setState({ shots, active: at, insertOpen: false });
    },

    remove(i) {
      const shots = state.shots.slice();
      const [gone] = shots.splice(i, 1);
      releaseUnused(gone);
      const active = Math.max(0, Math.min(state.active, shots.length - 1));
      setState({ shots, active });
    },

    // Moves a page to an arbitrary position, keeping the edited page selected.
    moveTo(from, to) {
      if (from === to) return;
      const shots = state.shots.slice();
      const [item] = shots.splice(from, 1);
      shots.splice(to, 0, item);

      let active = state.active;
      if (active === from) {
        active = to;
      } else {
        if (from < active) active -= 1;
        if (to <= active) active += 1;
      }
      setState({ shots, active: Math.max(0, Math.min(active, shots.length - 1)) });
    },

    // Appends real captures chosen from the picker or dropped on the zone.
    importFiles(files) {
      const added = [...files].map(makeShot);
      if (!added.length) return;
      const shots = state.shots.concat(added);
      setState({ shots, active: shots.length - added.length, ai: "idle" });
    },

    clearShots() {
      state.shots.forEach(releaseUnused);
      setState({ shots: [], active: 0, ai: "idle" });
    },

    patchActive(patch) {
      const next = state.shots.slice();
      next[state.active] = Object.assign({}, next[state.active], patch);
      setState({ shots: next });
    },

    // --- library ------------------------------------------------------
    // Saves the wizard's manual into the library, updating it in place on a
    // second save rather than adding a duplicate.
    saveDraft() {
      const id = state.manualId || "m" + Date.now();
      const steps = state.shots.filter((x) => !x.kind || x.kind === "shot").length;

      const record = {
        id,
        title: (state.manualTitle || "").trim() || "Título del manual",
        area: state.manualArea,
        meta: steps + (steps === 1 ? " paso" : " pasos") + " · editado hoy",
        owner: (state.user && state.user.name) || DEMO_USER.name,
        state: "Borrador",
        dot: "#9EA1A2",
        tpl: String(state.tplId),
        pages: state.shots.map((p) => ({ ...p })),
      };

      const library = state.library.slice();
      const at = library.findIndex((m) => m.id === id);
      if (at >= 0) library[at] = record;
      else library.unshift(record);

      setState({ library, manualId: id, draftSaved: true });
    },

    // Builds the PDF from a saved manual, or from whatever the wizard holds.
    async downloadPdf(saved) {
      if (state.pdfBusy) return;
      setState({ pdfBusy: true, pdfError: null });
      try {
        await exportManualPdf(saved && saved.pages
          ? { title: saved.title, area: saved.area, owner: saved.owner, tplId: saved.tpl, pages: saved.pages }
          : {
              title: state.manualTitle,
              area: state.manualArea,
              owner: (state.user && state.user.name) || DEMO_USER.name,
              tplId: state.tplId,
              pages: state.shots,
            });
        setState({ pdfBusy: false });
      } catch (err) {
        setState({ pdfBusy: false, pdfError: "No se pudo generar el PDF: " + (err && err.message ? err.message : err) });
      }
    },

    // Genera el PDF y lo sube a Drive, dentro de la carpeta del área.
    async sendToDrive() {
      if (state.driveBusy) return;
      setState({ driveBusy: true, driveError: null, driveFile: null });
      try {
        const manual = {
          title: state.manualTitle,
          area: state.manualArea,
          owner: (state.user && state.user.name) || DEMO_USER.name,
          tplId: state.tplId,
          pages: state.shots,
        };
        const { doc, filename } = await buildManualPdf(manual);
        const { file, folder } = await sendManualToDrive({
          blob: doc.output("blob"),
          filename,
          area: state.manualArea,
        });
        setState({ driveBusy: false, driveFile: { ...file, folderName: folder.name } });
      } catch (err) {
        setState({
          driveBusy: false,
          driveError: err && err.message ? err.message : String(err),
        });
      }
    },

    // Fresh manual — never a continuation of whatever was last edited.
    // Se limpia también el área y la plantilla: si no, un manual nuevo hereda
    // los del último que se editó y queda archivado en el área equivocada.
    newManual() {
      state.shots.forEach(releaseUnused);
      setState({
        screen: "wizard", step: 1, preview: null,
        manualId: null, manualTitle: "", draftSaved: false,
        manualArea: "Comercial", tplId: "1", tplFamily: "Todas",
        shots: props.seed ? SEED.map((x) => ({ ...x })) : [],
        active: 0, fIdx: 0,
        ai: "idle", aiSuggestion: null, aiError: null,
        titleAi: "idle", titleAiValue: "", titleAiError: null,
        driveFile: null, driveError: null, pdfError: null,
      });
    },

    // Reopens a saved manual in the wizard. Canned demo entries carry no
    // pages, so they open a fresh wizard instead.
    editManual(m) {
      if (!m || !m.pages) { api.newManual(); return; }
      setState({
        screen: "wizard", step: 1, preview: null,
        manualId: m.id,
        manualTitle: m.title === "Título del manual" ? "" : m.title,
        manualArea: m.area,
        tplId: m.tpl,
        shots: m.pages.map((p) => ({ ...p })),
        active: 0, fIdx: 0, draftSaved: false,
        ai: "idle", aiSuggestion: null, aiError: null,
        titleAi: "idle", titleAiValue: "", titleAiError: null,
        driveFile: null, driveError: null, pdfError: null,
      });
    },

    // --- sugerencias de la IA -----------------------------------------
    // Le pasa la captura activa al servidor, que se la da a Claude.
    async askAi() {
      const page = state.shots[state.active];
      if (!page) return;

      const titulos = state.shots
        .filter((p, i) => i !== state.active && (p.title || "").trim())
        .map((p) => p.title);

      setState({ ai: "loading", aiError: null, aiSuggestion: null });
      try {
        const suggestion = await suggestForPage(page, {
          manualTitle: state.manualTitle,
          area: state.manualArea,
          stepNumber: state.shots.slice(0, state.active + 1)
            .filter((x) => !x.kind || x.kind === "shot").length,
          neighbourTitles: titulos.slice(0, 12),
        });
        setState({ ai: "ready", aiSuggestion: suggestion });
      } catch (err) {
        setState({ ai: "error", aiError: err && err.message ? err.message : String(err) });
      }
    },

    // Le pide a Claude un título para el manual leyendo los pasos ya escritos.
    async askTitleAi() {
      const titulos = state.shots.filter((p) => (p.title || "").trim()).map((p) => p.title);
      setState({ titleAi: "loading", titleAiError: null, titleAiValue: "" });
      try {
        const { title } = await suggestManualTitle({
          area: state.manualArea,
          neighbourTitles: titulos.slice(0, 20),
        });
        setState({ titleAi: "ready", titleAiValue: title });
      } catch (err) {
        setState({ titleAi: "error", titleAiError: err && err.message ? err.message : String(err) });
      }
    },

    // --- auth ---------------------------------------------------------
    // Recibe el perfil que devuelve Google y deja entrar solo a Plataform.
    signIn(user) {
      if (!user || !user.domainOk) {
        signOutGoogle();
        setState({ loginError: "domain", user: null });
        return;
      }
      setState({ screen: "manuals", loginError: false, user });
    },

    doLogout() {
      signOutGoogle();
      setState({ userMenuOpen: false, screen: "login", loginError: false, user: null });
    },

    dispose() {
      clearTimeout(aiTimer);
      state.shots.forEach(releaseShot);
    },
  };

  return api;
}
