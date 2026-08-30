/* CREACION DE WRAPPERS Y PLACEHOLDERS (< 50 lineas) */

function crearPlaceholdersDocumento(total, anchoDisp, el) {
  const altoEst = Math.round(anchoDisp * 1.414);
  const wrappers = [];
  for (let i = 0; i < total; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'doc-page pdfjs-page';
    wrapper.style.position = 'relative';
    wrapper.style.minHeight = altoEst + 'px';
    wrapper.style.width = anchoDisp + 'px';
    wrapper.style.margin = '0 auto 12px auto';
    wrapper.dataset.paginaIdx = String(i);
    wrapper.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:${altoEst}px;color:#94a3b8;font-size:13px;background:rgba(255,255,255,0.03);border-radius:4px;gap:8px"><i class="fa-regular fa-file-pdf" style="font-size:36px;color:#64748b"></i><span>Cargando página ${i + 1}…</span></div>`;
    el.appendChild(wrapper);
    wrappers.push(wrapper);
  }
  return wrappers;
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
