/* GUARDAR RECUADRO DIRECTO (< 60 lineas) */

async function guardarRecuadroNuevoDirecto(tipo, it, pageNum, left, top, width, height) {
  const esColegio = (tipo === 'colegio');
  const esReflujo = (tipo === 'reflujo');
  showBlocker(esReflujo ? 'Guardando inicio de flujo...' : (esColegio ? 'Guardando colegio...' : 'Guardando nombre...'));
  try {
    let textoSeleccionado = '';
    if (!esReflujo) {
      try {
        const rt = await fetch('/api/extract_box_text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grado: (it?._rama || grad), archivo: it.archivo, page_num: pageNum,
            left: left, top: top, width: width, height: height
          })
        });
        const dt = await rt.json();
        textoSeleccionado = (dt.text || '').trim();
      } catch (_e) {
        textoSeleccionado = '';
      }
    }

    await fetch('/api/recuadro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: (it?._rama || grad),
        archivo: it.archivo,
        tipo: tipo,
        page_num: pageNum,
        left: left, top: top, width: width, height: height,
        text: textoSeleccionado
      })
    });
    if (esColegio) await setCol(true);
    else if (!esReflujo) await setInt(true);
    limpiarRecuadrosDibujoSobrantes();
    hideBlocker();
    if (typeof openPos === 'function' && typeof POS !== 'undefined') openPos(POS);
    if (typeof refreshRightIframe === 'function') refreshRightIframe();
  } catch (err) {
    hideBlocker();
    console.error('Error al guardar el recuadro nuevo:', err);
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
