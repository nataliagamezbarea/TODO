async function inicializarVistaClase() {
  const urlRama = new URLSearchParams(window.location.search).get("rama");
  const rama = urlRama || (window.Estado ? window.Estado.obtener("rama") : "") || (window.RamaActual ? window.RamaActual.obtener() : "");
  if (urlRama) {
    if (window.RamaActual) window.RamaActual.guardar(urlRama);
    if (window.Estado) window.Estado.guardar("rama", urlRama);
  }
  if (window.InformacionGrado) {
    await window.InformacionGrado.pintar(rama);
  }
}

window.inicializarVistaClase = inicializarVistaClase;
if (!window.__routerVistasActivo) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializarVistaClase, { once: true });
  else inicializarVistaClase();
}


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
