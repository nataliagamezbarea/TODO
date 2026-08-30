/* ORQUESTADOR PRINCIPAL DEL VISOR NATIVO (< 85 lineas) */
const _estadoPDFJS = {}, _loadTokens = {};
let currentDocPages = [];

function loadDocViewer(containerId, isLeft, enc, int, col, netVal) {
  const it = ITEMS[POS], el = document.getElementById(containerId);
  if (it && el) return loadDocViewerPDFJS(containerId, isLeft, el, it, isLeft ? 'old' : 'new', enc, int, col, netVal);
  return Promise.resolve();
}

async function loadDocViewerPDFJS(containerId, isLeft, el, it, mode, enc, int, col, netVal) {
  if (!el) return;
  const previo = _estadoPDFJS[containerId];
  if (previo && previo.doc) { try { previo.doc.destroy(); } catch (_e) {} }

  const token = ++_loadTokens[containerId] || (_loadTokens[containerId] = 1);
  const msgCarga = isLeft ? 'Cargando documento original...' : 'Cargando previsualización limpia...';
  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:350px;color:#94a3b8;font-size:13px;gap:12px"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:28px;color:${isLeft ? '#f97316' : '#38bdf8'}"></i><span>${msgCarga}</span></div>`;
  const headerEl = isLeft ? document.getElementById('headerViewerOld') : document.getElementById('headerViewerNew');
  const tituloBase = isLeft ? '<i class="fa-solid fa-file-lines"></i> 1. ORIGINAL' : '<i class="fa-solid fa-wand-magic-sparkles"></i> 2. CÓMO QUEDARÍA';
  if (headerEl) headerEl.innerHTML = `${tituloBase} <span style="color:#38bdf8;font-size:12px;margin-left:8px;font-weight:700">⚡ Cargando...</span>`;

  const qs = `archivo=${encodeURIComponent(it.archivo)}&mode=${mode}&enc=${enc}&int=${int}&col=${col}&net=${netVal}`;
  const qsOld = `archivo=${encodeURIComponent(it.archivo)}&mode=old&enc=1&int=0&col=0&net=0`;
  const ramaItem = it._rama || grad;
  const urlPDF = `/api/preview/${encodeURIComponent(ramaItem)}?${qs}`;

  const promesas = [_obtenerBufferPDF(urlPDF), _obtenerDocInfoJSON(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qs}`).catch(() => null)];
  if (!isLeft) promesas.push(_obtenerDocInfoJSON(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qsOld}`).catch(() => null));

  const [buffer, info, infoOriginal] = await Promise.all(promesas);
  if (token !== _loadTokens[containerId]) return;
  if (isLeft) currentDocPages = (info && info.pages) || [];

  let uint8Data;
  try {
    if (buffer instanceof ArrayBuffer && buffer.byteLength > 0) uint8Data = new Uint8Array(buffer.slice(0));
    else if (buffer && buffer.buffer && buffer.buffer.byteLength > 0) uint8Data = new Uint8Array(buffer.buffer.slice(0));
    else { const r = await fetch(urlPDF); uint8Data = new Uint8Array(await r.arrayBuffer()); }
  } catch (_e) { const r = await fetch(urlPDF); uint8Data = new Uint8Array(await r.arrayBuffer()); }

  const doc = await pdfjsLib.getDocument({ data: uint8Data, isEvalSupported: false }).promise;
  if (token !== _loadTokens[containerId]) { try { doc.destroy(); } catch (_e) {} return; }
  _estadoPDFJS[containerId] = { doc, qs, isLeft };

  const total = doc.numPages;
  const anchoDisp = Math.max(280, el.clientWidth - 32);
  el.innerHTML = '';
  const wrappers = crearPlaceholdersDocumento(total, anchoDisp, el);
  initSynchronizedScrolling();
  initResizeAutoFit();

  const paginasRenderizadas = new Set();
  async function renderizarPaginaOnDemand(i) {
    if (paginasRenderizadas.has(i) || token !== _loadTokens[containerId]) return;
    paginasRenderizadas.add(i);
    const wrapper = wrappers[i];
    if (!wrapper) return;
    try {
      await _renderPaginaPDFJS(doc, i, wrapper, null, el);
      wrapper.style.minHeight = ''; wrapper.style.background = ''; wrapper.style.marginBottom = '12px';
      const meta = (info && info.pages && info.pages[i]) ? info.pages[i] : { page_num: i };
      anadirOverlaysPagina(wrapper, meta, it, isLeft, { enc: enc === '1', int: int === '1', col: col === '1', metaOriginalPagina: (!isLeft && infoOriginal && infoOriginal.pages) ? infoOriginal.pages[i] : null });
    } catch (_e) {}
  }

  await renderizarPaginaOnDemand(0);
  if (total > 1) renderizarPaginaOnDemand(1);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pIdx = parseInt(entry.target.dataset.paginaIdx, 10);
        if (!isNaN(pIdx)) renderizarPaginaOnDemand(pIdx);
      }
    });
  }, { root: el, rootMargin: '500px 0px' });

  for (let i = 1; i < total; i++) observer.observe(wrappers[i]);
  if (headerEl && token === _loadTokens[containerId]) headerEl.innerHTML = tituloBase;
  consumirRestauracionVisor(containerId);
  if (typeof actualizarNavegacionCambios === 'function') actualizarNavegacionCambios();
  dispararPrecargaProximos();
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
