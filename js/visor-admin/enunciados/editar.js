/* MODAL EDITAR ENUNCIADO (< 70 lineas) */

function openEditarEnunciadoModal(sh, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  currentEditingHotspot = sh;
  const m = document.getElementById('modalEditarEnunciado');
  if (!m) return;
  const oldTextarea = document.getElementById('editarOldText');
  const newTextarea = document.getElementById('editarNewText');
  if (oldTextarea) oldTextarea.value = (sh && (sh.old || sh.start)) ? (sh.old || sh.start) : '';
  if (newTextarea) newTextarea.value = (sh && sh.new) ? sh.new : '';
  m.classList.add('on');
}

function closeEditarEnunciadoModal() {
  const m = document.getElementById('modalEditarEnunciado');
  if (m) m.classList.remove('on');
  currentEditingHotspot = null;
}

async function guardarEditarEnunciado() {
  const it = ITEMS[POS];
  const sh = currentEditingHotspot;
  const st = String(document.getElementById('editarOldText')?.value || '').trim();
  const ed = sh ? (sh.end || '') : '';
  const nw = document.getElementById('editarNewText').value;
  if (!st) {
    alert('Escribe el texto que quieres cambiar.');
    return;
  }

  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);
  showBlocker('Guardando reescritura y actualizando vista previa...');
  try {
    await fetch('/api/save_enunciado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo, start: st, old_start: sh ? (sh.start || sh.old || '') : '', end: ed, new_text: nw, page: sh ? sh.page : undefined, pct_top: sh ? (sh.pct_top ?? sh.top) : undefined })
    });

    if (it.type === 'e') {
      await setInc(true);
    }

    closeEditarEnunciadoModal();
    await load();
    hideBlocker();
    refreshRightIframe();
    openPos(POS);
  } catch (e) {
    hideBlocker();
    console.error('Error al guardar enunciado:', e);
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
