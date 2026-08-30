/* GESTION DE CAMBIOS Y NAVEGACION DENTRO DEL PDF (< 90 lineas) */

let NAV_CAMBIO_POS = -1;

function obtenerCambiosDelPDFActual() {
  const it = ITEMS[POS];
  const paginas = (typeof currentDocPages !== 'undefined' && Array.isArray(currentDocPages)) ? currentDocPages : [];
  if (!it || !paginas.length) return [];

  const cambios = [];
  const pushCambio = (pageIndex, tipo, idx, hotspot) => {
    if (!hotspot) return;
    cambios.push({ page: pageIndex, tipo, idx, hotspot });
  };

  paginas.forEach((p, pageIndex) => {
    const statements = Array.isArray(p.statement_hotspots) ? p.statement_hotspots : [];
    statements.forEach((sh, idx) => {
      const nuevo = String(sh?.new || '').trim();
      const eliminado = sh && (sh.include === false || (!nuevo && !sh.custom));
      if (nuevo || eliminado) pushCambio(pageIndex, nuevo ? 'sustitucion' : 'eliminacion', idx, sh);
    });

    if (it.inc_interior && Array.isArray(p.name_hotspots)) {
      p.name_hotspots.forEach((nh, idx) => pushCambio(pageIndex, 'eliminacion', idx, nh));
    }

    if (it.inc_colegio && Array.isArray(p.school_hotspots)) {
      p.school_hotspots.forEach((sh, idx) => pushCambio(pageIndex, 'eliminacion', idx, sh));
    }
  });

  cambios.sort((a, b) => {
    const ay = Number(a.hotspot?.top) || 0;
    const by = Number(b.hotspot?.top) || 0;
    return a.page - b.page || ay - by || a.tipo.localeCompare(b.tipo);
  });
  return cambios;
}

function limpiarMarcaCambioActual() {
  document.querySelectorAll('.change-nav-active').forEach(el => el.classList.remove('change-nav-active'));
}

function actualizarNavegacionCambios() {
  const cambios = obtenerCambiosDelPDFActual();
  const txt = document.getElementById('ovCambiosText');
  const prev = document.getElementById('btnCambioPrev');
  const next = document.getElementById('btnCambioNext');
  const btn = document.getElementById('btnCambios');

  if (!cambios.length) {
    NAV_CAMBIO_POS = -1;
    if (txt) txt.textContent = '0 / 0';
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    if (btn) btn.disabled = true;
    limpiarMarcaCambioActual();
    return;
  }

  if (NAV_CAMBIO_POS < 0 || NAV_CAMBIO_POS >= cambios.length) NAV_CAMBIO_POS = 0;
  if (txt) txt.textContent = `${NAV_CAMBIO_POS + 1} / ${cambios.length}`;
  if (prev) prev.disabled = false;
  if (next) next.disabled = false;
  if (btn) btn.disabled = false;
}

function _scrollPaneAPagina(paneId, pageIndex, pctTop) {
  const pane = document.getElementById(paneId);
  if (!pane) return null;
  const pages = Array.from(pane.querySelectorAll('.doc-page'));
  if (!pages.length) return null;
  let page = pages.find(pg => Number(pg.dataset.paginaIdx) === pageIndex);
  if (!page) page = pages[Math.min(pageIndex, pages.length - 1)];
  const base = pane.getBoundingClientRect().top - pane.scrollTop;
  const top = page.getBoundingClientRect().top - base;
  const extra = (Number(pctTop) || 0) > 0 ? (page.offsetHeight * (Number(pctTop) / 100) - 80) : 0;
  pane.scrollTop = Math.max(0, top + extra - 24);
  return page;
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
