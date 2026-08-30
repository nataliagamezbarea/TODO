/* POPUP DE IMAGENES (< 60 lineas) */

let selectedImageIh = null;

function openImagePopup(ih, e) {
  selectedImageIh = ih;
  if (typeof closeNombrePopup === 'function') closeNombrePopup();
  const flPdf = document.getElementById('floatingPdfMenu');
  if (flPdf) flPdf.style.display = 'none';
  if (typeof closeColegioPopup === 'function') closeColegioPopup();
  const flImgMenu = document.getElementById('floatingImgMenu');
  if (!flImgMenu) return;

  const lblExp = document.getElementById('lblExcepcionInternet');
  const cbExp = document.getElementById('cbNoBorrarInternet');
  const intActivo = isAutoDelInternetActive();
  if (lblExp) {
    lblExp.style.display = intActivo ? 'inline-flex' : 'none';
    if (intActivo && cbExp) {
      const it = (typeof ITEMS !== 'undefined' && ITEMS[POS]) ? ITEMS[POS] : {};
      const acc = (it.imagenes || {})[ih.id] || {};
      cbExp.checked = (acc.accion === 'conservar' || acc.no_borrar === true || ih.accion === 'conservar');
    }
  }

  flImgMenu.style.display = 'flex';
}

function toggleExcepcionInternet(checked) {
  if (!selectedImageIh) return;
  if (checked) {
    handleImageAction('conservar', { no_borrar: true }, selectedImageIh);
  } else {
    handleImageAction('restaurar', {}, selectedImageIh);
  }
}

function closeImgPopup() {
  const flImgMenu = document.getElementById('floatingImgMenu');
  if (flImgMenu) flImgMenu.style.display = 'none';
  selectedImageIh = null;
}

function closeImagePopup() {
  closeImgPopup();
}

function isAutoDelInternetActive() {
  if (typeof ITEMS !== 'undefined' && ITEMS[POS]) {
    return !!ITEMS[POS].inc_internet;
  }
  const cb = document.getElementById('cbBorrarImgInternet');
  return cb ? cb.checked : false;
}

function syncInternetCheckboxes() {
  const cb1 = document.getElementById('cbBorrarImgInternet');
  const cb2 = document.getElementById('cbBorrarImgInternetPopup');
  if (!cb1 && !cb2) return;
  const active = isAutoDelInternetActive();
  if (cb1) cb1.checked = active;
  if (cb2) cb2.checked = active;
}

function toggleAutoDelInternet(val) {
  if (typeof setInternet === 'function') {
    setInternet(val);
  } else {
    syncInternetCheckboxes();
    if (typeof refreshRightIframe === 'function') refreshRightIframe();
  }
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
