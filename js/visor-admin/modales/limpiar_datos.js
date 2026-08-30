/* MODAL TERMINADO / LIMPIAR DATOS DE REVISION (< 80 lineas) */

function openLimpiarDatosModal() {
  const modal = document.getElementById('modalLimpiarDatos');
  if (modal) modal.classList.add('on');
}

function closeLimpiarDatosModal() {
  const modal = document.getElementById('modalLimpiarDatos');
  if (modal) modal.classList.remove('on');
}

function toggleCheckTodo(master) {
  const checked = master.checked;
  ['chkEnunciados', 'chkNombres', 'chkColegios', 'chkImagenes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
  });
}

async function ejecutarLimpiarDatos() {
  const chkEnunciados = document.getElementById('chkEnunciados')?.checked || false;
  const chkNombres = document.getElementById('chkNombres')?.checked || false;
  const chkColegios = document.getElementById('chkColegios')?.checked || false;
  const chkImagenes = document.getElementById('chkImagenes')?.checked || false;
  const chkSyncGithub = document.getElementById('chkSyncGithub')?.checked || false;

  if (!chkEnunciados && !chkNombres && !chkColegios && !chkImagenes) {
    alert('Por favor, selecciona al menos un tipo de dato a eliminar.');
    return;
  }

  const ok = await showCustomConfirm(
    '¿Eliminar datos seleccionados?',
    'Esta acción limpiará los datos guardados en los JSON de revisión y mantendrá todo ágil.',
    '<i class="fa-solid fa-trash-can"></i>',
    '#ef4444'
  );
  if (!ok) return;

  closeLimpiarDatosModal();
  showBlocker('Limpiando datos de revisión y actualizando GitHub...');
  try {
    const resp = await fetch('/api/limpiar_datos_revision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: grad,
        eliminar_enunciados: chkEnunciados,
        eliminar_nombres: chkNombres,
        eliminar_colegios: chkColegios,
        eliminar_imagenes: chkImagenes,
        sync_github: chkSyncGithub
      })
    });
    const res = await resp.json();
    hideBlocker();
    if (res.ok) {
      await showCustomAlert('Datos Limpiados con Éxito', res.mensaje || 'Se han eliminado los datos seleccionados.', '<i class="fa-solid fa-circle-check"></i>', '#10b981');
      if (typeof load === 'function') await load();
    } else {
      await showCustomAlert('Error al Limpiar', res.error || 'Ocurrió un error inesperado.', '<i class="fa-solid fa-circle-xmark"></i>', '#ef4444');
    }
  } catch (err) {
    hideBlocker();
    console.error('Error al limpiar datos:', err);
    await showCustomAlert('Error de Red', 'No se pudo conectar con el servidor para limpiar datos.', '<i class="fa-solid fa-wifi"></i>', '#ef4444');
  }
}

window.openLimpiarDatosModal = openLimpiarDatosModal;
window.closeLimpiarDatosModal = closeLimpiarDatosModal;
window.toggleCheckTodo = toggleCheckTodo;
window.ejecutarLimpiarDatos = ejecutarLimpiarDatos;


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
