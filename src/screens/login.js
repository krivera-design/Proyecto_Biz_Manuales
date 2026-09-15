// Login — tarjeta de cristal sobre la fotografía de marca.
// El acceso es solo con Google y solo con cuentas de Plataform.
import { h, icon } from "../dom.js";
import { renderGoogleButton, ALLOWED_DOMAIN } from "../auth.js";

export function LoginScreen(store) {
  const s = store.state;

  const errorText = s.loginError === "domain"
    ? `Esa cuenta no es de Plataform. Entra con tu correo @${ALLOWED_DOMAIN}.`
    : s.loginError;

  return h(
    "div",
    {
      style: {
        flex: 1, height: "100vh", maxHeight: "100vh", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, overflow: "hidden",
        background: 'url("assets/login-bg.png") center / cover no-repeat',
      },
    },
    h(
      "div",
      {
        style: {
          position: "relative", zIndex: 1, width: "100%", maxWidth: 460,
          display: "flex", flexDirection: "column", gap: 32, padding: 40,
          borderRadius: 24, maxHeight: "calc(100vh - 48px)", overflow: "hidden",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 8px 40px rgba(16,24,40,0.14)",
        },
      },

      // Marca y bajada
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" } },
        h(
          "span",
          { style: { display: "inline-flex", alignItems: "baseline", lineHeight: 1, letterSpacing: "-0.02em", fontSize: 40, color: "#7B00CD" } },
          h("span", { style: { fontWeight: 700 } }, "Creador de"),
          h("span", { style: { fontWeight: 400, marginLeft: 7 } }, "Manuales")
        ),
        h("span", { style: { fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B00CD" } }, "By Plataform"),
        h("span", { style: { fontSize: 15, fontWeight: 300, lineHeight: 1.5, color: "#727272", maxWidth: 330 } },
          "Entra con tu cuenta de Google de Plataform para usar el creador de manuales.")
      ),

      // Acceso con Google
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 18 } },

        h("div", {
          style: { minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" },
          ref: (el) => renderGoogleButton(
            el,
            (user) => store.signIn(user),
            (err) => store.set({ loginError: err && err.message ? err.message : String(err) })
          ),
        }),

        s.loginError &&
          h("span", {
            style: {
              display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13,
              fontWeight: 500, color: "#D31A3C", textAlign: "center", maxWidth: 340,
            },
          }, icon("error", { fontSize: 18, flex: "none" }), errorText),

        h("span", { style: { fontSize: 12, fontWeight: 300, color: "#9EA1A2", textAlign: "center", maxWidth: 330 } },
          `Solo cuentas @${ALLOWED_DOMAIN}.`)
      )
    )
  );
}
