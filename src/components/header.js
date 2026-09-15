// Sticky app header: wordmark, Biblioteca nav and the user menu.
import { h, icon } from "../dom.js";

export function Header(store) {
  const s = store.state;
  const onManuals = s.screen === "manuals";
  const user = s.user || { name: "—", email: "", picture: "", initials: "?" };

  return h(
    "header",
    {
      style: {
        height: 80, flex: "none", background: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(16,24,40,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", position: "sticky", top: 0, zIndex: 20,
      },
    },

    h(
      "div",
      {
        style: { display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" },
        onClick: () => store.set({ screen: "manuals" }),
      },
      h(
        "span",
        { style: { display: "inline-flex", alignItems: "baseline", lineHeight: 1, letterSpacing: "-0.01em", color: "#7B00CD", fontSize: 30 } },
        h("span", { style: { fontWeight: 400 } }, "Creador de "),
        h("span", { style: { fontWeight: 700, marginLeft: 5 } }, "Manuales")
      )
    ),

    h(
      "nav",
      { style: { display: "flex", alignItems: "center", gap: 32 } },

      h("span", {
        class: "nav-link",
        style: {
          fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          paddingBottom: 4, cursor: "pointer",
          color: onManuals ? "#7B00CD" : "#727272",
          borderBottom: onManuals ? "2px solid #7B00CD" : "2px solid transparent",
        },
        onClick: () => store.set({ screen: "manuals" }),
      }, "Biblioteca"),

      h("span", { style: { width: 1, height: 24, background: "#EBECEC" } }),

      h(
        "div",
        { style: { position: "relative" } },
        h("span", {
          class: "avatar",
          title: user.email,
          style: {
            width: 36, height: 36, borderRadius: 999, background: "#F3F3F3", color: "#7B00CD",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, cursor: "pointer", overflow: "hidden",
            backgroundImage: user.picture ? `url("${user.picture}")` : null,
            backgroundSize: "cover", backgroundPosition: "center",
          },
          onClick: (e) => { e.stopPropagation(); store.set({ userMenuOpen: !s.userMenuOpen }); },
        }, user.picture ? "" : user.initials),

        s.userMenuOpen &&
          h(
            "div",
            {
              style: {
                position: "absolute", top: 48, right: 0, minWidth: 230, background: "#FFFFFF",
                borderRadius: 8, boxShadow: "0 8px 24px rgba(16,24,40,0.12)", padding: 8, zIndex: 40,
              },
              onClick: (e) => e.stopPropagation(),
            },
            h(
              "div",
              { style: { padding: "10px 12px 12px", borderBottom: "1px solid #F3F3F3", display: "flex", flexDirection: "column", gap: 2 } },
              h("span", { style: { fontSize: 14, fontWeight: 700, color: "#3C3C3C" } }, user.name),
              h("span", { style: { fontSize: 12, fontWeight: 300, color: "#727272" } }, user.email)
            ),
            h("span", {
              class: "logout",
              style: {
                marginTop: 6, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 6, fontSize: 14, fontWeight: 500, color: "#D31A3C", cursor: "pointer",
              },
              onClick: () => store.doLogout(),
            }, icon("power_settings_new", { fontSize: 18 }), "Cerrar sesión")
          )
      )
    )
  );
}
