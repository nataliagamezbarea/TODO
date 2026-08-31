/* INICIALIZADOR Y PUNTO DE ENTRADA PRINCIPAL */

async function inicializarRamasGithub() {
  const sel = document.getElementById('selectRamaGithub');
  if (!sel) return;
  if (window.RamaActual && typeof window.RamaActual.poblarSelector === 'function') {
    await window.RamaActual.poblarSelector(sel);
  }
}



function _reflejarRamaEnURL(rama) {
  try {
    const url = new URL(window.location.href);
    if (rama) url.searchParams.set('rama', rama);
    else url.searchParams.delete('rama');
    window.history.replaceState({}, '', url.toString());
  } catch (_) {}
}

function cambiarRamaGithub(rama) {
  const ultima = localStorage.getItem('last_grado') || localStorage.getItem('rama_actual');
  if (window.RamaActual) window.RamaActual.guardar(rama);
  if (!rama) {
    // La opción "-- Seleccionar rama --" restaura la última rama en lugar de limpiar.
    if (ultima) {
      cambiarRamaGithub(ultima);
      return;
    }
    grad = '';
    _reflejarRamaEnURL('');
    localStorage.removeItem('last_open');
    localStorage.removeItem('last_archivo');
    if (typeof mostrarSeleccionarRama === 'function') mostrarSeleccionarRama();
    return;
  }
  grad = rama;
  localStorage.setItem('last_grado', grad);
  localStorage.setItem('last_pos', '0');
  _reflejarRamaEnURL(rama);
  if (typeof CONFIG !== 'undefined' && CONFIG[rama]) {
    if (typeof renderTabs === 'function') renderTabs();
    if (typeof buildAllItems === 'function') buildAllItems();
    if (typeof render === 'function') render();
  } else {
    // La rama aún no está en CONFIG: cargar datos (fetch) y renderizarla.
    if (typeof load === 'function') load();
  }
}


async function sincronizarGitHub() {
  if (typeof showBlocker === 'function') showBlocker('Sincronizando ramas y archivos con GitHub...');
  try {
    const res = await fetch('/api/github_pull', { method: 'POST' });
    const data = await res.json();
    if (typeof hideBlocker === 'function') hideBlocker();
    if (typeof showCustomAlert === 'function') {
      await showCustomAlert(
        'Sincronización GitHub',
        data.mensaje || 'Ramas y archivos sincronizados correctamente.',
        '<i class="fa-brands fa-github"></i>',
        '#2563eb'
      );
    }
    window.location.reload();
  } catch (e) {
    if (typeof hideBlocker === 'function') hideBlocker();
    console.error('Error sincronizando con GitHub:', e);
  }
}

async function cerrarSesionUsuario() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }
  window.location.href = 'paginas/iniciar-sesion.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initKeyboardNavigation === 'function') initKeyboardNavigation();
  // load() primero: muestra "Selecciona una rama" (o el grid) de inmediato sin
  // esperar a que carguen las ramas del selector.
  load();
  await inicializarRamasGithub();
  if (typeof initCacheToggle === 'function') initCacheToggle();
});

