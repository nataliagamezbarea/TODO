/* Tema global único: LIGHT/DARK persistente en localStorage. */
(function () {
  "use strict";
  const CLAVE = "tema";
  const root = document.documentElement;

  function normalizar(v) {
    return v === "dark" ? "dark" : "light";
  }

  function obtener() {
    try {
      const v = localStorage.getItem(CLAVE);
      if (v === "dark" || v === "light") return v;
    } catch (_) {}
    return root.dataset.tema === "dark" || root.classList.contains("modo-oscuro") ? "dark" : "light";
  }

  function aplicar(v) {
    const tema = normalizar(v);
    root.dataset.tema = tema;
    root.classList.toggle("modo-oscuro", tema === "dark");
    root.classList.toggle("modo-claro", tema === "light");
    if (document.body) {
      document.body.classList.toggle("modo-oscuro", tema === "dark");
      document.body.classList.toggle("modo-claro", tema === "light");
    }
    try { localStorage.setItem(CLAVE, tema); } catch (_) {}

    const boton = document.getElementById("btn-modo-oscuro");
    if (boton) {
      const icono = boton.querySelector("i");
      if (icono) {
        icono.classList.toggle("fa-moon", tema === "light");
        icono.classList.toggle("fa-sun", tema === "dark");
      }
      boton.title = tema === "dark" ? "Modo claro" : "Modo oscuro";
      boton.setAttribute("aria-label", boton.title);
    }
    return tema;
  }

  // Aplicación inmediata: nunca inferir "light" porque otra página no tenga la clase.
  aplicar(obtener());

  window.TemaGlobal = {
    obtener,
    aplicar,
    alternar: () => aplicar(obtener() === "dark" ? "light" : "dark")
  };

  document.addEventListener("DOMContentLoaded", () => {
    aplicar(obtener());
    const boton = document.getElementById("btn-modo-oscuro");
    if (boton && !boton.dataset.temaGlobalConectado) {
      boton.dataset.temaGlobalConectado = "1";
      boton.addEventListener("click", () => aplicar(obtener() === "dark" ? "light" : "dark"));
    }
  }, { once: true });
})();
