/* CREACION DE HOTSPOTS DE COLEGIOS E IMAGENES (< 85 lineas) */

function _crearHotspotColegio(sh, pageDiv, isLeft, it, p) {
  const activo = (it.inc_colegio !== false);
  if (!isLeft && !activo) return;

  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (sh.left !== undefined ? sh.left : 5) + '%';
  box.style.top = (sh.top !== undefined ? sh.top : 5) + '%';
  box.style.width = (sh.width !== undefined ? sh.width : 40) + '%';
  box.style.height = (sh.height !== undefined ? sh.height : 6) + '%';

  box.className = activo ? 'school-hotspot' : 'gray-school-hotspot';
  box.title = activo ? (sh.manual ? 'Colegio (Recuadro manual)' : 'Colegio/Logo (Activo para borrar)') : 'Colegio/Logo (Desactivado)';
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openColegioPopup === 'function') openColegioPopup(sh, e, box);
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, sh, p.page_num, 'colegio');
  }

  pageDiv.appendChild(box);
}





function _crearHotspotImagen(ih, pageDiv, isLeft, it, p) {
  if (!isLeft) return;
  const box = document.createElement('div');
  box.className = 'image-hotspot';
  box.style.position = 'absolute';
  box.style.left = (ih.left || 0) + '%';
  box.style.top = (ih.top || 0) + '%';
  box.style.width = (ih.width || 10) + '%';
  box.style.height = (ih.height || 10) + '%';
  box.title = `Imagen (${ih.id || 'img'}). Clic para opciones de reemplazo/borrado/internet.`;
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openImagePopup === 'function') openImagePopup(ih, e);
  };
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
