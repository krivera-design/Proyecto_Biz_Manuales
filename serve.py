#!/usr/bin/env python3
"""Servidor del Creador de Manuales.

Sirve la app estática y expone POST /api/suggest, que le pasa la captura a
Gemini para redactar el paso. La clave de la API vive aquí, en el servidor:
nunca se envía al navegador.

La clave se lee del archivo .env (GEMINI_API_KEY). Se saca gratis en
https://aistudio.google.com/apikey

Uso:  python3 serve.py [puerto]
"""
import base64
import http.server
import json
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def cargar_env():
    """Lee un .env junto a este archivo, si existe.

    Así la clave se pone una sola vez y funciona sin importar cómo se arranque
    el servidor (terminal, editor, botón de preview). Lo que ya esté en el
    entorno manda: el .env no pisa nada.
    """
    ruta = os.path.join(ROOT, ".env")
    if not os.path.exists(ruta):
        return
    with open(ruta, encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith("#") or "=" not in linea:
                continue
            clave, _, valor = linea.partition("=")
            clave = clave.strip()
            valor = valor.strip().strip('"').strip("'")
            if clave and clave not in os.environ:
                os.environ[clave] = valor


cargar_env()

# Se puede fijar con GEMINI_MODEL en el .env; si no, se elige el primero de
# esta lista que la cuenta tenga disponible, del más nuevo al más viejo.
MODELOS_PREFERIDOS = (
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3-flash",
    "gemini-2.5-flash",
)
# Variantes que no sirven para esto: generan imagen, hablan, o son de embeddings.
EXCLUIR = ("-image", "-tts", "embedding", "-audio", "-live", "-native-audio")

_modelo_resuelto = None
_modelos_descartados = set()   # los que la cuenta lista pero no sirve (404)
MAX_IMAGE_BYTES = 6 * 1024 * 1024

SYSTEM = """Eres el asistente de redacción del Creador de Manuales de Plataform, \
una plataforma colombiana de financiación de facturas (confirming, pagadores, \
inversionistas).

Escribes pasos de manuales instructivos internos. Reglas:
- Español de Colombia, tuteando a quien lee.
- El título es una acción corta en imperativo, máximo 6 palabras. Sin punto final.
- La descripción son 1 o 2 frases: qué ve la persona y qué tiene que hacer.
- Nombra los elementos de la pantalla tal como aparecen escritos en la captura.
- No inventes botones, menús ni datos que no se vean. Si la captura no se \
entiende, descríbela de forma genérica en vez de suponer.
- Nada de relleno ni de frases como "en esta pantalla podrás"."""


def _cliente():
    from google import genai
    return genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def _modelo(client):
    """Primer modelo preferido que la cuenta tenga disponible y que funcione.

    Google lista modelos que luego devuelven 404 (retirados para cuentas
    nuevas), así que los que fallan se descartan y se pasa al siguiente.
    """
    global _modelo_resuelto
    if os.environ.get("GEMINI_MODEL"):
        return os.environ["GEMINI_MODEL"]
    if _modelo_resuelto:
        return _modelo_resuelto

    disponibles = []
    for m in client.models.list():
        nombre = (m.name or "").replace("models/", "")
        acciones = getattr(m, "supported_actions", None) or []
        if acciones and "generateContent" not in acciones:
            continue
        if any(x in nombre for x in EXCLUIR) or nombre in _modelos_descartados:
            continue
        disponibles.append(nombre)

    for preferido in MODELOS_PREFERIDOS:
        for nombre in disponibles:
            if nombre.startswith(preferido):
                _modelo_resuelto = nombre
                return nombre

    flash = [n for n in disponibles if "flash" in n]
    if flash:
        _modelo_resuelto = flash[0]
        return flash[0]

    raise RuntimeError(
        "ningún modelo de Gemini utilizable en esta cuenta. Probados y "
        f"descartados: {', '.join(sorted(_modelos_descartados)) or '(ninguno)'}"
    )


def _suggest(payload):
    """Llama a Gemini y devuelve {title} o {title, desc}."""
    from google.genai import types

    client = _cliente()
    kind = payload.get("kind") or "shot"
    ctx = payload.get("context") or {}

    partes = []
    if payload.get("image"):
        data = payload["image"]
        if len(data) > MAX_IMAGE_BYTES:
            raise ValueError("la captura es demasiado grande")
        partes.append(types.Part.from_bytes(
            data=base64.b64decode(data),
            mime_type=payload.get("mediaType") or "image/png",
        ))

    manual = ctx.get("manualTitle") or "(sin título todavía)"
    area = ctx.get("area") or "(sin área)"
    vecinos = [t for t in (ctx.get("neighbourTitles") or []) if t]
    vecinos_txt = "\n".join(f"- {t}" for t in vecinos) or "- (todavía no hay otros pasos escritos)"

    if kind == "manual-title":
        instruccion = (
            f"Propón el título de un manual del área {area}, a partir de los pasos "
            f"que lo componen.\n\nPasos:\n{vecinos_txt}\n\n"
            "La portada ya imprime «Manual Instructivo» encima del título, así que "
            "NO empieces por «Manual de» ni repitas esa palabra. Máximo 6 palabras. "
            "Nombra el procedimiento completo, no un paso suelto."
        )
    elif kind == "heading":
        instruccion = (
            f"Escribe el título y el texto de una SECCIÓN que agrupa los pasos "
            f"siguientes del manual «{manual}» (área {area}).\n\n"
            f"Pasos del manual:\n{vecinos_txt}\n\n"
            "El título nombra el bloque (no es un paso); el texto explica en una "
            "frase qué cubre la sección."
        )
    elif kind == "callout":
        instruccion = (
            f"Escribe un AVISO para el manual «{manual}» (área {area}): una "
            f"advertencia, excepción o cosa que suele salir mal en este punto.\n\n"
            f"Pasos alrededor:\n{vecinos_txt}\n\n"
            "El título es corto (por ejemplo «Ten en cuenta»); el texto explica el "
            "riesgo concreto en una o dos frases."
        )
    else:
        n = ctx.get("stepNumber")
        instruccion = (
            f"Esta es la captura del paso {n} del manual «{manual}» (área {area}).\n\n"
            f"Otros pasos ya escritos:\n{vecinos_txt}\n\n"
            "Mira la captura y escribe el título y la descripción de ESTE paso, "
            "basándote solo en lo que se ve en ella."
        )
        if not payload.get("image"):
            instruccion += (
                "\n\nNo hay captura disponible para este paso: redacta algo genérico "
                "y coherente con los pasos de alrededor."
            )

    partes.append(types.Part(text=instruccion))

    propiedades = {"title": {"type": "STRING"}}
    requeridos = ["title"]
    if kind != "manual-title":
        propiedades["desc"] = {"type": "STRING"}
        requeridos.append("desc")

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        temperature=0.4,
        max_output_tokens=1000,
        # Sin esto el modelo razona largo antes de responder y el botón tarda
        # decenas de segundos. Para leer una pantalla y escribir dos frases no
        # hace falta: 0 desactiva el pensamiento extendido.
        thinking_config=types.ThinkingConfig(thinking_budget=0),
        response_mime_type="application/json",
        response_schema={
            "type": "OBJECT",
            "properties": propiedades,
            "required": requeridos,
        },
    )
    contenido = [types.Content(role="user", parts=partes)]

    global _modelo_resuelto
    for _ in range(3):
        elegido = _modelo(client)
        try:
            resp = client.models.generate_content(
                model=elegido, contents=contenido, config=config)
            break
        except Exception as err:
            # Un 404 significa que ese modelo está listado pero no se sirve:
            # se descarta y se prueba con el siguiente de la lista.
            if "404" not in str(err) and "NOT_FOUND" not in str(err):
                raise
            _modelos_descartados.add(elegido)
            _modelo_resuelto = None
    else:
        raise RuntimeError("ningún modelo de Gemini respondió")

    texto = (resp.text or "").strip()
    if not texto:
        raise RuntimeError("el modelo no devolvió texto (¿filtro de seguridad?)")

    datos = json.loads(texto)
    salida = {"title": datos["title"].strip()}
    if "desc" in datos:
        salida["desc"] = datos["desc"].strip()
    return salida


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, body):
        raw = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        if self.path != "/api/suggest":
            self._json(404, {"error": "ruta desconocida"})
            return

        if not os.environ.get("GEMINI_API_KEY"):
            self._json(503, {"error": "El servidor no tiene GEMINI_API_KEY. "
                                      "Consíguela gratis en aistudio.google.com/apikey, "
                                      "ponla en el archivo .env junto a serve.py "
                                      "(GEMINI_API_KEY=...) y reinícialo."})
            return

        try:
            n = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            self._json(400, {"error": "petición mal formada"})
            return

        try:
            self._json(200, _suggest(payload))
        except Exception as err:
            sys.stderr.write(f"[suggest] {type(err).__name__}: {err}\n")
            self._json(502, {"error": f"{type(err).__name__}: {err}"})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        estado = ("con IA" if os.environ.get("GEMINI_API_KEY")
                  else "SIN GEMINI_API_KEY (las sugerencias fallarán)")
        print(f"Creador de Manuales → http://localhost:{PORT}  [{estado}]")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
