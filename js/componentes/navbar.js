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
    if (document.getElementById("visor-navbar-brand")) return "../inicio.html";
    return location.pathname.includes("/modulos/") ? "../inicio.html" : "inicio.html";
  }

  function crearBarra() {
    if (/login\.html|visor\.html/.test(location.pathname)) return null;
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
    document.documentElement.classList.toggle("modo-oscuro", oscuro);
    document.body.classList.toggle("modo-oscuro", oscuro);
  }

  function temaActivo() {
    return document.documentElement.classList.contains("modo-oscuro") || document.body.classList.contains("modo-oscuro");
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
      volver.onclick = () => history.length > 1 ? history.back() : location.href = ruta;
    }
    const oscuro = localStorage.getItem("modo_oscuro") === "true";
    tema(oscuro);
    const botonTema = document.getElementById("btn-modo-oscuro");
    if (botonTema && !botonTema.dataset.listener) {
      botonTema.dataset.listener = "1";
      actualizarIconoTema = () => { botonTema.innerHTML = temaActivo() ? iconos.claro : iconos.oscuro; };
      botonTema.onclick = () => { const nuevo = !temaActivo(); tema(nuevo); localStorage.setItem("modo_oscuro", String(nuevo)); actualizarIconoTema(); };
      actualizarIconoTema();
    }
    const salir = document.getElementById("btn-cerrar-sesion");
    if (salir && !salir.dataset.listener) {
      salir.dataset.listener = "1";
      salir.onclick = async () => { sessionStorage.clear(); try { await window.supabaseClient?.auth?.signOut(); } catch (_) {} location.replace(document.getElementById("visor-navbar-brand") || location.pathname.includes("/modulos/") ? "../modulos/iniciar-sesion.html" : "modulos/iniciar-sesion.html"); };
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
