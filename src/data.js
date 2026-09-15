// Seed content for the prototype — manuals library, filter vocabulary and
// the canned AI suggestions the editor offers per page type.

// Cada manual pertenece al área de quien lo escribió: es lo que muestran las
// fichas de la biblioteca y por lo que filtra el desplegable de áreas.
export const MANUALS = [
  { title: "Confirming para clientes", area: "Producto",    meta: "12 pasos · editado hace 2 días",  owner: "Natalia González",        state: "En edición",           dot: "#FED925", tpl: "1"  },
  { title: "Alta de inversionista",    area: "Growth",      meta: "8 pasos · editado hace 1 semana", owner: "Juan Sebastián Hernández", state: "Borrador",             dot: "#9EA1A2", tpl: "9"  },
  { title: "Liquidaciones en Admin",   area: "Tecnología",  meta: "21 pasos · editado ayer",         owner: "Manuel Robles",            state: "Listo para descargar", dot: "#00AC69", tpl: "56" },
];

const SEEDED = MANUALS.concat([
  { title: "Cargue masivo de facturas",      area: "Producto",     meta: "16 pasos · editado hace 3 días", owner: "Katherine Rivera",   state: "En edición",           dot: "#FED925", tpl: "2"  },
  { title: "Firma electrónica de contratos", area: "Legal",        meta: "9 pasos · editado el 2 de sep",  owner: "Maria Paula Mejía",  state: "Listo para descargar", dot: "#00AC69", tpl: "26" },
  { title: "Recaudo y conciliación",         area: "Contabilidad", meta: "5 pasos · editado el 28 de ago", owner: "Catalina Villamil",  state: "Borrador",             dot: "#9EA1A2", tpl: "35" },
]);

// Los manuales de demostración solo declaran cuántos pasos tienen. Para que
// se puedan abrir y editar como cualquier otro, se les materializan las
// páginas: cuántas llevan título depende del estado del manual, que es lo que
// decide hasta qué paso del asistente se puede avanzar.
const DONE_RATIO = {
  "Listo para descargar": 1,
  "En edición": 0.6,
  "Borrador": 0.25,
};

function demoPages(m) {
  const steps = parseInt(m.meta, 10) || 6;
  const done = Math.max(1, Math.round(steps * (DONE_RATIO[m.state] ?? 0.25)));
  return Array.from({ length: steps }, (_, i) => ({
    kind: "shot",
    file: `captura-${String(i + 1).padStart(2, "0")}.png`,
    title: i < done ? `Paso ${i + 1}` : "",
    desc: "",
  }));
}

export const LIBRARY = SEEDED.map((m, i) => ({
  ...m,
  id: `demo-${i + 1}`,
  pages: demoPages(m),
}));

export const FILTERS = ["Todos", "Borrador", "En edición", "Listo para descargar"];

export const AREAS = [
  "Todas las áreas", "Producto", "Tecnología", "Legal", "Operaciones",
  "Comercial", "Growth", "Riesgos", "Data", "Contabilidad",
];

export const STEP_LABELS = ["Importar", "Editar", "Portada", "Descargar"];

export const SEED = [
  { file: "captura-01.png", title: "Entra a Financiación",   desc: "Desde el menú principal abre Financiación para ver las facturas cargadas." },
  { file: "captura-02.png", title: "Selecciona la factura",  desc: "" },
  { file: "captura-03.png", title: "", desc: "" },
  { file: "captura-04.png", title: "", desc: "" },
  { file: "captura-05.png", title: "", desc: "" },
  { file: "captura-06.png", title: "", desc: "" },
];

export const DRIVE_URL =
  "https://drive.google.com/drive/folders/18xt8V5u6oN5cKdUkLzJundEyKLJ0b1RO?usp=drive_link";

