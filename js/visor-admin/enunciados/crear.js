/* MODAL CREAR ENUNCIADO (< 70 lineas) */

function openCrearEnunciadoModal(initialStartText = '') {
  const m = document.getElementById('modalCrearEnunciado');
  if (!m) return;
  const cs = document.getElementById('crearStart');
  const cn = document.getElementById('crearNew');
  if (cs) cs.value = initialStartText;
  if (cn) cn.value = '';
  m.classList.add('on');
}

function closeCrearEnunciadoModal() {
  const m = document.getElementById('modalCrearEnunciado');
  if (m) m.classList.remove('on');
  if (typeof limpiarRecuadrosDibujoSobrantes === 'function') limpiarRecuadrosDibujoSobrantes();
}

async function guardarNuevoEnunciado() {
  const it = ITEMS[POS];
  const cs = document.getElementById('crearStart');
  const cn = document.getElementById('crearNew');
  const st = cs ? cs.value : '';
  const nw = cn ? cn.value : '';

  if (!nw.trim()) {
    console.warn('Debes ingresar el nuevo enunciado');
    return;
  }

  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);
  showBlocker('Guardando nuevo enunciado y generando previsualización...');
  try {
    const selCtx = window._selContext || {};
    await fetch('/api/save_enunciado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo, start: st, end: '', new_text: nw, page: selCtx.page, pct_top: selCtx.pct_top, custom: true })
    });

    if (it.type === 'e') {
      await setInc(true);
    }

    closeCrearEnunciadoModal();
    if (typeof limpiarRecuadrosDibujoSobrantes === 'function') limpiarRecuadrosDibujoSobrantes();
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
