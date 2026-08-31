(function () {
  const iconos = {
    inicio: '<i class="fa-solid fa-house" aria-hidden="true"></i>',
    volver: '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>',
    oscuro: '<i class="fa-solid fa-moon" aria-hidden="true"></i>',
    claro: '<i class="fa-solid fa-sun" aria-hidden="true"></i>',
    ajustes: '<i class="fa-solid fa-gear" aria-hidden="true"></i>',
    salir: '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>',
    menu: '<i class="fa-solid fa-bars" aria-hidden="true"></i>'
  };
  let actualizarIconoTema = () => {};

  function rutaInicio() {
    return "/";
  }

  function crearBarra() {
    const vista = window.__APP_VISTA || document.body?.dataset?.vista || document.documentElement?.dataset?.vista || "";
    if (vista === "login" || vista === "visor") {
      const host = document.querySelector("navbar-general");
      if (host) host.hidden = true;
      return null;
    }
    const host = document.querySelector("navbar-general");
    const barra = document.getElementById("barra-superior");
    if (!barra) return null;
    if (host) host.hidden = false;
    return barra;
  }

  function tema(oscuro) {
    const activo = Boolean(oscuro);
    document.documentElement.classList.toggle("modo-oscuro", activo);
    if (document.body) document.body.classList.toggle("modo-oscuro", activo);
    document.documentElement.dataset.theme = activo ? "dark" : "light";
    if (document.body) document.body.dataset.theme = activo ? "dark" : "light";
  }

  function temaActivo() {
    return document.documentElement.classList.contains("modo-oscuro") ||
      (document.body && document.body.classList.contains("modo-oscuro"));
  }

  function preparar() {
    const barra = crearBarra();
    const host = document.querySelector("navbar-general");
    const vista = window.__APP_VISTA || document.body?.dataset?.vista || document.documentElement?.dataset?.vista || "";
    if (host) host.hidden = (vista === "login");
    if (!barra) return;
    const ruta = rutaInicio();
    const inicio = document.getElementById("btn-inicio");
    const volver = document.getElementById("volver-atras");
    if (inicio) inicio.href = ruta;
    if (volver && !volver.dataset.listener) {
      volver.dataset.listener = "1";
      volver.onclick = (e) => { e?.preventDefault(); if (window.AppViews?.atras) window.AppViews.atras(); else window.location.href = "/"; };
    }
    const oscuro = localStorage.getItem("modo_oscuro") === "true";
    tema(oscuro);
    const botonTema = document.getElementById("btn-modo-oscuro");
    if (botonTema && !botonTema.dataset.listener) {
      botonTema.dataset.listener = "1";
      actualizarIconoTema = () => { botonTema.innerHTML = temaActivo() ? iconos.claro : iconos.oscuro; };
      botonTema.onclick = () => {
        const nuevo = !temaActivo();
        if (window.__guardarTemaOscuro) {
          window.__guardarTemaOscuro(nuevo);
        } else {
          tema(nuevo);
          localStorage.setItem("modo_oscuro", String(nuevo));
        }
        actualizarIconoTema();
      };
      actualizarIconoTema();
    }
    const salir = document.getElementById("btn-cerrar-sesion");
    if (salir && !salir.dataset.listener) {
      salir.dataset.listener = "1";
      salir.onclick = async () => {
    /*
     * Cerrar sesión debe limpiar también localStorage.
     * No usamos localStorage.clear() porque el navegador puede contener
     * datos de otras aplicaciones. Eliminamos únicamente las claves
     * creadas por esta aplicación.
     */
    const clavesApp = [
      "esAdmin",
      "modo_oscuro",
      "modo_edicion_live",
      "modo_edicion",
      "rama_actual",
      "visor_contexto",
      "visor_todas",
      "visor_pos",
      "visor_rama",
      "last_grado",
      "last_pos",
      "last_open",
      "last_archivo",
      "last_archivo_rama",
      "rama",
      "grado",
      "trimestre",
      "asignatura"
    ];

    for (const clave of clavesApp) {
      try {
        localStorage.removeItem(clave);
      } catch (_) {}
    }

    try {
      sessionStorage.clear();
    } catch (_) {}

    /*
     * La configuración de GitHub se vuelve a consultar desde Supabase
     * al iniciar la siguiente sesión.
     */
    try {
      delete window.GITHUB_CONFIG;
    } catch (_) {
      window.GITHUB_CONFIG = undefined;
    }

    try {
      await window.supabaseClient?.auth?.signOut();
    } catch (error) {
      console.warn("[Auth] Error cerrando sesión de Supabase:", error);
    }

    location.replace("/");
  };
    }
    window.__alternarModoOscuro = () => botonTema?.click();
    window.dispatchEvent(new CustomEvent("navbar-lista"));
    if (window.asegurarModoEdicionBoton) window.asegurarModoEdicionBoton();
    if (window.inicializarNavbarMovil) window.inicializarNavbarMovil({});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparar, { once: true });
  else preparar();
  window.addEventListener("app-vista-cambiada", (e) => {
    const vista = e?.detail?.vista || window.__APP_VISTA || "";
    const host = document.querySelector("navbar-general");
    if (host) host.hidden = (vista === "login");
    if (vista !== "login") preparar();
  });
  window.addEventListener("ajustes-servidor-cargados", () => {
    tema(localStorage.getItem("modo_oscuro") === "true");
    actualizarIconoTema();
  });
  window.ComponenteNavbar = { inicializar: preparar };
})();

