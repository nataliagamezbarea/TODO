document.addEventListener("DOMContentLoaded", () => {
  const enlaceAtras = document.getElementById("volver-atras");
  if (!enlaceAtras) return;

  enlaceAtras.addEventListener("click", (event) => {
    event.preventDefault();

    if (event.defaultPrevented && event.cancelBubble) return;

    const rama = (window.Estado ? window.Estado.obtener("rama") : "") || (window.RamaActual ? window.RamaActual.obtener() : "compartido");
    const trimestre = (window.Estado ? window.Estado.obtener("trimestre") : "") || "1";
    const asignatura = (window.Estado ? window.Estado.obtener("asignatura") : "") || "";
    const path = window.location.pathname;

    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
      return;
    }

    if (path.includes("apuntes_practicas_ejercicios_tareas")) {
      window.location.href = `asignatura.html?asignatura=${encodeURIComponent(asignatura)}&trimestre=${encodeURIComponent(trimestre)}&rama=${encodeURIComponent(rama)}`;
    } else if (path.includes("asignatura.")) {
      window.location.href = `asignaturas.html?trimestre=${encodeURIComponent(trimestre)}&rama=${encodeURIComponent(rama)}`;
    } else if (path.includes("asignaturas.")) {
      window.location.href = `clase.html?rama=${encodeURIComponent(rama)}`;
    } else if (path.includes("clase.")) {
      const rutaIndex = path.includes("/modulos/") ? "../index.html" : "index.html";
      window.location.href = rutaIndex;
    } else {
      const rutaIndex = path.includes("/modulos/") ? "../index.html" : "index.html";
      window.location.href = rutaIndex;
    }
  });
});


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
