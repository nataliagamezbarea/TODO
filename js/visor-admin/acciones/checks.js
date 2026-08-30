/* ACCIONES SOBRE CHECKS DEL VISOR (< 85 lineas) */

async function setInc(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : document.getElementById('cbInc').checked;
  it.include = nuevoVal;
  if (it.type === 'e') {
    const orig = DATA[grad].entries.find(x => x.archivo === it.archivo);
    if (orig) orig.include = nuevoVal;
  }
  const cb = document.getElementById('cbInc');
  if (cb) cb.checked = nuevoVal;
  guardarCheckEnServidor('inc', nuevoVal);
  refreshRightIframe();
  if (typeof renderStats === 'function') renderStats();
}

async function setInt(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : document.getElementById('cbInt').checked;
  it.inc_interior = nuevoVal;
  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.inc_interior = nuevoVal;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.inc_interior = nuevoVal;
  const cb = document.getElementById('cbInt');
  if (cb) cb.checked = nuevoVal;
  guardarCheckEnServidor('int', nuevoVal);
  refreshRightIframe();
  if (typeof renderStats === 'function') renderStats();
}

async function setCol(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : document.getElementById('cbCol').checked;
  it.inc_colegio = nuevoVal;
  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.inc_colegio = nuevoVal;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.inc_colegio = nuevoVal;
  const cb = document.getElementById('cbCol');
  if (cb) cb.checked = nuevoVal;
  guardarCheckEnServidor('col', nuevoVal);
  refreshRightIframe();
  if (typeof renderStats === 'function') renderStats();
}

async function setInternet(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : (document.getElementById('cbBorrarImgInternet') ? document.getElementById('cbBorrarImgInternet').checked : false);
  it.inc_internet = nuevoVal;
  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.inc_internet = nuevoVal;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.inc_internet = nuevoVal;
  if (typeof syncInternetCheckboxes === 'function') syncInternetCheckboxes();
  guardarCheckEnServidor('internet', nuevoVal);
  refreshRightIframe();
  if (typeof renderStats === 'function') renderStats();
}

async function setRen(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : document.getElementById('cbRen').checked;
  it.inc_renombre = nuevoVal;
  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.inc_renombre = nuevoVal;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.inc_renombre = nuevoVal;
  const cb = document.getElementById('cbRen');
  if (cb) cb.checked = nuevoVal;
  guardarCheckEnServidor('ren', nuevoVal);
  if (typeof renderStats === 'function') renderStats();
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
