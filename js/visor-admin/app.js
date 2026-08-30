/* PUNTO DE ENTRADA DEL VISOR ADMIN */

function integrarControlesEnNavbar() {
  const barra = document.getElementById('barra-superior');
  if (!barra) return;
  const navLeft = barra.querySelector('.nav-left');
  const navRight = barra.querySelector('.nav-right');
  if (!navLeft || !navRight) return;

  // No duplicar si el inicializador se ejecuta más de una vez.
  if (!document.getElementById('visor-navbar-brand')) {
    const brand = document.createElement('span');
    brand.id = 'visor-navbar-brand';
    brand.className = 'visor-navbar-brand';
    brand.innerHTML = '<i class="fa-solid fa-file-pen"></i><span>Visor de documentos</span>';
    navLeft.appendChild(brand);
  }

  if (!document.getElementById('selectRamaGithub')) {
    const box = document.createElement('div');
    box.className = 'visor-navbar-rama';
    box.innerHTML = `
      <label for="selectRamaGithub"><i class="fa-brands fa-github"></i> Rama</label>
      <select id="selectRamaGithub" onchange="cambiarRamaGithub(this.value)">
        <option value="">-- Seleccionar rama --</option>
      </select>`;
    navLeft.appendChild(box);
  }

  const acciones = [
    ['visor-btn-resumen', 'openSummaryModal()', 'fa-chart-pie', 'Resumen'],
    ['visor-btn-sync', 'sincronizarGitHub()', 'fa-cloud-arrow-down', 'Sync GitHub'],
    ['visor-btn-apuntes', 'compileAllApuntes()', 'fa-copy', 'Apuntes'],
    ['visor-btn-terminado', 'openLimpiarDatosModal()', 'fa-broom', 'Terminado'],
  ];

  acciones.forEach(([id, onclick, icon, texto]) => {
    if (document.getElementById(id)) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'visor-navbar-action' + (id === 'visor-btn-terminado' ? ' visor-navbar-danger' : '');
    b.title = texto;
    b.innerHTML = `<i class="fa-solid ${icon}"></i><span>${texto}</span>`;
    b.setAttribute('onclick', onclick);
    navRight.insertBefore(b, document.getElementById('btn-modo-oscuro') || document.getElementById('boton-ajustes') || document.getElementById('btn-cerrar-sesion') || null);
  });
}

async function inicializarRamasGithub() {
  const sel = document.getElementById('selectRamaGithub');
  if (!sel) return;
  if (window.RamaActual && typeof window.RamaActual.poblarSelector === 'function') {
    await window.RamaActual.poblarSelector(sel);
  }
}

function _guardarContextoVisor(parcial = {}) {
  try {
    const actual = JSON.parse(localStorage.getItem('visor_contexto') || '{}');
    localStorage.setItem('visor_contexto', JSON.stringify({ ...actual, ...parcial }));
  } catch (_) {}
}

function cambiarRamaGithub(rama) {
  mostrarCargandoPagina('Cargando rama...');
  const ultima = localStorage.getItem('last_grado') || localStorage.getItem('rama_actual');
  if (window.RamaActual) window.RamaActual.guardar(rama);
  if (!rama) {
    // SELECCIONAR = TODAS LAS RAMAS. No mostramos una pantalla intermedia.
    grad = '__TODAS__';
    _guardarContextoVisor({ rama: '', todas: true, directo: false, archivo: '', asignatura: '', trimestre: '', tarea: '' });
    localStorage.removeItem('last_open');
    localStorage.removeItem('last_archivo');
    if (typeof buildAllItems === 'function') buildAllItems();
    if (typeof renderTabs === 'function') renderTabs();
    if (typeof render === 'function') render();
    requestAnimationFrame(() => setTimeout(() => ocultarCargandoPagina(), 120));
    const sel = document.getElementById('selectRamaGithub');
    if (sel) sel.value = '';
    return;
  }
  _guardarContextoVisor({ todas: false, directo: false, archivo: '', asignatura: '', trimestre: '', tarea: '' });
  grad = rama;
  localStorage.setItem('last_grado', grad);
  localStorage.setItem('last_pos', '0');
  _guardarContextoVisor({ rama });
  if (typeof CONFIG !== 'undefined' && CONFIG[rama]) {
    if (typeof renderTabs === 'function') renderTabs();
    if (typeof buildAllItems === 'function') buildAllItems();
    if (typeof render === 'function') render();
    requestAnimationFrame(() => setTimeout(() => ocultarCargandoPagina(), 120));
  } else if (typeof load === 'function') {
    Promise.resolve(load()).finally(() => setTimeout(() => ocultarCargandoPagina(), 120));
  }
}

async function sincronizarGitHub() {
  if (typeof showBlocker === 'function') showBlocker('Sincronizando ramas y archivos con GitHub...');
  try {
    const res = await fetch('/api/github_pull', { method: 'POST' });
    const data = await res.json();
    if (typeof hideBlocker === 'function') hideBlocker();
    if (typeof showCustomAlert === 'function') {
      await showCustomAlert('Sincronización GitHub', data.mensaje || 'Ramas y archivos sincronizados correctamente.', '<i class="fa-brands fa-github"></i>', '#2563eb');
    }
    window.location.reload();
  } catch (e) {
    if (typeof hideBlocker === 'function') hideBlocker();
    console.error('Error sincronizando con GitHub:', e);
  }
}

async function cerrarSesionUsuario() {
  if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  window.location.href = '../modulos/login.html';
}

function openSummaryModal() {
  const modal = document.getElementById('summaryModal');
  const body = document.getElementById('summaryBody');
  const title = document.getElementById('sumDegreeTitle');
  if (!modal || !body) return;
  const lista = Array.isArray(ITEMS) ? ITEMS : [];
  const total = lista.length;
  const originales = lista.filter(x => x.decision === 'original').length;
  const aceptados = lista.filter(x => x.decision === 'aceptado' || x.decision === 'accepted').length;
  const pendientes = Math.max(0, total - originales - aceptados);
  const ramaTitulo = (typeof grad !== 'undefined' && grad && grad !== '__TODAS__') ? grad : 'TODAS LAS RAMAS';
  if (title) title.textContent = ramaTitulo;
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px">
      <div class="summary-card"><b>${total}</b><span>Documentos</span></div>
      <div class="summary-card"><b>${aceptados}</b><span>Aceptados</span></div>
      <div class="summary-card"><b>${originales}</b><span>Originales</span></div>
      <div class="summary-card"><b>${pendientes}</b><span>Pendientes</span></div>
    </div>
    <div style="font-size:12px;color:#94a3b8">Rama: <strong style="color:#e2e8f0">${ramaTitulo}</strong></div>`;
  modal.classList.add('on');
}

function closeSummaryModal() {
  const modal = document.getElementById('summaryModal');
  if (modal) modal.classList.remove('on');
}

function mostrarAccesoDenegadoVisor() {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `<div class="visor-acceso-denegado"><i class="fa-solid fa-lock"></i><h2>Acceso solo para administradores</h2><p>El visor de gestión de documentos requiere una sesión de administrador.</p></div>`;
  }
  const search = document.getElementById('fileSearchBar');
  if (search) search.style.display = 'none';
  const stats = document.getElementById('stats');
  if (stats) stats.innerHTML = '';
}

function mostrarCargandoPagina(texto = 'Cargando página...') {
  const el = document.getElementById('visor-navbar-loading');
  if (!el) return;
  const span = el.querySelector('span');
  if (span) span.textContent = texto;
  el.classList.add('on');
  el.setAttribute('aria-hidden', 'false');
}

function ocultarCargandoPagina() {
  const el = document.getElementById('visor-navbar-loading');
  if (!el) return;
  el.classList.remove('on');
  el.setAttribute('aria-hidden', 'true');
}

// Al salir del visor hacia otra página, mostrar carga inmediatamente.
document.addEventListener('click', (e) => {
  const enlace = e.target.closest('a[href]');
  if (!enlace || enlace.target === '_blank' || enlace.hasAttribute('download')) return;
  const href = enlace.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
  try {
    const u = new URL(href, location.href);
    if (u.origin === location.origin && u.href !== location.href) mostrarCargandoPagina('Cargando página...');
  } catch (_) {}
}, true);

window.addEventListener('beforeunload', () => mostrarCargandoPagina('Cargando página...'));

document.addEventListener('DOMContentLoaded', async () => {
  // La navbar es FIJA y se crea antes que el visor. El indicador de carga
  // permanece visible debajo de ella hasta que el contenido termina de renderizar.
  mostrarCargandoPagina('Cargando página...');
  integrarControlesEnNavbar();
  // La rama conocida se muestra antes de cualquier petición de Supabase/GitHub.
  // Así no hay un parpadeo a SELECCIONAR al entrar en el visor.
  try {
    const selRamaInicial = document.getElementById('selectRamaGithub');
    if (selRamaInicial && window.RamaActual?.pintarSeleccionActual) {
      window.RamaActual.pintarSeleccionActual(selRamaInicial);
    }
  } catch (_) {}

  if (window.Permisos && typeof window.Permisos.asegurarSesion === 'function') {
    await window.Permisos.asegurarSesion();
  }
  if (!(window.Permisos && window.Permisos.esAdmin)) {
    mostrarAccesoDenegadoVisor();
    ocultarCargandoPagina();
    return;
  }

  try {
    const q = new URLSearchParams(window.location.search);
    const ret = q.get('return');
    const btnVolver = document.getElementById('volver-atras');
    if (btnVolver && ret && ret.startsWith('/')) {
      btnVolver.dataset.returnPath = ret;
      btnVolver.title = 'Volver a la página anterior';
      btnVolver.classList.remove('oculto');
      btnVolver.classList.remove('cargando');
    }
  } catch (_) {}

  // Mantener CARGANDO visible durante load + construcción del selector + render.
  window.__visorCargaInicial = true;
  try {
    await load();
    await inicializarRamasGithub();
    if (typeof initCacheToggle === 'function') initCacheToggle();
  } finally {
    window.__visorCargaInicial = false;
    requestAnimationFrame(() => setTimeout(() => ocultarCargandoPagina(), 120));
  }
});

// El retorno del visor se configura después de que navbar.js haya creado la navbar.\n
