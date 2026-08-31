/* Navbar: comportamiento de un único componente visual. */
(function () {
  "use strict";

  function rutaInicio() { return "/inicio"; }

  function preparar() {
    const barra = document.getElementById("barra-superior");
    if (!barra) return;

    const inicio = document.getElementById("btn-inicio");
    const volver = document.getElementById("volver-atras");

    if (inicio) {
      inicio.href = "/inicio";
      if (!inicio.dataset.routerConectado) {
        inicio.dataset.routerConectado = "1";
        inicio.addEventListener("click", e => {
          e.preventDefault();
          window.AppRouter?.navegar("/inicio") ?? (location.href = "/inicio");
        });
      }
    }

    if (volver && !volver.dataset.listener) {
      volver.dataset.listener = "1";
      volver.href = "#";
      volver.addEventListener("click", e => {
        e.preventDefault();
        if (history.length > 1) history.back();
        else window.AppRouter?.navegar("/inicio") ?? (location.href = "/inicio");
      });
    }

    const botonTema = document.getElementById("btn-modo-oscuro");
    if (botonTema && !botonTema.dataset.listener) {
      botonTema.dataset.listener = "1";
      const actualizar = () => {
        const oscuro = window.TemaGlobal?.obtener() === "dark";
        const icono = botonTema.querySelector("i");
        if (icono) {
          icono.classList.toggle("fa-moon", !oscuro);
          icono.classList.toggle("fa-sun", oscuro);
        }
        botonTema.title = oscuro ? "Modo claro" : "Modo oscuro";
      };
      botonTema.addEventListener("click", actualizar);
      actualizar();
    }

    const salir = document.getElementById("btn-cerrar-sesion");
    if (salir && !salir.dataset.listener) {
      salir.dataset.listener = "1";
      salir.addEventListener("click", async () => {
        sessionStorage.clear();
        try { await window.supabaseClient?.auth?.signOut(); } catch (_) {}
        window.AppRouter?.navegar("/iniciar-sesion") ?? location.replace("/iniciar-sesion");
      });
    }

    window.__alternarModoOscuro = () => window.TemaGlobal?.alternar();
    window.dispatchEvent(new CustomEvent("navbar-lista"));
    if (window.asegurarModoEdicionBoton) window.asegurarModoEdicionBoton();
    if (window.inicializarNavbarMovil) window.inicializarNavbarMovil({});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparar, { once: true });
  else preparar();

  window.ComponenteNavbar = { inicializar: preparar };
})();
