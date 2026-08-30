/*
 * VISIBILIDAD BASADA EXCLUSIVAMENTE EN CSV + GITHUB
 *
 * No usa las tablas grados-informaticos.filas ni grados-informaticos.archivos.
 *
 * Modelo:
 *   - Repo privado = fuente de administración / material oculto.
 *   - Repo público = exactamente las filas que los invitados pueden ver.
 *   - Por defecto, una fila está PRIVADA.
 *   - Mostrar una fila => copia la fila y todos sus archivos del repo privado
 *     al público y la elimina del privado.
 *   - Ocultar una fila => hace el movimiento inverso.
 *
 * El token que escribe es SIEMPRE el token privado del administrador.
 */

window.PermisosVisibilidad = (() => {
  let mapaFilas = new Map();
  let cachePublico = new Map();

  const ramaActual = () =>
    new URLSearchParams(window.location.search).get("rama") ||
    (window.Estado ? window.Estado.obtener("rama") : "") ||
    (window.RamaActual ? window.RamaActual.obtener() : "") ||
    "";

  const normalizar = (v) => String(v ?? "").trim().toLowerCase();

  // Repositorio canónico/original: se usa únicamente para inicializar un
  // repositorio privado nuevo cuando todavía no contiene los CSV.
  const REPO_REAL = "nataliagamezbarea/GRADOS_INFORMATICOS";
  const CSV_INICIALES = ["APUNTES.csv", "EJERCICIOS_PRACTICAS_PROYECTOS.csv"];

  const asegurarCsvIniciales = async () => {
    if (!window.Permisos?.esAdmin) return { inicializados: false, motivo: "no-admin" };
    const r = ramaActual();
    const privado = repoPrivado();
    const publico = await repoPublico();
    const token = tokenAdmin();
    if (!r || !privado || !publico || !token) {
      return { inicializados: false, motivo: "configuracion-incompleta" };
    }

    // El repositorio público puede no tener todavía esta rama.
    // Se crea antes de intentar leer/crear los CSV para evitar los 404.
    await asegurarRama(publico, r, token);

    const resultado = [];
    for (const csv of CSV_INICIALES) {
      let fuente = await githubFile(privado, csv, r, token);

      // Si el CSV no existe todavía en el privado, se recupera del repo real
      // y se copia al privado. El repo real no se modifica.
      if (!fuente) {
        const real = await githubFile(REPO_REAL, csv, r, token);
        if (real) {
          await putFile(
            privado, csv, r, real.content, token,
            `Inicializar ${csv} desde repositorio real`, undefined
          );
          fuente = await githubFile(privado, csv, r, token);
        }
      }

      // El público solo contiene lo visible. Si no existe, se crea vacío pero
      // con exactamente las mismas columnas que el CSV privado/original.
      const existentePublico = await githubFile(publico, csv, r, token);
      if (!existentePublico) {
        const parsed = fuente ? parseCsv(fuente.content) : { fields: [] };
        const fields = parsed.fields?.length
          ? parsed.fields
          : ["ASIGNATURA", "TRIMESTRE", "NOMBRE", "ARCHIVO"];
        await putFile(
          publico, csv, r,
          unparseCsv([], fields), token,
          `Crear CSV público inicial ${csv}`, undefined
        );
      }

      resultado.push({ csv, privado: !!fuente, publicoCreado: !existentePublico });
    }
    return { inicializados: true, resultado };
  };

  const claveFila = (seccion, f) =>
    `${normalizar(seccion)}|${normalizar(f.ASIGNATURA)}|${normalizar(f.TRIMESTRE)}|${normalizar(f.NOMBRE)}`;

  const archivoDeSeccion = (seccion) =>
    normalizar(seccion) === "practicas"
      ? "EJERCICIOS_PRACTICAS_PROYECTOS.csv"
      : "APUNTES.csv";

  const configGithub = () => window.GITHUB_CONFIG || {};

  const tokenAdmin = () => {
    const c = configGithub();
    try {
      if (typeof c.obtenerTokenSeguro === "function") return String(c.obtenerTokenSeguro() || "").trim();
    } catch (e) {}
    return String(c.token || "").trim();
  };

  const repoPrivado = () => String(configGithub().repo || "").trim();
  // Repositorio REAL/original desde el que se inicializan los CSV privados
  // si todavía no existen en el repo privado configurado.
  const repoReal = () => "nataliagamezbarea/GRADOS_INFORMATICOS";

  const repoPublico = async () => {
    const c = configGithub();
    if (c.repoPublico) return String(c.repoPublico).trim();

    try {
      const cliente = window.PermisosSupabase
        ? await window.PermisosSupabase.esperarCliente()
        : null;
      if (cliente && window.PermisosSupabase) {
        const res = await window.PermisosSupabase.consultarTablaConFallback(
          cliente,
          "configuracion_publica",
          (t) => t.select("valor").eq("clave", "gh_repo").maybeSingle()
        );
        if (!res.error && res.data?.valor) {
          c.repoPublico = String(res.data.valor).trim();
          return c.repoPublico;
        }
      }
    } catch (e) {}
    return "";
  };

  const headers = (token) => {
    const h = {
      Accept: "application/vnd.github+json",
      "User-Agent": "grados-informaticos",
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const decode64 = (s) => {
    if (!s) return "";
    try {
      if (window.PermisosCrypto?.decodificarBase64) {
        return window.PermisosCrypto.decodificarBase64(s);
      }
      const bin = atob(String(s).replace(/\s+/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
    } catch (e) {
      return "";
    }
  };

  const encode64 = (s) => {
    const bytes = new TextEncoder().encode(String(s ?? ""));
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  };

  const githubFile = async (repo, path, branch, token) => {
    if (!repo || !path || !branch) return null;
    const url = `https://api.github.com/repos/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, { headers: headers(token) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
    const data = await res.json();
    return {
      sha: data.sha,
      content: decode64(data.content || ""),
      path: data.path || path,
      download_url: data.download_url || "",
    };
  };

  // Garantiza que la rama exista en el repositorio destino.
  // El repo público puede empezar completamente vacío: en ese caso se crea
  // la rama solicitada a partir de la rama por defecto del repositorio.
  const asegurarRama = async (repo, branch, token) => {
    if (!repo || !branch || !token) return false;
    const rama = encodeURIComponent(branch);
    const refUrl = `https://api.github.com/repos/${repo}/git/ref/heads/${rama}`;
    const existente = await fetch(refUrl, { headers: headers(token) });
    if (existente.ok) return true;
    if (existente.status !== 404) {
      throw new Error(`No se pudo comprobar la rama ${branch}: ${existente.status}`);
    }

    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers: headers(token) });
    if (!repoRes.ok) throw new Error(`No se pudo consultar el repositorio ${repo}: ${repoRes.status}`);
    const repoData = await repoRes.json();
    const baseBranch = String(repoData.default_branch || "").trim();
    if (!baseBranch) throw new Error(`El repositorio ${repo} no tiene rama por defecto.`);

    const baseRef = await fetch(
      `https://api.github.com/repos/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
      { headers: headers(token) }
    );
    if (!baseRef.ok) throw new Error(`No se pudo obtener la rama base ${baseBranch}: ${baseRef.status}`);
    const baseData = await baseRef.json();
    const sha = baseData.object?.sha;
    if (!sha) throw new Error(`No se pudo obtener el SHA de ${baseBranch}.`);

    const crear = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
      method: "POST",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    });
    if (crear.ok || crear.status === 422) return true;
    const detalle = await crear.text().catch(() => "");
    throw new Error(`No se pudo crear la rama ${branch}: ${crear.status} ${detalle}`);
  };

  const putFile = async (repo, path, branch, content, token, message, sha) => {
    const url = `https://api.github.com/repos/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const body = {
      message: message || "Actualizar material",
      content: encode64(content),
      branch,
    };
    if (sha) body.sha = sha;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GitHub PUT ${path}: ${res.status} ${txt}`);
    }
    return res.json();
  };

  const deleteFile = async (repo, path, branch, token, sha, message) => {
    if (!sha) return;
    const url = `https://api.github.com/repos/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || "Mover material",
        sha,
        branch,
      }),
    });
    if (res.status === 404) return;
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GitHub DELETE ${path}: ${res.status} ${txt}`);
    }
  };

  const parseCsv = (texto) => {
    if (!texto || !window.Papa) return { data: [], fields: [] };
    const r = window.Papa.parse(String(texto).replace(/^\uFEFF/, ""), {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      quotes: true,
    });
    return { data: Array.isArray(r.data) ? r.data : [], fields: r.meta?.fields || [] };
  };

  const unparseCsv = (rows, fields) => {
    const columnas = fields?.length
      ? fields
      : Array.from(
          rows.reduce((s, r) => {
            Object.keys(r || {}).forEach((k) => s.add(k));
            return s;
          }, new Set())
        );
    return window.Papa.unparse({ fields: columnas, data: rows }, {
      quotes: true,
      newline: "\n",
    }) + "\n";
  };

  const urlsDeFila = (f) =>
    String(f?.ARCHIVO || "")
      .split(/[,;]/)
      .map((u) => u.trim())
      .filter(Boolean)
      .filter((u) => !/^https?:\/\//i.test(u));

  const obtenerRutasReferenciadas = (rows) => {
    const set = new Set();
    rows.forEach((f) => urlsDeFila(f).forEach((u) => set.add(u.replace(/^\.?\//, ""))));
    return set;
  };

  const cargarMapaPublico = async (asignatura, trimestre) => {
    mapaFilas = new Map();
    cachePublico = new Map();

    const r = ramaActual();
    const repoPub = await repoPublico();
    if (!r || !repoPub) return;

    for (const seccion of ["apuntes", "practicas"]) {
      try {
        const file = await githubFile(repoPub, archivoDeSeccion(seccion), r, "");
        if (!file) continue;
        const { data } = parseCsv(file.content);
        data.forEach((f) => {
          if (asignatura && normalizar(f.ASIGNATURA) !== normalizar(asignatura)) return;
          if (trimestre && normalizar(f.TRIMESTRE) !== normalizar(trimestre)) return;
          const key = claveFila(seccion, f);
          mapaFilas.set(key, true);
          cachePublico.set(key, f);
        });
      } catch (e) {
        console.warn("No se pudo leer el CSV público:", e);
      }
    }
  };

  const cargarArchivos = async (asignatura, trimestre) => {
    await cargarMapaPublico(asignatura, trimestre);
  };

  const esVisibleParaInvitado = (seccion, nombre, asignatura, trimestre) => {
    // Los llamadores actuales solo pasan sección+nombre. Se busca en el
    // índice público ya cargado para esa página.
    const s = normalizar(seccion);
    const n = normalizar(nombre);
    for (const key of mapaFilas.keys()) {
      const [ks, ka, kt, kn] = key.split("|");
      if (ks === s && kn === n) return true;
    }
    return false;
  };

  const puedeVer = (seccion, nombre, esAdmin) => {
    if (esAdmin) return true;
    return esVisibleParaInvitado(seccion, nombre);
  };

  const esArchivoVisibleParaInvitado = (seccion, nombreFila, nombreArchivo) =>
    esVisibleParaInvitado(seccion, nombreFila);

  const obtenerFilasRepo = async (repo, nombreCsv, rama, token, permitirInicializarDesdeReal = false) => {
    let file = await githubFile(repo, nombreCsv, rama, token);

    // El privado parte por defecto del contenido REAL/original. Si el CSV aún
    // no existe allí, lo usamos como origen inicial sin perder ninguna línea.
    // El siguiente movimiento guardará el CSV resultante en el repo privado.
    if (!file && permitirInicializarDesdeReal && repo !== repoReal()) {
      const original = await githubFile(repoReal(), nombreCsv, rama, token);
      if (original) file = { ...original, sha: null, path: nombreCsv, __desdeReal: true };
    }

    if (!file) {
      // En el repo público esto significa simplemente que se creará al publicar
      // la primera fila, usando las columnas del CSV de origen.
      return { file: null, rows: [], fields: [] };
    }
    const parsed = parseCsv(file.content);
    return { file, rows: parsed.data, fields: parsed.fields, desdeReal: !!file.__desdeReal };
  };

  const coincideMovimiento = (f, asignatura, trimestre, nombre) => {
    if (normalizar(f.NOMBRE) !== normalizar(nombre)) return false;
    if (asignatura && normalizar(f.ASIGNATURA) !== normalizar(asignatura)) return false;
    if (trimestre && normalizar(f.TRIMESTRE) !== normalizar(trimestre)) return false;
    return true;
  };

  const asegurarArchivoEnRepo = async (repoDestino, ruta, rama, token, repoOrigen) => {
    if (!ruta || !repoDestino || !repoOrigen) return;
    const destino = await githubFile(repoDestino, ruta, rama, token);
    if (destino) return;

    const origen = await githubFile(repoOrigen, ruta, rama, token);
    if (!origen) {
      console.warn(`No se encontró el archivo ${ruta} en ${repoOrigen}/${rama}`);
      return;
    }

    // Recuperamos contenido binario mediante download_url para no corromper PDFs/videos.
    let contenidoBinarioBase64 = null;
    if (origen.download_url) {
      const res = await fetch(origen.download_url, { headers: headers(token) });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const bytes = new Uint8Array(ab);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        contenidoBinarioBase64 = btoa(bin);
      }
    }

    if (!contenidoBinarioBase64) {
      // GitHub contents devuelve base64; volver a obtenerlo sin decodificar.
      const url = `https://api.github.com/repos/${repoOrigen}/contents/${ruta.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(rama)}`;
      const res = await fetch(url, { headers: headers(token) });
      if (!res.ok) throw new Error(`No se pudo leer ${ruta} desde ${repoOrigen}`);
      const d = await res.json();
      contenidoBinarioBase64 = String(d.content || "").replace(/\s+/g, "");
    }

    const urlPut = `https://api.github.com/repos/${repoDestino}/contents/${ruta.split("/").map(encodeURIComponent).join("/")}`;
    const resPut = await fetch(urlPut, {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Publicar archivo ${ruta}`,
        content: contenidoBinarioBase64,
        branch: rama,
      }),
    });
    if (!resPut.ok) {
      const txt = await resPut.text().catch(() => "");
      throw new Error(`No se pudo copiar ${ruta} al repositorio destino: ${resPut.status} ${txt}`);
    }
  };

  const eliminarArchivoSiNoSeReferencia = async (repo, ruta, rama, token, rowsRestantes) => {
    const referencias = obtenerRutasReferenciadas(rowsRestantes);
    if (referencias.has(ruta)) return;
    const f = await githubFile(repo, ruta, rama, token);
    if (f) await deleteFile(repo, ruta, rama, token, f.sha, `Retirar archivo ${ruta}`);
  };

  const mover = async (asignatura, trimestre, seccion, nombres, visible) => {
    if (!window.Permisos?.esAdmin) return { error: "Solo el administrador puede mover material." };

    const r = ramaActual();
    const privado = repoPrivado();
    const publico = await repoPublico();
    const token = tokenAdmin();

    if (!r) return { error: "No hay rama seleccionada." };
    if (!privado || !publico) return { error: "Faltan los repositorios privado/público." };
    if (!token) return { error: "No hay token privado de GitHub." };

    const csv = archivoDeSeccion(seccion);
    const nombresSet = new Set((nombres || []).map(normalizar).filter(Boolean));

    // Para publicar: privado -> público.
    // Para ocultar: público -> privado.
    const origenRepo = visible ? privado : publico;
    const destinoRepo = visible ? publico : privado;

    // El único token de escritura es el privado y también tiene permisos
    // sobre el repositorio público.
    if (origenRepo === publico || destinoRepo === publico) {
      await asegurarRama(publico, r, token);
    }

    const origen = await obtenerFilasRepo(
      origenRepo,
      csv,
      r,
      token,
      visible && origenRepo === privado
    );
    const destino = await obtenerFilasRepo(
      destinoRepo,
      csv,
      r,
      token,
      !visible && destinoRepo === privado
    );

    const moverRows = origen.rows.filter((f) =>
      nombresSet.has(normalizar(f.NOMBRE)) &&
      coincideMovimiento(f, asignatura, trimestre, f.NOMBRE)
    );

    if (!moverRows.length) {
      // Si el nombre no se encontró con trimestre exacto, intenta por nombre+asignatura.
      const alternativo = origen.rows.filter((f) =>
        nombresSet.has(normalizar(f.NOMBRE)) &&
        (!asignatura || normalizar(f.ASIGNATURA) === normalizar(asignatura)) &&
        (!trimestre || normalizar(f.TRIMESTRE) === normalizar(trimestre))
      );
      moverRows.push(...alternativo.filter((x) => !moverRows.includes(x)));
    }

    if (!moverRows.length) {
      await cargarMapaPublico(asignatura, trimestre);
      return { error: null, movidas: 0 };
    }

    const clavesMover = new Set(moverRows.map((f) => claveFila(seccion, f)));
    const restantesOrigen = origen.rows.filter((f) => !clavesMover.has(claveFila(seccion, f)));

    const existentesDestino = new Set(destino.rows.map((f) => claveFila(seccion, f)));
    const nuevasDestino = destino.rows.slice();
    moverRows.forEach((f) => {
      if (!existentesDestino.has(claveFila(seccion, f))) nuevasDestino.push(f);
    });

    // Copiar primero todos los archivos. Así nunca dejamos una fila pública
    // apuntando a un archivo que todavía no existe.
    const rutas = Array.from(obtenerRutasReferenciadas(moverRows));
    for (const ruta of rutas) {
      await asegurarArchivoEnRepo(destinoRepo, ruta, r, token, origenRepo);
    }

    // Actualizar ambos CSV.
    const fields = destino.fields.length ? destino.fields : (origen.fields.length ? origen.fields : []);
    const nuevoDestinoCsv = unparseCsv(nuevasDestino, fields);
    const nuevoOrigenCsv = unparseCsv(restantesOrigen, origen.fields.length ? origen.fields : fields);

    await putFile(
      destinoRepo,
      csv,
      r,
      nuevoDestinoCsv,
      token,
      `${visible ? "Publicar" : "Ocultar"} ${asignatura || ""} - ${seccion}`,
      destino.file?.sha
    );

    await putFile(
      origenRepo,
      csv,
      r,
      nuevoOrigenCsv,
      token,
      `${visible ? "Retirar del privado" : "Devolver al privado"} ${asignatura || ""} - ${seccion}`,
      origen.file?.sha
    );

    // Finalmente retiramos los archivos del origen solo si ninguna otra fila
    // del CSV de origen los sigue usando.
    for (const ruta of rutas) {
      await eliminarArchivoSiNoSeReferencia(origenRepo, ruta, r, token, restantesOrigen);
    }

    await cargarMapaPublico(asignatura, trimestre);
    return { error: null, movidas: moverRows.length };
  };

  const guardarVisibilidad = async (asignatura, trimestre, seccion, nombre, visible) => {
    const res = await mover(asignatura, trimestre, seccion, [nombre], Boolean(visible));
    if (res.error) console.warn("No se pudo cambiar visibilidad:", res.error);

    window.dispatchEvent(new CustomEvent("visibilidad-csv-cambiada", {
      detail: { asignatura, trimestre, seccion, nombre, visible: Boolean(visible) }
    }));
    return res;
  };

  const guardarVisibilidadSeccion = async (asignatura, trimestre, seccion, listaNombres, visible) => {
    const res = await mover(asignatura, trimestre, seccion, listaNombres, Boolean(visible));
    if (res.error) console.warn("No se pudo cambiar sección:", res.error);

    window.dispatchEvent(new CustomEvent("visibilidad-csv-cambiada", {
      detail: { asignatura, trimestre, seccion, nombres: listaNombres, visible: Boolean(visible) }
    }));
    return res;
  };

  // Se conserva el nombre de la API para no romper llamadas antiguas.
  // Ahora un archivo no tiene visibilidad independiente: hereda la de su fila.
  const guardarVisibilidadArchivo = async (asignatura, trimestre, seccion, nombreFila, nombreArchivo, visible) =>
    guardarVisibilidad(asignatura, trimestre, seccion, nombreFila, visible);

  return {
    cargarArchivos,
    puedeVer,
    esVisibleParaInvitado,
    esArchivoVisibleParaInvitado,
    guardarVisibilidad,
    guardarVisibilidadArchivo,
    guardarVisibilidadSeccion,
    asegurarCsvIniciales,
  };
})();


/* Selector de ramas: siempre conserva SELECCIONAR y permite TODAS las ramas */
function ensureAllBranchesOption(select) {
  if (!select) return;

  // SELECCIONAR siempre primero
  let defaultOpt = Array.from(select.options).find(o =>
    o.value === "" || o.dataset.defaultBranch === "1"
  );
  if (!defaultOpt) {
    defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "SELECCIONAR";
    defaultOpt.dataset.defaultBranch = "1";
  }
  select.insertBefore(defaultOpt, select.firstChild);

  // TODAS LAS RAMAS siempre al FINAL
  Array.from(select.options).forEach(o => {
    if (o.dataset.allBranches === "1" || o.value === "__ALL_BRANCHES__") o.remove();
  });
  const allOpt = document.createElement("option");
  allOpt.value = "__ALL_BRANCHES__";
  allOpt.textContent = "— TODAS LAS RAMAS —";
  allOpt.dataset.allBranches = "1";
  select.appendChild(allOpt);
}
