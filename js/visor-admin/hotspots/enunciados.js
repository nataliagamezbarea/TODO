/* CREACION DE HOTSPOTS DE ENUNCIADOS (< 85 lineas) */

function _crearHotspotEnunciado(sh, pageDiv, isLeft, it, p) {
  const activo = (sh.include !== false && it.include !== false);
  const tieneNuevo = !!(sh.new && sh.new.trim());
  const esCustom = !!sh.custom;
  if (!isLeft && !activo) return;

  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (sh.left !== undefined ? sh.left : 5) + '%';
  box.style.top = (sh.top !== undefined ? sh.top : 5) + '%';
  box.style.width = (sh.width !== undefined ? sh.width : 90) + '%';
  box.style.height = (sh.height !== undefined ? sh.height : 7.5) + '%';

  box.className = !activo ? 'gray-hotspot' : 'red-hotspot';
  box.title = !activo ? 'Enunciado desactivado (Clic para activar)' : (tieneNuevo ? `Enunciado (Sustitución: "${sh.new}")` : (esCustom ? 'Enunciado creado manualmente' : 'Enunciado'));
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openEnunciadoPopup === 'function') openEnunciadoPopup(sh, e, box);
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, sh, p.page_num, 'enunciado');
  }
  pageDiv.appendChild(box);
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
