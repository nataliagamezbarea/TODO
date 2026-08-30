/* SECCIONES PRINCIPALES DE VISTA (< 60 lineas) */

function render() {
  renderStats();
  const c = document.getElementById('content');
  if (!c) return;
  c.innerHTML = '';

  const itemsVista = typeof obtenerItemsBusqueda === 'function' ? obtenerItemsBusqueda() : (Array.isArray(ITEMS) ? ITEMS : []);
  const entriesVista = itemsVista.filter(it => it.type === 'e');
  const noCambianVista = itemsVista.filter(it => it.type === 'n');

  const todosLatex = [
    ...entriesVista,
    ...noCambianVista
  ].filter(it => it.latex_compilado);

  if (todosLatex.length > 0) {
    const s0 = document.createElement('div');
    s0.className = 'sec';
    s0.innerHTML = '<h3><i class="fa-solid fa-file-circle-check" style="color:#34d399"></i> Apuntes LaTeX Ya Compilados (' + todosLatex.length + ')</h3>';
    const grid0 = document.createElement('div');
    grid0.className = 'grid';
    renderProgressiveGrid(grid0, todosLatex);
    s0.appendChild(grid0);
    c.appendChild(s0);
  }

  const s1 = document.createElement('div');
  s1.className = 'sec';
  s1.innerHTML = '<h3><i class="fa-solid fa-pen-fancy" style="color:#f87171"></i> Archivos con Reescritura de Enunciado (' + entriesVista.length + ')</h3>';

  const gEntriesBySub = groupBySubfolder(entriesVista);
  Object.keys(gEntriesBySub).sort().forEach(sub => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'subfolder-group';
    groupWrap.innerHTML = `<div class="subfolder-header"><i class="fa-solid fa-folder-open"></i> Subapartado: <b>${sub}</b> (${gEntriesBySub[sub].length} archivos)</div>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    renderProgressiveGrid(grid, gEntriesBySub[sub]);
    groupWrap.appendChild(grid);
    s1.appendChild(groupWrap);
  });
  c.appendChild(s1);

  const s2 = document.createElement('div');
  s2.className = 'sec';
  s2.innerHTML = '<h3><i class="fa-solid fa-user-slash" style="color:#3b82f6"></i> Archivos de Apuntes y Limpieza de Nombres (' + noCambianVista.length + ')</h3>';

  const gNoCambBySub = groupBySubfolder(noCambianVista);
  Object.keys(gNoCambBySub).sort().forEach(sub => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'subfolder-group';
    groupWrap.innerHTML = `<div class="subfolder-header"><i class="fa-solid fa-folder-open"></i> Subapartado: <b>${sub}</b> (${gNoCambBySub[sub].length} archivos)</div>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    renderProgressiveGrid(grid, gNoCambBySub[sub]);
    groupWrap.appendChild(grid);
    s2.appendChild(groupWrap);
  });
  c.appendChild(s2);
}


/* VISOR_FORCE_ALL_BRANCHES
   El visor de documentos debe ofrecer TODAS LAS RAMAS aunque la carga de ramas
   llegue después. No sustituir el selector por una única rama durante la carga. */
(function () {
  function normalizarSelectorRamasVisor() {
  const selects = Array.from(document.querySelectorAll(
    'select[id*="rama" i], select[id*="branch" i], select[name*="rama" i], select[name*="branch" i]'
  ));

  selects.forEach(select => {
    // SELECCIONAR siempre primero.
    let def = Array.from(select.options).find(o =>
      o.value === "" || o.dataset.defaultBranch === "1" ||
      o.textContent.trim().toUpperCase() === "SELECCIONAR"
    );

    if (!def) {
      def = document.createElement("option");
      def.value = "";
      def.textContent = "SELECCIONAR";
      def.dataset.defaultBranch = "1";
      select.insertBefore(def, select.firstChild);
    } else {
      def.dataset.defaultBranch = "1";
      if (select.firstChild !== def) select.insertBefore(def, select.firstChild);
    }

    // TODAS LAS RAMAS SIEMPRE AL FINAL.
    Array.from(select.options).forEach(o => {
      if (
        o.value === "__ALL_BRANCHES__" ||
        o.dataset.allBranches === "1" ||
        /TODAS\s+LAS\s+RAMAS/i.test(o.textContent || "")
      ) {
        o.remove();
      }
    });

    const allOpt = document.createElement("option");
    allOpt.value = "__ALL_BRANCHES__";
    allOpt.textContent = "— TODAS LAS RAMAS —";
    allOpt.dataset.allBranches = "1";
    select.appendChild(allOpt);

    // Si el visor se abrió desde el botón general, TODAS queda seleccionada.
    if (sessionStorage.getItem("visorAdminBranchMode") === "all") {
      select.value = "__ALL_BRANCHES__";
    }
  });
}

  window.normalizarSelectorRamasVisor = normalizarSelectorRamasVisor;
  document.addEventListener("DOMContentLoaded", normalizarSelectorRamasVisor);
  const obs = new MutationObserver(normalizarSelectorRamasVisor);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
