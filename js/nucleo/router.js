/* Router SPA de la aplicación.
   - La URL pública nunca contiene .html ni query/hash.
   - Los parámetros de entrada se guardan en localStorage y se eliminan de la URL.
   - El router decide qué vista física renderizar.
*/
(function () {
  "use strict";

  const RUTAS = {
    "/": "/inicio.html",
    "/inicio": "/inicio.html",
    "/asignaturas": "/modulos/asignaturas.html",
    "/asignatura": "/modulos/asignatura.html",
    "/clase": "/modulos/clase.html",
    "/apuntes": "/modulos/apuntes.html",
    "/iniciar-sesion": "/modulos/iniciar-sesion.html",
    "/visor-admin": "/visor-admin/panel-administrador.html"
  };

  const CLAVE_RUTA = "app_ruta";
  const CLAVE_PARAMETROS = "app_parametros_ruta";

  function limpiarPath(path) {
    const p = String(path || "/").replace(/\/+$/, "");
    return p || "/";
  }

  function guardarParametros() {
    const params = new URLSearchParams(location.search);
    const datos = {};
    for (const [k, v] of params.entries()) {
      if (v !== "") datos[k] = v;
    }
    if (Object.keys(datos).length) {
      try {
        const anteriores = JSON.parse(localStorage.getItem(CLAVE_PARAMETROS) || "{}");
        localStorage.setItem(CLAVE_PARAMETROS, JSON.stringify({ ...anteriores, ...datos }));
      } catch (_) {}
    }
    if (location.search || location.hash) {
      history.replaceState({}, document.title, location.pathname);
    }
    return datos;
  }

  function resolver(path) {
    const p = limpiarPath(path);
    if (RUTAS[p]) return RUTAS[p];
    if (/^\/asignatura\/[^/]+$/.test(p)) return RUTAS["/asignatura"];
    if (/^\/clase\/[^/]+$/.test(p)) return RUTAS["/clase"];
    return null;
  }

  function rutaLogicaDesdeFisica(path) {
    const p = limpiarPath(path);
    const tabla = Object.entries(RUTAS);
    for (const [logica, fisica] of tabla) {
      if (p === fisica) return logica;
    }
    if (p.endsWith("/panel-administrador.html")) return "/visor-admin";
    if (p.endsWith("/iniciar-sesion.html")) return "/iniciar-sesion";
    if (p.endsWith("/asignaturas.html")) return "/asignaturas";
    if (p.endsWith("/asignatura.html")) return "/asignatura";
    if (p.endsWith("/clase.html")) return "/clase";
    if (p.endsWith("/apuntes.html")) return "/apuntes";
    if (p.endsWith("/inicio.html")) return "/inicio";
    return null;
  }

  function contexto() {
    try { return JSON.parse(localStorage.getItem(CLAVE_PARAMETROS) || "{}"); }
    catch (_) { return {}; }
  }

  function normalizarEntrada() {
    guardarParametros();
    const logica = rutaLogicaDesdeFisica(location.pathname);
    if (logica) {
      try { localStorage.setItem(CLAVE_RUTA, logica); } catch (_) {}
      if (location.pathname !== logica || location.search || location.hash) {
        history.replaceState({}, document.title, logica);
      }
      return logica;
    }
    const actual = limpiarPath(location.pathname);
    try { localStorage.setItem(CLAVE_RUTA, actual); } catch (_) {}
    return actual;
  }

  async function cargarVista(logica, reemplazar = false) {
    const fisica = resolver(logica);
    if (!fisica) return false;

    const respuesta = await fetch(fisica, { cache: "no-store" });
    if (!respuesta.ok) throw new Error("No se pudo cargar " + fisica);

    let html = await respuesta.text();
    // El documento físico se resuelve desde la raíz, aunque la URL pública sea lógica.
    html = html.replace(/<head(\b[^>]*)>/i, '<head$1><base href="/">');
    document.open();
    document.write(html);
    document.close();

    try { localStorage.setItem(CLAVE_RUTA, logica); } catch (_) {}
    return true;
  }

  async function navegar(logica, opciones = {}) {
    let ruta = limpiarPath(logica);
    // Nunca transportar parámetros a la URL.
    if (!resolver(ruta)) {
      if (ruta.endsWith(".html")) ruta = rutaLogicaDesdeFisica(ruta) || "/inicio";
      else ruta = "/inicio";
    }
    guardarParametros();
    if (opciones.contexto) {
      try {
        const actual = contexto();
        localStorage.setItem(CLAVE_PARAMETROS, JSON.stringify({ ...actual, ...opciones.contexto }));
      } catch (_) {}
    }
    history.pushState({}, "", ruta);
    await cargarVista(ruta);
  }

  window.AppRouter = {
    rutas: RUTAS,
    resolver,
    contexto,
    rutaActual: () => limpiarPath(location.pathname),
    navegar,
    irA: (ruta, id) => {
      const contextoExtra = id == null ? {} : { id };
      return navegar(ruta, { contexto: contextoExtra });
    }
  };

  // Normalizar URL física/query antes de que la UI termine de arrancar.
  const rutaInicial = normalizarEntrada();

  // Si ya estamos en una URL lógica, el servidor estático no puede resolverla:
  // renderizamos la vista física correspondiente. Si ya estamos en la vista física,
  // solo la convertimos en URL lógica sin segundo render.
  document.addEventListener("DOMContentLoaded", async () => {
    const logica = limpiarPath(location.pathname);
    if (resolver(logica)) {
      // Si el documento actual ya es la vista física compilada, no volver a cargarla.
      // En una ruta lógica real, sí cargarla.
      const esFisica = !!rutaLogicaDesdeFisica(document.referrer ? new URL(document.referrer, location.origin).pathname : "");
      // La forma segura: si el body actual contiene contenido de la vista, solo garantizar
      // que la URL quede limpia. Las navegaciones nuevas pasan por navegar().
      try { localStorage.setItem(CLAVE_RUTA, logica); } catch (_) {}
    }
  });

  window.addEventListener("popstate", () => {
    const ruta = limpiarPath(location.pathname);
    if (resolver(ruta)) cargarVista(ruta).catch(err => console.error("[Router]", err));
  });
})();
