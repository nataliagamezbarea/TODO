/* POPUP Y ACCIONES DE ENUNCIADOS (< 85 lineas) */
let currentEditingHotspot = null;

function openEnunciadoPopup(sh, e, elBox) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (typeof closeNombrePopup === 'function') closeNombrePopup();
  if (typeof closeColegioPopup === 'function') closeColegioPopup();
  const flImg = document.getElementById('floatingImgMenu');
  if (flImg) flImg.style.display = 'none';
  if (typeof marcarHotspotSeleccionado === 'function') marcarHotspotSeleccionado(elBox || (e && e.currentTarget) || (e && e.target));
  if (sh) currentEditingHotspot = sh;
  const flMenu = document.getElementById('floatingPdfMenu');
  if (!flMenu) return;
  const btnEl = document.getElementById('btnEliminarEnunciado'), bdg = document.getElementById('floatStatusBadge'), btnRest = document.getElementById('btnRestaurarEnunciado');
  const desact = (sh && sh.include === false);
  if (btnEl) { btnEl.innerHTML = desact ? '<i class="fa-solid fa-circle-check"></i> Activar Enunciado' : '<i class="fa-solid fa-trash-can"></i> Eliminar Enunciado'; btnEl.style.background = desact ? '#10b981' : '#ef4444'; }
  if (bdg) { bdg.textContent = desact ? 'Desactivado' : (sh && sh.new ? 'Reescrito' : 'Detectado'); bdg.className = desact ? 'badge o' : 'badge v'; }
  if (btnRest) { btnRest.style.display = (sh && !sh.custom && (sh.id !== undefined || sh.old || sh.new !== undefined)) ? 'inline-flex' : 'none'; }
  flMenu.style.display = 'flex';
}

function closeEnunciadoPopup() {
  document.querySelectorAll('.red-hotspot, .orange-hotspot, .green-hotspot, .gray-hotspot').forEach(el => el.classList.remove('selected'));
  const flMenu = document.getElementById('floatingPdfMenu');
  if (flMenu) flMenu.style.display = 'none';
}

function editarEnunciadoDesdePopup() {
  closeEnunciadoPopup();
  openEditarEnunciadoModal(currentEditingHotspot);
}

async function eliminarEnunciadoDesdePopup() {
  closeEnunciadoPopup();
  const it = ITEMS[POS], sh = currentEditingHotspot, desact = (sh && sh.include === false);
  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);

  showBlocker(desact ? 'Activando enunciado...' : 'Eliminando enunciado...');
  try {
    const url = desact ? '/api/save_enunciado' : '/api/delete_enunciado';
    const payload = desact ? {
      grado: (it?._rama || grad), archivo: it.archivo, start: sh.start || '', end: sh.end || '', new_text: sh.new || '', page: sh.page, pct_top: sh.top
    } : {
      grado: (it?._rama || grad), archivo: it.archivo, start: sh ? (sh.start || '') : '', end: sh ? (sh.end || '') : '',
      custom: !!(sh && sh.custom), hotspot_id: sh ? sh.id : undefined, page: sh ? sh.page : undefined
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (typeof load === 'function') await load();
    hideBlocker();
    refreshRightIframe();
  } catch (err) {
    hideBlocker();
    console.error('Error al cambiar estado de enunciado:', err);
  }
}

async function handlePopupAction(val) { closeEnunciadoPopup(); await setInc(val); }

async function restoreInitialSuggestion() {
  closeEnunciadoPopup();
  const it = ITEMS[POS];
  if (!it) return;
  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);
  showBlocker('Eliminando historial inicial...');
  try {
    await fetch('/api/reset_item', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo }) });
    Object.assign(it, { inc: false, int: false, col: false, ren: false, internet: false, enunciados: [], recuadros: {} });
    if (typeof load === 'function') await load();
    hideBlocker();
    refreshRightIframe();
  } catch (err) {
    hideBlocker();
    console.error('Error al resetear:', err);
  }
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
