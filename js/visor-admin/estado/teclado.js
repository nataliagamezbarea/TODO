/* ATAJOS DE TECLADO Y UTILIDADES (< 80 lineas) */

function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const ov = document.getElementById('ov');
    if (!ov || !ov.classList.contains('on')) return;

    if (e.key === 'ArrowRight' && !e.altKey) { e.preventDefault(); nav(1); }
    else if (e.key === 'ArrowLeft' && !e.altKey) { e.preventDefault(); nav(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); closeOv(); }
    else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); navCambio(-1); }
    else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navCambio(1); }
    else if (e.key === '1') { e.preventDefault(); setDecision('applied'); }
    else if (e.key === '2') { e.preventDefault(); setDecision('original'); }
  });
}

function osBaseName(path) {
  return String(path || '').split('/').pop().split('\\').pop();
}

function setGrad(g) {
  grad = g;
  const sel = document.getElementById('gradeSelect');
  if (sel) sel.value = g;
  localStorage.setItem('last_grado', g);
  buildAllItems();
  if (typeof render === 'function') render();
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
