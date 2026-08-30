/* ESTADO GLOBAL Y CARGA (< 65 lineas) */

var DATA = window.DATA || {};
var CONFIG = window.CONFIG || {};
var grad = window.grad || '';
var POS = window.POS || 0;
var ITEMS = window.ITEMS || [];
var TAB_KEY = 'e';
var NAV_SOLO_SELECCIONADOS = true;
var BUSQUEDA_ARCHIVO = '';
var ITEMS_BUSQUEDA = [];
window.BUSQUEDA_ARCHIVO = BUSQUEDA_ARCHIVO; window.ITEMS_BUSQUEDA = ITEMS_BUSQUEDA;
window.DATA = DATA; window.CONFIG = CONFIG; window.grad = grad; window.POS = POS; window.ITEMS = ITEMS;

function mostrarCargaGlobal() {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px 20px;color:#94a3b8">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size:42px;color:#818cf8;margin-bottom:20px"></i>
      <span style="font-size:15px;color:#cbd5e1">Cargando documentos de la rama…</span>
    </div>`;
  const stats = document.getElementById('stats');
  if (stats) {
    stats.style.display = 'grid';
    stats.style.visibility = 'visible';
    stats.style.opacity = '1';
    stats.innerHTML = `
      <div class="stat stat-loading"><b>…</b><span>archivos totales</span></div>
      <div class="stat stat-loading"><b>…</b><span>enunciados</span></div>
      <div class="stat stat-loading"><b>…</b><span>renombres</span></div>
      <div class="stat stat-loading"><b>…</b><span>limpiezas</span></div>
      <div class="stat stat-loading"><b>…</b><span>apuntes</span></div>
      <div class="stat stat-loading"><b>…</b><span>aplicados</span></div>
      <div class="stat stat-loading"><b>…</b><span>originales</span></div>`;
  }
}

function mostrarSeleccionarRama() {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `
      <div class="visor-home-ramas">
        <i class="fa-brands fa-github"></i>
        <h2>Selecciona una rama</h2>
        <p>Elige la rama que quieres revisar.</p>
        <select id="visor-home-selector-rama"><option value="">-- Seleccionar rama --</option></select>
      </div>`;
    const sel = document.getElementById('visor-home-selector-rama');
    if (sel && window.RamaActual) {
      window.RamaActual.poblarSelector(sel).then(() => {
        sel.addEventListener('change', () => {
          if (!sel.value) return;
          cambiarRamaGithub(sel.value);
        }, { once:false });
      }).catch(() => {});
    }
  }
  const stats = document.getElementById('stats');
  if (stats) stats.innerHTML = '';
}

async function load() {
  const params = new URLSearchParams(window.location.search);
  let contexto = {};
  try { contexto = JSON.parse(localStorage.getItem('visor_contexto') || '{}'); } catch (_) {}
  const urlRama = params.get('rama');
  const urlAsig = params.get('asignatura');
  const urlTri = params.get('trimestre');
  const urlArchivo = params.get('archivo');
  const urlReturn = params.get('return');
  const urlPos = params.get('pos');
  const urlTodas = params.get('todas') === '1';
  if (urlRama || urlAsig || urlTri || urlArchivo || urlReturn || urlPos !== null || urlTodas) {
    // Una navegación explícita tiene prioridad absoluta sobre cualquier
    // documento/rama que hubiera quedado guardado de una visita anterior.
    if (urlRama || urlAsig || urlTri || urlArchivo || urlTodas) {
      contexto = { ...contexto,
        ...(urlRama ? {rama:urlRama, todas:false} : {}),
        ...(urlAsig ? {asignatura:urlAsig} : {}),
        ...(urlTri ? {trimestre:urlTri} : {}),
        ...(urlArchivo ? {archivo:urlArchivo, directo:true} : {}),
        ...(urlTodas ? {rama:'', todas:true, archivo:'', directo:false} : {})
      };
      // Si no estamos entrando con un archivo concreto, no arrastramos la
      // última apertura del visor.
      if (!urlArchivo) {
        localStorage.removeItem('last_open');
        localStorage.removeItem('last_archivo');
        localStorage.removeItem('visor_pos');
      }
    }
    contexto = { ...contexto, ...(urlReturn ? {returnPath:urlReturn} : {}) };
    // Los parámetros solo sirven para la entrada inicial desde otra página.
    // En cuanto se consumen, se eliminan de la barra del navegador.
    try {
      if (urlPos !== null) localStorage.setItem('visor_pos', urlPos);
      if (urlRama) localStorage.setItem('visor_rama', urlRama);
      localStorage.setItem('visor_contexto', JSON.stringify(contexto));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (_) {}
  }
  const modoTodas = contexto.todas === true || contexto.rama === '__TODAS__';
  const savedGrado = modoTodas ? '' : (contexto.rama || localStorage.getItem('last_grado') || localStorage.getItem('rama_actual'));
  const filtroAsignatura = contexto.asignatura || '';
  const filtroTrimestre = contexto.trimestre || '';
  window.VISOR_FILTRO = { asignatura: filtroAsignatura, trimestre: filtroTrimestre };
  const archivoContexto = contexto.directo ? String(contexto.archivo || '').trim() : '';
  // Un filtro de asignatura/trimestre es navegación al listado, NO una orden de
  // reabrir el último documento. Evitamos que el estado persistido del visor
  // (last_open/visor_pos) se arrastre desde una visita anterior.
  const hayFiltroContextual = !!(filtroAsignatura || filtroTrimestre);
  if (hayFiltroContextual && !urlArchivo && !archivoContexto) {
    try {
      localStorage.setItem('last_open', '0');
      localStorage.removeItem('last_archivo');
      localStorage.removeItem('visor_pos');
    } catch (_) {}
  }
  const hayRamaObjetivo = !!savedGrado || modoTodas;
  const esHomeVisor = !hayRamaObjetivo && !params.get('archivo') && !params.get('pos');
  if (esHomeVisor) { contexto.todas = true; try { localStorage.setItem('visor_contexto', JSON.stringify(contexto)); } catch (_) {} }

  // Sin rama a cargar: se muestra "Selecciona una rama" al instante, sin esperar
  // el fetch de datos (evita que tarde).
  if (!hayRamaObjetivo) {
    mostrarSeleccionarRama();
    return;
  }

  mostrarCargaGlobal();
  // Si entramos desde el icono de un archivo y ya conocemos la rama,
  // cargar SOLO esa rama. Antes se reconstruían todas las ramas de GitHub,
  // provocando una espera visible antes de abrir el documento.
  let d = null;
  const ramaParaCargaDirecta = (!modoTodas && savedGrado) ? savedGrado : null;
  if (ramaParaCargaDirecta) {
    try {
      const rr = await fetch(`/api/datos_rama?rama=${encodeURIComponent(ramaParaCargaDirecta)}`);
      if (rr.ok) d = await rr.json();
    } catch (_) {}
  }
  if (!d) {
    const r = await fetch('/api/datos');
    d = await r.json();
  }
  DATA = d || {};
  CONFIG = d || {};

  const degrees = Object.keys(CONFIG);
  if (degrees.length === 0) {
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:90px 20px;color:#94a3b8">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:44px;color:#f59e0b;margin-bottom:16px;display:block"></i>
          <h2 style="font-size:18px;color:#f1f5f9;margin-bottom:6px">No se pudieron cargar los datos</h2>
          <p style="font-size:14px;color:#94a3b8">Comprueba tu sesión o la configuración y vuelve a intentarlo.</p>
        </div>`;
    }
    return;
  }

  if (modoTodas) {
    grad = '__TODAS__';
  } else if (savedGrado && degrees.includes(savedGrado)) {
    grad = savedGrado;
  } else if (urlRama && degrees.includes(urlRama)) {
    grad = urlRama;
  } else {
    grad = '';
  }

  const sel = document.getElementById('selectRamaGithub');
  if (sel) sel.value = modoTodas ? '' : grad;

  if (modoTodas || (grad && CONFIG[grad])) {
    if (typeof renderTabs === 'function') renderTabs();
    buildAllItems();
    if (typeof render === 'function') render();
    if (typeof precargarPrimerosOriginales === 'function') setTimeout(precargarPrimerosOriginales, 400);

    // Apertura directa desde la aplicación principal: ?archivo=...
    // También permite conservar contexto de asignatura/trimestre/tarea.
    const archivoObjetivo = urlArchivo || archivoContexto;
    let abrioArchivoObjetivo = false;
    if (archivoObjetivo) {
      const normalizarRutaArchivo = (valor) => {
        let v = String(valor || '').trim().replace(/\\/g, '/');
        try { v = decodeURIComponent(v); } catch (_) {}
        // Acepta tanto rutas del repo como enlaces github.com/.../blob/...
        // o raw.githubusercontent.com/.../...
        const m = v.match(/(?:github\.com|raw\.githubusercontent\.com)\/[^/]+\/[^/]+(?:\/blob)?\/(?:[^/]+\/)?(.+)$/i);
        if (m) v = m[1];
        return v.replace(/^\/+/, '').toLowerCase();
      };
      const rutaObjetivo = normalizarRutaArchivo(archivoObjetivo);
      const nombreObjetivo = rutaObjetivo.split('/').pop();
      let idxObjetivo = ITEMS.findIndex(it => normalizarRutaArchivo(it.archivo) === rutaObjetivo);
      if (idxObjetivo < 0) {
        idxObjetivo = ITEMS.findIndex(it => normalizarRutaArchivo(it.archivo).split('/').pop() === nombreObjetivo);
      }
      const inputBusqueda = document.getElementById('inputBuscarArchivo');
      if (inputBusqueda) {
        inputBusqueda.value = nombreObjetivo;
        try { filtrarArchivos(nombreObjetivo); } catch (_) {}
      }
      if (idxObjetivo < 0 && archivoObjetivo && hayFiltroContextual) {
        // El archivo mandado por el botón es más específico que el filtro de
        // trimestre/asignatura. Si el backend no trae exactamente esos metadatos,
        // reconstruimos la colección sin ocultar el archivo solicitado.
        const filtroAnterior = window.VISOR_FILTRO;
        window.VISOR_FILTRO = {};
        buildAllItems();
        window.VISOR_FILTRO = filtroAnterior;
        idxObjetivo = ITEMS.findIndex(it => normalizarRutaArchivo(it.archivo) === rutaObjetivo);
        if (idxObjetivo < 0) idxObjetivo = ITEMS.findIndex(it => normalizarRutaArchivo(it.archivo).split('/').pop() === nombreObjetivo);
      }
      if (idxObjetivo >= 0) {
        abrioArchivoObjetivo = true;
        POS = idxObjetivo;
        localStorage.setItem('last_grado', grad);
        localStorage.setItem('last_pos', String(POS));
        localStorage.setItem('last_open', '1');
        localStorage.setItem('last_archivo', ITEMS[POS].archivo);
        setTimeout(() => { if (typeof openOv === 'function') openOv(); }, 0);
      }
    }

    const openParam = params.get('pos');
    const storedPos = hayFiltroContextual ? null : localStorage.getItem('visor_pos');
    if (!abrioArchivoObjetivo && (openParam !== null || storedPos !== null)) {
      const p = parseInt(openParam !== null ? openParam : storedPos, 10);
      if (p >= 0 && p < ITEMS.length) { POS = p; openOv(); }
    } else if (!modoTodas && !hayFiltroContextual && !abrioArchivoObjetivo && localStorage.getItem('last_open') === '1') {
      const savedArch = localStorage.getItem('last_archivo');
      let idx = -1;
      if (savedArch) idx = ITEMS.findIndex(item => item.archivo === savedArch);
      if (idx === -1) {
        const savedPos = parseInt(localStorage.getItem('last_pos') || '0', 10);
        if (savedPos >= 0 && savedPos < ITEMS.length) idx = savedPos;
      }
      if (idx >= 0 && idx < ITEMS.length) { POS = idx; openOv(); }
    } else {
      POS = 0;
      if (modoTodas) {
        localStorage.removeItem('last_open');
        localStorage.removeItem('last_archivo');
      }
    }
  } else {
    mostrarSeleccionarRama();
  }
}


function buildAllItems() {
  ITEMS = [];
  const filtro = window.VISOR_FILTRO || {};
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ºª]/g, '').replace(/\btrimestres?\b/g, '').trim();
  const asig = norm(filtro.asignatura);
  const tri = norm(filtro.trimestre);
  const coincide = (e) => {
    if (!asig && !tri) return true;
    const ea = norm(e.asignatura || '');
    const et = norm(e.trimestre || '');
    if (asig && ea && ea !== asig && !ea.includes(asig) && !asig.includes(ea)) return false;
    if (tri && et && et !== tri) return false;
    return true;
  };
  const ramas = grad === '__TODAS__' ? Object.keys(DATA) : [grad];
  ramas.forEach(rama => {
    const d = DATA[rama];
    if (!d) return;
    (d.entries || []).forEach((e, idx) => {
      if (coincide(e)) ITEMS.push({ ...e, type: 'e', idx, _rama: rama });
    });
    (d.no_cambian || []).forEach((n, idx) => {
      if (coincide(n)) ITEMS.push({ ...n, type: 'n', idx, _rama: rama });
    });
  });
  window.ITEMS = ITEMS;
}


function _normalizarBusquedaArchivo(v) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function obtenerItemsBusqueda() {
  if (!BUSQUEDA_ARCHIVO) return Array.isArray(ITEMS) ? ITEMS : [];
  return (Array.isArray(ITEMS) ? ITEMS : []).filter(it => {
    const nombre = _normalizarBusquedaArchivo(it?.archivo || '');
    return nombre.includes(BUSQUEDA_ARCHIVO);
  });
}

function filtrarArchivos(valor) {
  BUSQUEDA_ARCHIVO = _normalizarBusquedaArchivo(valor);
  window.BUSQUEDA_ARCHIVO = BUSQUEDA_ARCHIVO;
  ITEMS_BUSQUEDA = obtenerItemsBusqueda();
  window.ITEMS_BUSQUEDA = ITEMS_BUSQUEDA;
  const count = document.getElementById('fileSearchCount');
  const clear = document.getElementById('btnLimpiarBusqueda');
  if (count) {
    const total = Array.isArray(ITEMS) ? ITEMS.length : 0;
    count.textContent = BUSQUEDA_ARCHIVO
      ? `${ITEMS_BUSQUEDA.length} encontrado${ITEMS_BUSQUEDA.length === 1 ? '' : 's'}`
      : `${total} archivo${total === 1 ? '' : 's'}`;
  }
  if (clear) clear.style.display = BUSQUEDA_ARCHIVO ? 'inline-flex' : 'none';
  if (typeof render === 'function' && grad && (grad === '__TODAS__' || DATA[grad])) render();
  if (typeof precargarPrimerosOriginales === 'function') {
    try { precargarPrimerosOriginales(); } catch (_) {}
  }
}

function limpiarBusquedaArchivos() {
  const input = document.getElementById('inputBuscarArchivo');
  if (input) input.value = '';
  filtrarArchivos('');
}
