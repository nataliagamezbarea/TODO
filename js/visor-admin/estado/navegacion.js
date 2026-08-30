/* ENFOQUE Y SALTO ENTRE CAMBIOS (< 85 lineas) */

function enfocarCambioActual() {
  const cambios = obtenerCambiosDelPDFActual();
  if (!cambios.length) { actualizarNavegacionCambios(); return; }
  if (NAV_CAMBIO_POS < 0 || NAV_CAMBIO_POS >= cambios.length) NAV_CAMBIO_POS = 0;
  const cambio = cambios[NAV_CAMBIO_POS];

  limpiarMarcaCambioActual();
  if (typeof _syncScrollSuspend !== 'undefined') _syncScrollSuspend++;

  const hs = cambio.hotspot || {};
  const leftPage = _scrollPaneAPagina('viewerOld', cambio.page, hs.top);
  const rightPage = _scrollPaneAPagina('viewerNew', cambio.page, hs.top);

  const clases = cambio.tipo === 'sustitucion'

    ? ['right-green-change-hotspot', 'red-hotspot', 'green-hotspot', 'orange-hotspot']
    : ['right-gray-change-hotspot', 'gray-hotspot', 'blue-name-hotspot', 'gray-name-hotspot', 'school-hotspot', 'gray-school-hotspot'];

  [rightPage, leftPage].forEach(page => {
    if (!page) return;
    const candidatos = Array.from(page.children).filter(el => clases.some(c => el.classList?.contains(c)));
    if (!candidatos.length) return;
    const target = candidatos.find(el => {
      const elTop = parseFloat(el.style.top) || 0;
      const elLeft = parseFloat(el.style.left) || 0;
      return Math.abs(elTop - (Number(hs.top) || 0)) < 15 && Math.abs(elLeft - (Number(hs.left) || 0)) < 15;
    }) || candidatos[0];
    target.classList.add('change-nav-active');
  });

  setTimeout(() => {
    if (typeof _syncScrollSuspend !== 'undefined' && _syncScrollSuspend > 0) _syncScrollSuspend--;
  }, 400);

  actualizarNavegacionCambios();
}

function irAlPrimerCambio() {
  NAV_CAMBIO_POS = 0;
  enfocarCambioActual();
}

function navCambio(dir) {
  const cambios = obtenerCambiosDelPDFActual();
  if (!cambios.length) return;
  if (NAV_CAMBIO_POS < 0) NAV_CAMBIO_POS = dir > 0 ? 0 : cambios.length - 1;
  else {
    NAV_CAMBIO_POS += dir;
    if (NAV_CAMBIO_POS >= cambios.length) NAV_CAMBIO_POS = 0;
    if (NAV_CAMBIO_POS < 0) NAV_CAMBIO_POS = cambios.length - 1;
  }
  enfocarCambioActual();
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
