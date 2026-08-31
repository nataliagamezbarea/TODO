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
    if (window.__APP_VISTA === "login" || window.__APP_VISTA === "visor") return null;
    let barra = document.getElementById("barra-superior");
    if (barra) return barra;
    barra = document.createElement("header");
    barra.id = "barra-superior";
    barra.className = "barra-superior";
    barra.innerHTML = `
      <div class="nav-left">
        <a id="btn-inicio" class="btn-inicio" href="${rutaInicio()}" title="Inicio" aria-label="Inicio">${iconos.inicio}</a>
        <a id="volver-atras" class="btn-volver" href="#" title="Volver atrás" aria-label="Volver atrás">${iconos.volver}</a>
      </div>
      <button id="boton-modo-edicion" class="boton-modo-edicion" type="button" title="Modo edición">
        <span class="btn-icon">✏️</span><span class="btn-text">EDITAR</span>
      </button>
      <div class="nav-right">
        <button id="btn-modo-oscuro" class="btn-modo-oscuro" type="button" title="Modo oscuro" aria-label="Cambiar tema">${iconos.oscuro}</button>
        <button id="boton-ajustes" class="btn-ajustes" type="button" title="Ajustes" aria-label="Ajustes">${iconos.ajustes}</button>
        <button id="btn-cerrar-sesion" class="btn-cerrar-sesion" type="button" title="Cerrar sesión" aria-label="Cerrar sesión">${iconos.salir}</button>
      </div>`;
    document.body.prepend(barra);
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
    if (!barra) return;
    const ruta = rutaInicio();
    const inicio = document.getElementById("btn-inicio");
    const volver = document.getElementById("volver-atras");
    if (inicio) inicio.href = ruta;
    if (volver && !volver.dataset.listener) {
      volver.dataset.listener = "1";
      volver.onclick = () => window.NavegacionApp?.ir("inicio") || (location.href = ruta);
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

    if (window.NavegacionApp?.ir) {
      window.NavegacionApp.ir("login");
    } else {
      location.replace("/");
    }
  };
    }
    window.__alternarModoOscuro = () => botonTema?.click();
    window.dispatchEvent(new CustomEvent("navbar-lista"));
    if (window.asegurarModoEdicionBoton) window.asegurarModoEdicionBoton();
    if (window.inicializarNavbarMovil) window.inicializarNavbarMovil({});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparar, { once: true });
  else preparar();
  window.addEventListener("ajustes-servidor-cargados", () => {
    tema(localStorage.getItem("modo_oscuro") === "true");
    actualizarIconoTema();
  });
  window.ComponenteNavbar = { inicializar: preparar };
})();

function ensureAllBranchesOption(select) {
  if (!select) return;
  const opcion = document.createElement("option");
  opcion.value = "__ALL_BRANCHES__";
  opcion.textContent = "— TODAS LAS RAMAS —";
  opcion.dataset.allBranches = "1";
  if (!Array.from(select.options).some(o => o.dataset.allBranches === "1")) select.appendChild(opcion);
}
