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
      // Un archivo concreto siempre significa APERTURA DIRECTA del documento.
      directo: !!String(archivo || "").trim(),
      todas: !!todas,
      returnPath: window.location.pathname + (window.location.search || ""),
      returnSearch: window.location.search || ""
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
      ? new URL('../../visor-admin/index.html', script.src)
      : new URL('../visor-admin/index.html', window.location.href);
    guardarContextoVisor(opciones);
    const url = new URL(base.href);

    // Los datos siguen guardándose en localStorage, pero también enviamos el
    // contexto en la URL. Así una apertura desde GitHub/archivo/trimestre no
    // puede caer en la pantalla inicial aunque exista estado antiguo en el
    // navegador. La página de destino consume estos parámetros y limpia la URL.
    const rama = String(opciones.rama || "").trim();
    const asignatura = String(opciones.asignatura || "").trim();
    const trimestre = String(opciones.trimestre || "").trim();
    const archivo = String(opciones.archivo || "").trim();
    if (rama) url.searchParams.set("rama", rama);
    if (asignatura) url.searchParams.set("asignatura", asignatura);
    if (trimestre) url.searchParams.set("trimestre", trimestre);
    if (archivo) url.searchParams.set("archivo", archivo);
    if (opciones.todas === true && !rama) url.searchParams.set("todas", "1");
    const retorno = String(window.location.pathname + (window.location.search || ""));
    if (retorno.startsWith("/")) url.searchParams.set("return", retorno);
    return url;
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
