/* CACHE EN MEMORIA RAM Y PRECARGA INTELIGENTE (< 80 lineas) */

const _pdfBufferCache = new Map();
const _docInfoCache = new Map();

async function _obtenerBufferPDF(url) {
  if (_pdfBufferCache.has(url)) {
    const cached = _pdfBufferCache.get(url);
    return cached.slice(0);
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} cargando preview`);
  const buf = await resp.arrayBuffer();
  if (_pdfBufferCache.size > 16) {
    const firstKey = _pdfBufferCache.keys().next().value;
    _pdfBufferCache.delete(firstKey);
  }
  _pdfBufferCache.set(url, buf.slice(0));
  return buf;
}


async function _obtenerDocInfoJSON(url) {
  if (_docInfoCache.has(url)) return _docInfoCache.get(url);
  const resp = await fetch(url);
  const json = await resp.json();
  if (_docInfoCache.size > 20) {
    const firstKey = _docInfoCache.keys().next().value;
    _docInfoCache.delete(firstKey);
  }
  _docInfoCache.set(url, json);
  return json;
}

let _prefetchTimeout = null;
function dispararPrecargaProximos() {
  if (_prefetchTimeout) clearTimeout(_prefetchTimeout);
  _prefetchTimeout = setTimeout(() => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => _ejecutarPrecargaProximos(), { timeout: 2500 });
    } else {
      setTimeout(_ejecutarPrecargaProximos, 300);
    }
  }, 500);
}

function _ejecutarPrecargaProximos() {
  if (!Array.isArray(ITEMS) || POS < 0) return;
  const lista = (typeof obtenerItemsBusqueda === 'function') ? obtenerItemsBusqueda() : ITEMS;
  const archivoActual = ITEMS[POS]?.archivo;
  let posLista = lista.findIndex(x => x.archivo === archivoActual);
  if (posLista < 0) posLista = 0;
  const candidatos = [posLista + 1, posLista + 2, posLista + 3, posLista - 1].filter(idx => idx >= 0 && idx < lista.length);
  candidatos.forEach(idx => {
    const it = lista[idx];
    if (!it) return;
    const ramaItem = it._rama || grad;
    if (!ramaItem || ramaItem === '__TODAS__') return;
    const qsOld = `archivo=${encodeURIComponent(it.archivo)}&mode=old&enc=1&int=0&col=0&net=0`;
    const qsNew = `archivo=${encodeURIComponent(it.archivo)}&mode=new&enc=1&int=1&col=1&net=0`;
    _obtenerBufferPDF(`/api/preview/${encodeURIComponent(ramaItem)}?${qsOld}`).then(() => {
      _obtenerDocInfoJSON(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qsOld}`).catch(() => {});
      // No precargar la versión editada si el archivo está marcado como Original.
      // Así nunca se solicita mode=new para un archivo que no debe tener preview editada.
      if (it.decision !== 'original') {
        _obtenerBufferPDF(`/api/preview/${encodeURIComponent(ramaItem)}?${qsNew}`).catch(() => {});
        _obtenerDocInfoJSON(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qsNew}`).catch(() => {});
      }
    }).catch(() => {});
  });
}

function precargarPrimerosOriginales() {
  if (!Array.isArray(ITEMS) || ITEMS.length === 0) return;
  // Si hay una búsqueda activa, SOLO se precargan los resultados encontrados.
  const lista = (typeof obtenerItemsBusqueda === 'function') ? obtenerItemsBusqueda() : ITEMS;
  const primeros = lista.slice(0, 5);
  primeros.forEach(it => {
    const ramaItem = it._rama || grad;
    if (!ramaItem || ramaItem === '__TODAS__') return;
    const qsOld = `archivo=${encodeURIComponent(it.archivo)}&mode=old&enc=1&int=0&col=0&net=0`;
    _obtenerBufferPDF(`/api/preview/${encodeURIComponent(ramaItem)}?${qsOld}`).catch(() => {});
    _obtenerDocInfoJSON(`/api/doc_info/${encodeURIComponent(ramaItem)}?${qsOld}`).catch(() => {});
  });
}
window.precargarPrimerosOriginales = precargarPrimerosOriginales;
