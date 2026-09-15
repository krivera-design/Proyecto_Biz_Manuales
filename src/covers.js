// Cover template derivation — ported from the ProductLab prototype.
// Turns the raw COVER_TPL geometry into render-ready cover descriptors
// (face images, title colour/position, back-cover colours) and groups
// structurally-identical templates so each row offers colour variants.
import { COVER_TPL } from "./cover-data.js";

export const TPL_IDS = Object.keys(COVER_TPL);

const LIGHT_GROUND = { "#FFFFFF": 1, "#87E1D1": 1 };

// Largest non-white block decides the template's colour family.
function tplMain(t) {
  const s = t.b.filter((x) => x.c !== "#FFFFFF").sort((a, b) => b.w * b.h - a.w * a.h)[0];
  return s ? s.c : "#7B00CD";
}

// Template 10 ships with its two faces the other way round.
const SWAPPED_FACES = { 10: 1 };

const GROUP_NAMES = {
  1: "Bloque superior",
  2: "Bloque inferior",
  4: "Marco completo",
  26: "Panel inferior sobre color",
  30: "Bloque inferior centrado",
};

const COVER_CACHE = {};

export function cover(id) {
  const key = String(id);
  if (COVER_CACHE[key]) return COVER_CACHE[key];

  const t = COVER_TPL[key] || COVER_TPL["1"];
  const main = tplMain(t);

  // Which block sits under the watermark (50%, 21%) and under the title?
  let ground = "#FFFFFF";
  t.b.forEach((s) => {
    if (50 >= s.x && 50 <= s.x + s.w && 21 >= s.y && 21 <= s.y + s.h) ground = s.c;
  });

  const ty = t.ty || 55;
  let titleGround = "#FFFFFF";
  t.b.forEach((s) => {
    if (50 >= s.x && 50 <= s.x + s.w && ty >= s.y && ty <= s.y + s.h) titleGround = s.c;
  });

  // On a light ground the title must not stay white/pale — fall back to violeta.
  const lightTitleGround = !!LIGHT_GROUND[titleGround];
  const tc = lightTitleGround
    ? (t.tc === "#FFFFFF" || t.tc === "#87E1D1" || t.tc === "#39C2D4" ? "#7B00CD" : t.tc)
    : "#FFFFFF";

  // k is a 4-bit corner mask (TL TR BR BL); a set bit is heavily rounded.
  const shapes = t.b.map((s) => {
    const k = (s.k || "0000").split("");
    const rx = k.map((v) => (v === "1" ? "13%" : "0")).join(" ");
    const ry = k.map((v) => (v === "1" ? "10%" : "0")).join(" ");
    return {
      css: `position: absolute; left: ${s.x}%; top: ${s.y}%; width: ${s.w}%; height: ${s.h}%; background: ${s.c}; border-radius: ${rx} / ${ry};`,
    };
  });

  const family = main === "#7B00CD" ? "Violeta" : main === "#39C2D4" ? "Aqua" : "Cian";

  return (COVER_CACHE[key] = {
    id: key,
    front: `assets/covers/png/${key}${SWAPPED_FACES[key] ? "-2" : "-1"}.png`,
    back: `assets/covers/png/${key}${SWAPPED_FACES[key] ? "-1" : "-2"}.png`,
    name: "Plantilla " + (key.length < 2 ? "0" + key : key),
    family,
    main,
    shapes,
    wmFg: LIGHT_GROUND[ground] ? "#7B00CD" : "#FFFFFF",
    tc,
    titleTop: Math.max(4, Math.min(78, ty - 2.1)) + "%",
    backFg: main === "#87E1D1" ? "#410099" : "#FFFFFF",
    pillBg: "#FFFFFF",
    pillFg: main === "#87E1D1" ? "#410099" : main,
  });
}

export const TPL_FAMILIES = ["Todas", "Violeta", "Aqua", "Cian"];

export function tplTone(id) {
  const t = COVER_TPL[id];
  const b = (t.b || []).filter((x) => x.c !== "#FFFFFF");
  return b.length ? b[0].c : t.tc || "#7B00CD";
}

// Cluster templates that share a silhouette but differ in colour, so the
// picker shows one row per structure with a swatch per colourway.
export const TPL_GROUPS = (function () {
  const geom0 = (id) => (COVER_TPL[id].b || []).map((b) => [b.x, b.y, b.w, b.h]);

  const gap = (a, b) => {
    const ga = geom0(a);
    const gb = geom0(b);
    if (ga.length !== gb.length) return Infinity;
    let d = 0;
    ga.forEach((v, i) => v.forEach((n, j) => { d += Math.abs(n - gb[i][j]); }));
    return d;
  };

  const HIDDEN = { 55: 1 }; // blank template — never offered
  const unique = [];
  TPL_IDS.forEach((id) => {
    if (HIDDEN[id]) return;
    const tone = tplTone(id);
    const dup = unique.some((kept) => tplTone(kept) === tone && gap(kept, id) <= 8);
    if (!dup) unique.push(id);
  });

  const groups = unique.map((id) => ({ ids: [id], tones: { [tplTone(id)]: 1 } }));

  const pairs = [];
  unique.forEach((a, i) => unique.slice(i + 1).forEach((b) => pairs.push({ a, b, d: gap(a, b) })));

  pairs.sort((x, y) => x.d - y.d).forEach((p) => {
    if (p.d > 40) return;
    const ga = groups.find((g) => g.ids.indexOf(p.a) >= 0);
    const gb = groups.find((g) => g.ids.indexOf(p.b) >= 0);
    if (!ga || !gb || ga === gb) return;
    if (Object.keys(ga.tones).some((t) => gb.tones[t])) return; // one template per tone
    ga.ids = ga.ids.concat(gb.ids).sort((x, y) => Number(x) - Number(y));
    Object.keys(gb.tones).forEach((t) => { ga.tones[t] = 1; });
    groups.splice(groups.indexOf(gb), 1);
  });

  const KEEP = ["1", "56", "2", "26"];
  return groups.map((g) => g.ids).filter((ids) => ids.some((id) => KEEP.indexOf(id) >= 0));
})();

export function groupName(ids, fallback) {
  const hit = ids.find((id) => GROUP_NAMES[id]);
  return (hit && GROUP_NAMES[hit]) || fallback;
}
