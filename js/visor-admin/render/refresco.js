/* REFRESCO PARCIAL Y COMPLETO (< 80 lineas) */

async function refrescarPaginaPDFJS(containerId, pno) {
  const st = _estadoPDFJS[containerId];
  if (!st || !window.pdfjsLib) return false;
  const el = document.getElementById(containerId);
  if (!el) return false;

  const wrapper = el.querySelector(`.doc-page[data-pagina-idx="${pno}"]`);
  if (!wrapper) return false;

  try {
    const it = ITEMS[POS], isLeft = (containerId === 'viewerOld');
    const ramaItem = it?._rama || grad;
    if (!ramaItem || ramaItem === '__TODAS__') return false;
    const urlPDF = `/api/preview/${encodeURIComponent(ramaItem)}?${st.qs}&t=${Date.now()}`;
    const buffer = await _obtenerBufferPDF(urlPDF);
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
    await _renderPaginaPDFJS(doc, pno, wrapper, null, el);

    try {
      const qsDoc = `${st.qs || ''}&archivo=${encodeURIComponent(it.archivo)}&mode=${isLeft ? 'old' : 'new'}&t=${Date.now()}`;
      const resI = await fetch(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qsDoc}`);
      const info = await resI.json();
      const meta = (info && info.pages && info.pages[pno]) ? info.pages[pno] : { page_num: pno };
      let metaOrig = null;
      if (!isLeft) {
        const resO = await fetch(`/api/doc_info/${encodeURIComponent(ramaItem)}?archivo=${encodeURIComponent(it.archivo)}&mode=old&t=${Date.now()}`);
        const infoO = await resO.json();
        metaOrig = (infoO && infoO.pages && infoO.pages[pno]) ? infoO.pages[pno] : null;
      }
      if (typeof anadirOverlaysPagina === 'function') {
        anadirOverlaysPagina(wrapper, meta, it, isLeft, { metaOriginalPagina: metaOrig });
      }
    } catch (_e) {}
    return true;
  } catch (err) {
    console.error('Error refrescando pagina PDFJS:', err);
    return false;
  }
}

function refrescarPaginaPreview(pno) {
  refrescarPaginaPDFJS('viewerOld', pno);
  refrescarPaginaPDFJS('viewerNew', pno);
}

function refreshRightIframe() {
  if (typeof _pdfBufferCache !== 'undefined') _pdfBufferCache.clear();
  if (typeof _docInfoCache !== 'undefined') _docInfoCache.clear();
  if (typeof loadDocViewer === 'function') {
    const cbInc = document.getElementById('cbInc');
    const cbInt = document.getElementById('cbInt');
    const cbCol = document.getElementById('cbCol');
    const enc = cbInc?.checked ? '1' : '0';
    const int = cbInt?.checked ? '1' : '0';
    const col = cbCol?.checked ? '1' : '0';
    const net = (typeof isAutoDelInternetActive === 'function' && isAutoDelInternetActive()) ? '1' : '0';
    loadDocViewer('viewerOld', true, enc, int, col, '0');
    loadDocViewer('viewerNew', false, enc, int, col, net);
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
