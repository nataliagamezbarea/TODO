function anadirOverlaysPagina(wrapper, p, it, isLeft, opciones = {}) {
  if (!p || !wrapper) return;
  const meta = (!isLeft && opciones && opciones.metaOriginalPagina) ? opciones.metaOriginalPagina : p;

  const mostrarEnc = (opciones.enc !== false);
  const mostrarNom = (opciones.int !== false);
  const mostrarCol = (opciones.col !== false);

  if (mostrarEnc) {
    const stHotspots = (!isLeft && Array.isArray(p.statement_hotspots) && p.statement_hotspots.length > 0)
      ? p.statement_hotspots
      : (meta.statement_hotspots || p.statement_hotspots || []);
    if (Array.isArray(stHotspots)) {
      stHotspots.forEach(sh => { try { _crearHotspotEnunciado(sh, wrapper, isLeft, it, isLeft ? meta : p); } catch (_e) {} });
    }
  }

  if (mostrarNom && Array.isArray(meta.name_hotspots)) {
    meta.name_hotspots.forEach(nh => { try { _crearHotspotNombre(nh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (mostrarCol && Array.isArray(meta.school_hotspots)) {
    meta.school_hotspots.forEach(sh => { try { _crearHotspotColegio(sh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (Array.isArray(meta.reflow_hotspots) && typeof _crearHotspotReflujo === 'function') {
    meta.reflow_hotspots.forEach(rh => { try { _crearHotspotReflujo(rh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (isLeft && Array.isArray(p.image_hotspots)) {
    p.image_hotspots.forEach(ih => { try { _crearHotspotImagen(ih, wrapper, isLeft, it, p); } catch (_e) {} });
  }

  if (isLeft && typeof attachDrawingToPage === 'function') {
    try { attachDrawingToPage(wrapper, p, it); } catch (_e) {}
  }
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
