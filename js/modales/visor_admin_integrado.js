/*
 * Acceso único al Visor y Gestor de Documentos.
 * Ya no crea un iframe/modal dentro de la plataforma: navega a la página
 * completa del visor. Así el visor tiene todo el ancho/alto disponible,
 * es responsive y reutiliza la autenticación global.
 */
(() => {
  function obtenerRama(fallback = '') {
    return String(
      fallback ||
      (window.Estado && typeof window.Estado.obtener === 'function' && window.Estado.obtener('rama')) ||
      new URLSearchParams(window.location.search).get('rama') ||
      localStorage.getItem('last_grado') ||
      localStorage.getItem('rama_actual') ||
      ''
    ).trim();
  }

  function guardarContextoVisor({ archivo, rama, asignatura, trimestre, nombre, todas = false } = {}) {
    const ctx = {
      rama: (rama !== undefined ? String(rama || "").trim() : obtenerRama()),
      asignatura: asignatura || "",
      trimestre: trimestre || "",
      tarea: nombre || "",
      archivo: archivo || "",
      // Si viene un archivo concreto, el visor puede abrirlo directamente
      // sin reconstruir todos los grados/ramas antes de mostrarlo.
      directo: !!String(archivo || "").trim(),
      // Cuando el acceso contextual no trae un archivo concreto (p. ej.
      // desde una asignatura/trimestre), debe abrir la LISTA filtrada y
      // nunca reutilizar el último PDF que quedó abierto en el visor.
      abrirLista: !String(archivo || "").trim(),
      todas: !!todas,
      returnPath: window.location.pathname,
      returnSearch: ""
    };
    try { localStorage.setItem("visor_contexto", JSON.stringify(ctx)); } catch (_) {}
    if (window.Estado && typeof window.Estado.guardarContexto === "function") {
      window.Estado.guardarContexto({ rama: ctx.rama, asignatura: ctx.asignatura, trimestre: ctx.trimestre });
    }
    return ctx;
  }

  function construirURL(opciones = {}) {
    const script = Array.from(document.scripts).find(s =>
      /(?:^|\/)js\/modales\/visor_admin_integrado\.js(?:$|[?])/.test(s.src)
    );
    const base = script
      ? new URL('../../visor-admin/panel-administrador.html', script.src)
      : new URL('../visor-admin/panel-administrador.html', window.location.href);
    const tieneArchivo = !!String(opciones.archivo || "").trim();
    guardarContextoVisor({ ...opciones, abrirLista: !tieneArchivo });
    // Un acceso contextual sin archivo siempre significa "abrir la lista".
    // Limpiamos además el estado persistido del último documento para que
    // una navegación desde un trimestre/asignatura no vuelva al PDF anterior.
    if (!tieneArchivo) {
      try {
        localStorage.setItem("last_open", "0");
        localStorage.removeItem("last_archivo");
        localStorage.removeItem("last_archivo_rama");
        localStorage.removeItem("visor_pos");
      } catch (_) {}
    }
    // Los filtros NO viajan en la URL. Se recuperan desde localStorage.
    return new URL(base.href);
  }

  function esAdminActual() {
    return Boolean(window.Permisos && window.Permisos.esAdmin && !window.Permisos.vistaInvitado);
  }

  function abrir(opciones = {}) {
    if (!esAdminActual()) return false;
    // IMPORTANTE: si el llamador pasa rama:"" explícitamente (SELECCIONAR),
    // NO debemos recuperar la rama antigua de localStorage. En ese caso
    // significa TODAS LAS RAMAS. Solo usamos obtenerRama() cuando la propiedad
    // rama no ha sido proporcionada.
    const tieneRamaExplicita = Object.prototype.hasOwnProperty.call(opciones, "rama");
    const rama = String(tieneRamaExplicita ? (opciones.rama || "") : obtenerRama()).trim();
    const todas = opciones.todas === true || (tieneRamaExplicita && !rama) || (!tieneRamaExplicita && !rama);
    const url = construirURL({ ...opciones, rama: todas ? "" : rama, todas });
    // Página completa: el visor deja de competir por espacio con la plataforma.
    window.location.assign(url.href);
    return true;
  }

  function crearBotonVisorContextual({ rama, asignatura, trimestre, nombre, archivo, etiqueta = 'Abrir visor' } = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-descarga btn-visor-contextual';
    b.title = etiqueta;
    b.setAttribute('aria-label', etiqueta);
    b.innerHTML = '<i class="fa-solid fa-file-pen" aria-hidden="true"></i>';
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      abrir({ rama, asignatura, trimestre, nombre, archivo });
    });
    return b;
  }

  window.abrirVisorAdminIntegrado = abrir;
  window.crearBotonVisorContextual = crearBotonVisorContextual;
  window.construirURLVisorAdmin = construirURL;
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
