// GESTIÓN DE RAMA SELECCIONADA
window.RamaActual = (() => {
  const CLAVE_LOCAL = "rama_actual";

  const obtener = () => {
    const url = new URLSearchParams(window.location.search).get("rama");
    if (url && url.trim()) { guardar(url.trim()); return url.trim(); }
    try {
      const ctx = JSON.parse(localStorage.getItem("visor_contexto") || "{}");
      if (ctx.todas === true) return '';
      if (ctx.rama) return String(ctx.rama).trim();
    } catch (_) {}
    return localStorage.getItem(CLAVE_LOCAL) || "";
  };

  const guardar = (rama) => {
    if (rama) {
      localStorage.setItem(CLAVE_LOCAL, rama);
      try {
        const ctx = JSON.parse(localStorage.getItem("visor_contexto") || "{}");
        localStorage.setItem("visor_contexto", JSON.stringify({ ...ctx, rama }));
      } catch (_) {}
    }
  };

  const pintarSeleccionActual = (select) => {
    if (!select) return '';
    const candidata = obtener();
    // Pintar la rama conocida INMEDIATAMENTE. No esperamos a GitHub.
    if (candidata) {
      let op = Array.from(select.options).find(o => o.value === candidata);
      if (!op) {
        op = document.createElement('option');
        op.value = candidata;
        op.textContent = candidata;
        select.appendChild(op);
      }
      select.value = candidata;
    } else {
      select.value = '';
    }
    return candidata;
  };

  const poblarSelector = async (select) => {
    if (!select) return [];
    // Nunca reseteamos el selector a SELECCIONAR mientras GitHub responde.
    // La rama ya conocida se pinta antes y permanece visible durante la carga.
    if (!select.options.length) {
      select.innerHTML = '<option value="">SELECCIONAR</option>';
    }
    const candidata = pintarSeleccionActual(select);
    const ramas = window.RamaAPI ? await window.RamaAPI.listarRamas() : [];
    (ramas || []).filter(r => r && String(r).toLowerCase() !== 'master').forEach(rama => {
      if (!Array.from(select.options).some(o => o.value === rama)) {
        const op = document.createElement("option");
        op.value = rama;
        op.textContent = rama;
        select.appendChild(op);
      }
    });
    // GitHub nunca puede borrar visualmente la rama actual.
    if (candidata) select.value = candidata;
    if (typeof ensureAllBranchesOption === 'function') ensureAllBranchesOption(select);
    if (sessionStorage.getItem('visorAdminBranchMode') === 'all' ||
        (() => { try { return JSON.parse(localStorage.getItem('visor_contexto') || '{}').todas === true; } catch (_) { return false; } })()) {
      select.value = '__ALL_BRANCHES__';
    }
    return ramas || [];
  };

  return { obtener, guardar, listarRamas: () => (window.RamaAPI ? window.RamaAPI.listarRamas() : Promise.resolve([])), pintarSeleccionActual, poblarSelector };
})();


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
