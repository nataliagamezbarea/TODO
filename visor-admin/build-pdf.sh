#!/usr/bin/env bash
set -euo pipefail

# Los PDFs ya los compila el workflow (paso xu-cheng/latex-action@v4 con
# XeLaTeX) en NUEVOS_APUNTES/<GRADO>/<NOMBRE>.pdf (varios si se pasan varios
# nombres). Este script sube cada PDF al repo GRADOS_INFORMATICOS (rama <GRADO>,
# carpeta apuntes/) usando la GitHub Contents API (un commit por PDF, sin clonar
# el repo, que contiene vídeos/zips muy pesados). Esa carpeta es donde el visor
# lee los apuntes compilados.
#
# Uso: build-pdf.sh <GRADO> [NOMBRE1 NOMBRE2 ...]
#
# Variables de entorno esperadas (las inyecta el workflow):
#   GITHUB_WORKSPACE, PAT_GRADOS (secret con write a GRADOS_INFORMATICOS)
#   SUPABASE_URL, SUPABASE_ANON_KEY (fallback para leer el token desde Supabase)

GRADO="${1:?grado requerido}"
shift || true
NOMBRES=("$@")
WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
REPO_PDFS="nataliagamezbarea/GRADOS_INFORMATICOS"
SRC_DIR="visor-admin/NUEVOS_APUNTES/${GRADO}"

cd "$WORKSPACE"

if [ "${#NOMBRES[@]}" -eq 0 ]; then
  echo "ERROR: debe indicarse al menos un nombre de apunte"
  echo "Apuntes disponibles en ${SRC_DIR}:"
  ls -1 "${SRC_DIR}"/*.tex 2>/dev/null || true
  exit 1
fi

# 1) Los PDFs deben existir: los produce el paso de compilación del workflow.
for NOMBRE in "${NOMBRES[@]}"; do
  if [ ! -f "${SRC_DIR}/${NOMBRE}.pdf" ]; then
    echo "ERROR: no se encontró el PDF compilado ${SRC_DIR}/${NOMBRE}.pdf"
    echo "Contenido de ${SRC_DIR}:"
    ls -la "${SRC_DIR}" || true
    exit 1
  fi
done

# 2) Obtener el token para escribir en GRADOS_INFORMATICOS.
#    Prioridad: 1) secret PAT_GRADOS del workflow, 2) fallback leyendo gh_token
#    desde Supabase (tabla public.configuracion) con la anon key, igual que hace
#    la app. Así solo hay que cambiar el token en un único sitio (Supabase).
TOKEN_GRADOS="${PAT_GRADOS:-}"
if [ -z "$TOKEN_GRADOS" ]; then
  echo "PAT_GRADOS vacío; leyendo gh_token desde Supabase..."
  TOKEN_GRADOS="$(python3 - "$SUPABASE_URL" "$SUPABASE_ANON_KEY" <<'PY'
import sys, json, urllib.request, urllib.parse
url, anon = sys.argv[1], sys.argv[2]
if not url or not anon:
    sys.exit(1)
q = urllib.parse.urlencode({"clave": "eq.gh_token", "select": "valor"})
req = urllib.request.Request(
    f"{url}/rest/v1/configuracion?{q}",
    headers={"apikey": anon, "Authorization": f"Bearer {anon}", "Accept": "application/json"},
)
with urllib.request.urlopen(req, timeout=15) as r:
    filas = json.loads(r.read().decode("utf-8"))
if filas:
    sys.stdout.write(str(filas[0].get("valor", "")))
PY
)"
fi
if [ -z "$TOKEN_GRADOS" ]; then
  echo "ERROR: no se pudo obtener el token (ni PAT_GRADOS ni Supabase)"
  exit 1
fi

# 3) Crear o actualizar cada PDF vía Contents API (sin clonar el repo).
for NOMBRE in "${NOMBRES[@]}"; do
  PDF_PATH="apuntes/${NOMBRE}.pdf"
  SRC_PDF="${SRC_DIR}/${NOMBRE}.pdf"
  echo "Subiendo ${NOMBRE}.pdf..."
  python3 - "$TOKEN_GRADOS" "$REPO_PDFS" "$GRADO" "$PDF_PATH" "$SRC_PDF" <<'PY'
import sys, base64, json, urllib.request, urllib.error

token, repo, branch, path, src = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
local = open(src, "rb").read()
api = f"https://api.github.com/repos/{repo}/contents/{path}"

def call(method, payload=None, query=""):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(api + query, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

try:
    existing = call("GET", query=f"?ref={branch}")
except urllib.error.HTTPError as e:
    if e.code != 404:
        print(f"ERROR: no se pudo leer {branch}/{path} ({e.code})")
        raise
    existing = None

if existing is not None:
    cur_bytes = base64.b64decode(existing["content"].replace("\n", ""))
    if cur_bytes == local:
        print(f"El PDF ya existe con el mismo contenido; nada que subir: {branch}/{path}")
        sys.exit(0)

payload = {
    "message": f"Apunte PDF: {branch}/{path.rsplit('/', 1)[-1]}",
    "content": base64.b64encode(local).decode(),
    "branch": branch,
}
if existing is not None:
    payload["sha"] = existing["sha"]

out = call("PUT", payload)
sha = out.get("commit", {}).get("sha", "")[:8]
print(f"PDF subido: {repo} -> {branch}/{path} (commit {sha})")
PY
done

# 4) El .tex residual de NUEVOS_APUNTES/<grado>/ de utilidades-grado NO se
#    limpia aquí: el workflow no tiene token del repo utilidades-grado (solo
#    PAT_GRADOS, limitado a GRADOS_INFORMATICOS). Lo limpia la app desde
#    /api/estado_compilacion cuando detecta el PDF listo, usando el gh_token de
#    configuracion_privada (mismo token con el que la app sube el .tex).

# 5) Limpiar temporales de la compilación del checkout de utilidades-grado.
rm -f "${SRC_DIR}/"*.aux \
      "${SRC_DIR}/"*.log \
      "${SRC_DIR}/"*.out \
      "${SRC_DIR}/"*.fls \
      "${SRC_DIR}/"*.fdb_latexmk \
      "${SRC_DIR}/"*.synctex.gz \
      "${SRC_DIR}/"*.toc \
      "${SRC_DIR}/"*.lof \
      "${SRC_DIR}/"*.lot \
      "${SRC_DIR}/"*_latexmk