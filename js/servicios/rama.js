window.RamaActual = (() => {
  const CLAVE_LOCAL = "rama_actual";
  const CLAVE_CACHE_RAMAS = "cache_ramas_lista";

  const obtener = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ramaUrl = urlParams.get("rama");

    if (ramaUrl && ramaUrl.trim()) {
      guardar(ramaUrl.trim());
      return ramaUrl.trim();
    }

    const enEstado = window.Estado
      ? window.Estado.obtener("rama")
      : "";

    if (enEstado && enEstado.trim()) {
      return enEstado.trim();
    }

    return sessionStorage.getItem(CLAVE_LOCAL) || "";
  };

  const guardar = (rama) => {
    if (rama) {
      sessionStorage.setItem(CLAVE_LOCAL, rama);

      if (window.Estado) {
        window.Estado.guardar("rama", rama);
      }

      return;
    }

    sessionStorage.removeItem(CLAVE_LOCAL);

    if (window.Estado) {
      window.Estado.guardar("rama", "");
    }
  };

  const obtenerPesoOrdinal = (nombre) => {
    const s = String(nombre || "").toLowerCase();

    let pesoBase = 500;

    const esMedio =
      s.includes("medio") ||
      s.includes("smr");

    const esSuperior =
      s.includes("superior") ||
      s.includes("daw") ||
      s.includes("dam");

    const esPrimero =
      s.includes("primer") ||
      s.includes("1º") ||
      s.includes("1_") ||
      s.startsWith("1");

    const esSegundo =
      s.includes("segundo") ||
      s.includes("2º") ||
      s.includes("2_") ||
      s.startsWith("2");

    if (esMedio) {
      if (esPrimero) {
        pesoBase = 10;
      } else if (esSegundo) {
        pesoBase = 20;
      } else {
        pesoBase = 15;
      }
    } else if (esSuperior) {
      if (s.includes("daw")) {
        if (esPrimero) {
          pesoBase = 100;
        } else if (esSegundo) {
          pesoBase = 110;
        } else {
          pesoBase = 105;
        }
      } else if (s.includes("dam")) {
        if (esPrimero) {
          pesoBase = 200;
        } else if (esSegundo) {
          pesoBase = 210;
        } else {
          pesoBase = 205;
        }
      } else {
        if (esPrimero) {
          pesoBase = 300;
        } else if (esSegundo) {
          pesoBase = 310;
        } else {
          pesoBase = 305;
        }
      }
    }

    return pesoBase;
  };

  const ordenarRamas = (lista) => {
    return (lista || [])
      .slice()
      .sort((a, b) => {
        const pesoA = obtenerPesoOrdinal(a);
        const pesoB = obtenerPesoOrdinal(b);

        if (pesoA !== pesoB) {
          return pesoA - pesoB;
        }

        return a.localeCompare(b, "es", {
          sensitivity: "base"
        });
      });
  };

  const obtenerRamasCache = () => {
    try {
      const cache =
        localStorage.getItem(CLAVE_CACHE_RAMAS) ||
        sessionStorage.getItem(CLAVE_CACHE_RAMAS);

      if (cache) {
        const parseado = JSON.parse(cache);

        if (
          Array.isArray(parseado) &&
          parseado.length
        ) {
          return ordenarRamas(parseado);
        }
      }
    } catch (_) {
      // La caché es opcional.
    }

    return [];
  };

  const listarRamas = async () => {
    let ramas = [];

    try {
      if (window.Permisos?.asegurarSesion) {
        await window.Permisos.asegurarSesion();
      }

      const cliente = window.PermisosSupabase
        ? await window.PermisosSupabase.esperarCliente()
        : null;

      if (!cliente) {
        throw new Error("No hay cliente de Supabase disponible.");
      }

      /*
       * La configuración se obtiene directamente de Supabase.
       *
       * ADMIN:
       *   grados-informaticos.configuracion_privada
       *
       * INVITADO:
       *   grados-informaticos.configuracion_publica
       *
       * En ambas tablas las claves son exactamente:
       *   gh_repo
       *   gh_token
       */
      const esAdmin =
        window.Permisos?.esAdmin === true ||
        sessionStorage.getItem("esAdmin") === "true";

      const tablaConfiguracion = esAdmin
        ? "configuracion_privada"
        : "configuracion_publica";

      const resultado =
        await window.PermisosSupabase.consultarTablaConFallback(
          cliente,
          tablaConfiguracion,
          (tabla) =>
            tabla
              .select("clave, valor")
              .in("clave", ["gh_repo", "gh_token"])
        );

      if (resultado.error) {
        throw resultado.error;
      }

      const configuracion = {};

      for (const fila of resultado.data || []) {
        configuracion[String(fila.clave)] =
          String(fila.valor || "").trim();
      }

      const repo = configuracion.gh_repo || "";
      const token = configuracion.gh_token || "";

      console.info(
        "[Ramas] Configuración obtenida DIRECTAMENTE de Supabase:",
        {
          rol: esAdmin ? "admin" : "invitado",
          tabla: tablaConfiguracion,
          gh_repo: repo || "(vacío)",
          gh_token: token
            ? `${token.slice(0, 4)}…${token.slice(-4)}`
            : "(vacío)"
        }
      );

      if (!repo) {
        throw new Error(
          `La tabla ${tablaConfiguracion} no contiene gh_repo.`
        );
      }

      const partes = repo.split("/");

      if (partes.length !== 2 || !partes[0] || !partes[1]) {
        throw new Error(
          `El valor de gh_repo no tiene formato owner/repository: ${repo}`
        );
      }

      const owner = partes[0];
      const nombreRepositorio = partes[1];

      const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url =
        `https://api.github.com/repos/` +
        `${encodeURIComponent(owner)}/` +
        `${encodeURIComponent(nombreRepositorio)}` +
        `/branches?per_page=100`;

      console.info(
        "[Ramas] Consultando ramas del repositorio obtenido de Supabase:",
        `${owner}/${nombreRepositorio}`
      );

      const respuesta = await fetch(url, { headers });

      if (!respuesta.ok) {
        const detalle =
          await respuesta.text().catch(() => "");

        throw new Error(
          `GitHub respondió ${respuesta.status}: ${detalle}`
        );
      }

      const datos = await respuesta.json();

      ramas = (Array.isArray(datos) ? datos : [])
        .map((rama) =>
          rama?.name
            ? String(rama.name).trim()
            : ""
        )
        .filter(
          (nombre) =>
            nombre &&
            nombre.toLowerCase() !== "master"
        );

      ramas = ordenarRamas(ramas);

      console.info(
        "[Ramas] Ramas recibidas de GitHub:",
        ramas
      );

      if (ramas.length) {
        try {
          localStorage.setItem(
            CLAVE_CACHE_RAMAS,
            JSON.stringify(ramas)
          );
        } catch (_) {}
      }

      return ramas;
    } catch (error) {
      console.error(
        "[Ramas] No se pudieron obtener las ramas:",
        error
      );

      const cache = obtenerRamasCache();

      if (cache.length) {
        console.warn(
          "[Ramas] Usando caché de ramas como respaldo:",
          cache
        );
      }

      return cache;
    }
  };

  const renderizarOpciones = (
    select,
    listaRamas
  ) => {
    if (!select) {
      return;
    }

    select.innerHTML = "";

    const placeholder =
      document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "SELECCIONAR";
    placeholder.selected = true;
    placeholder.disabled = true;

    select.appendChild(placeholder);

    for (const rama of listaRamas || []) {
      const opcion =
        document.createElement("option");

      opcion.value = rama;
      opcion.textContent = rama;

      select.appendChild(opcion);
    }

    ensureAllBranchesOption(select);
  };

  const poblarSelector = async (select) => {
    if (!select) {
      return [];
    }

    const cache = obtenerRamasCache();

    if (cache.length) {
      renderizarOpciones(select, cache);
    } else {
      select.innerHTML =
        '<option value="" selected disabled>' +
        "⏳ Cargando clases..." +
        "</option>";
    }

    const ramasRed = await listarRamas();

    renderizarOpciones(
      select,
      ramasRed
    );

    return ramasRed;
  };

  return {
    obtener,
    guardar,
    listarRamas,
    poblarSelector
  };
})();

function ensureAllBranchesOption(select) {
  if (!select) {
    return;
  }

  let defaultOpt = Array.from(
    select.options
  ).find(
    (opcion) =>
      opcion.value === "" ||
      opcion.dataset.defaultBranch === "1"
  );

  if (!defaultOpt) {
    defaultOpt =
      document.createElement("option");

    defaultOpt.value = "";
    defaultOpt.textContent = "SELECCIONAR";
    defaultOpt.dataset.defaultBranch = "1";
  }

  select.insertBefore(
    defaultOpt,
    select.firstChild
  );

  Array.from(select.options).forEach(
    (opcion) => {
      if (
        opcion.dataset.allBranches === "1" ||
        opcion.value === "__ALL_BRANCHES__"
      ) {
        opcion.remove();
      }
    }
  );

  const allOpt =
    document.createElement("option");

  allOpt.value = "__ALL_BRANCHES__";
  allOpt.textContent =
    "— TODAS LAS RAMAS —";
  allOpt.dataset.allBranches = "1";

  select.appendChild(allOpt);
}
