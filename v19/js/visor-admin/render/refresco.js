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
