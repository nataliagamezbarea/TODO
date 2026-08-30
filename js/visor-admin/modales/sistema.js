/* POPUPS FLOTANTES DE NOMBRES Y COLEGIOS (< 65 lineas) */

let currentNombreHotspot = null, currentColegioHotspot = null;

function _prepararPopup(e, elBox, nh, flId, isName) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (typeof closeEnunciadoPopup === 'function') closeEnunciadoPopup();
  if (isName && typeof closeColegioPopup === 'function') closeColegioPopup();
  if (!isName && typeof closeNombrePopup === 'function') closeNombrePopup();
  const flImg = document.getElementById('floatingImgMenu');
  if (flImg) flImg.style.display = 'none';
  if (typeof marcarHotspotSeleccionado === 'function') marcarHotspotSeleccionado(elBox || (e && e.currentTarget) || (e && e.target));
  const fl = document.getElementById(flId);
  if (!fl) return null;
  const it = ITEMS[POS], activo = isName ? (it && it.inc_interior !== false) : (it && it.inc_colegio !== false);
  const bEl = document.getElementById(isName ? 'btnEliminarNombre' : 'btnEliminarCol');
  const bCon = document.getElementById(isName ? 'btnConservarNombre' : 'btnConservarCol');
  const bDel = document.getElementById(isName ? 'btnBorrarRecuadroNombre' : 'btnBorrarRecuadroCol');
  if (bEl) bEl.style.opacity = activo ? '1' : '0.5';
  if (bCon) bCon.style.opacity = activo ? '0.5' : '1';
  if (bDel) bDel.style.display = (nh && nh.manual) ? 'inline-flex' : 'none';
  fl.style.display = 'flex';
  return fl;
}

function openNombrePopup(nh, e, elBox) { currentNombreHotspot = nh; _prepararPopup(e, elBox, nh, 'floatingNameMenu', true); }
function closeNombrePopup() {
  document.querySelectorAll('.blue-name-hotspot, .gray-name-hotspot').forEach(el => el.classList.remove('selected'));
  const fl = document.getElementById('floatingNameMenu');
  if (fl) fl.style.display = 'none';
  currentNombreHotspot = null;
}

async function _ejecutarAccionRecuadro(tipo, hs, val, fnFallback) {
  if (val === 'eliminar_recuadro' && hs && hs.manual) {
    showBlocker('Eliminando recuadro...');
    await fetch('/api/recuadro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (ITEMS[POS]?._rama || grad), archivo: ITEMS[POS].archivo, tipo: tipo, page_num: hs.page_num, eliminar: true })
    });
    hideBlocker();
    if (typeof openPos === 'function' && typeof POS !== 'undefined') openPos(POS);
    return;
  }
  await fnFallback(val);
}

async function handleNombreAction(val) { const nh = currentNombreHotspot; closeNombrePopup(); await _ejecutarAccionRecuadro('nombre', nh, val, setInt); }

function openColegioPopup(sh, e, elBox) { currentColegioHotspot = sh; _prepararPopup(e, elBox, sh, 'floatingColMenu', false); }
function closeColegioPopup() {
  document.querySelectorAll('.school-hotspot, .gray-school-hotspot').forEach(el => el.classList.remove('selected'));
  const fl = document.getElementById('floatingColMenu');
  if (fl) fl.style.display = 'none';
  currentColegioHotspot = null;
}

async function handleColegioAction(val) { const sh = currentColegioHotspot; closeColegioPopup(); await _ejecutarAccionRecuadro('colegio', sh, val, setCol); }


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
