/* ACCIONES DE DECISIONES Y GUARDADO EN SERVIDOR (< 85 lineas) */

function guardarCheckEnServidor(campo, valor) {
  const it = ITEMS[POS];
  if (!it) return;
  fetch('/api/update_flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grado: (it?._rama || grad),
      archivo: it.archivo,
      campo: campo,
      valor: valor
    })
  }).catch(e => console.error('Error guardando check:', e));
}

function updateDecisionButtons(it) {
  const btnApp = document.getElementById('btnDecideApplied');
  const btnOrig = document.getElementById('btnDecideOriginal');
  if (!btnApp || !btnOrig) return;
  btnApp.classList.toggle('active-applied', it.decision === 'applied');
  btnOrig.classList.toggle('active-original', it.decision === 'original');
}

async function setDecision(nuevaDecision) {
  const it = ITEMS[POS];
  if (!it) return;
  if (it.decision === nuevaDecision) it.decision = null;
  else it.decision = nuevaDecision;

  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.decision = it.decision;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.decision = it.decision;

  updateDecisionButtons(it);
  fetch('/api/set_decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo, decision: it.decision })
  }).catch(e => console.error('Error guardando decision:', e));

  if (typeof renderStats === 'function') renderStats();
}

async function applyCurrentSingleFile() {
  const it = ITEMS[POS];
  if (!it) return;
  showBlocker('Aplicando cambios del archivo actual...');
  try {
    const res = await fetch('/api/apply_single_real', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo })
    });
    const data = await res.json();
    hideBlocker();
    if (data.ok) {
      it.decision = 'applied';
      updateDecisionButtons(it);
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert('Cambio Aplicado', `✓ El archivo ${it.archivo} se ha actualizado.`, '<i class="fa-solid fa-check"></i>', '#10b981');
      }
    }
  } catch (err) {
    hideBlocker();
    console.error('Error al aplicar cambios:', err);
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
