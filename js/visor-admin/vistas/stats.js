/* RENDERIZADO DE ESTADÍSTICAS Y CONTADORES (< 50 lineas) */

function renderTabs() {
  const tabs = document.getElementById('tabs');
  if (tabs) tabs.remove();
}

function renderStats() {
  const st = document.getElementById('stats');
  if (!st) return;
  const items = Array.isArray(ITEMS) ? ITEMS : [];
  const tot = items.length;
  const enc = items.filter(e => e.type === 'e' && e.include).length;
  const ren = items.filter(e => e.cambia_nombre && e.inc_renombre !== false).length;
  const lim = items.filter(e => e.inc_interior).length;
  const apu = items.filter(e => e.inc_apunte).length;
  const nApplied = items.filter(e => e.decision === 'applied').length;
  const nOriginal = items.filter(e => e.decision === 'original').length;
  st.innerHTML =
    `<div class="stat"><b style="color:#ffd166">${tot}</b>archivos totales</div>` +
    `<div class="stat"><b style="color:#ef4444">${enc}</b>enunciados confirmados</div>` +
    `<div class="stat"><b style="color:#8b5cf6">${ren}</b>renombres .pdf</div>` +
    `<div class="stat"><b style="color:#3b82f6">${lim}</b>limpiezas nombres</div>` +
    `<div class="stat"><b style="color:#10b981">${apu}</b>apuntes</div>` +
    `<div class="stat"><b style="color:#34d399">${nApplied}</b>aplicados</div>` +
    `<div class="stat"><b style="color:#fbbf24">${nOriginal}</b>originales</div>` +
    `<div class="legend"><span><span class="dot" style="background:#ef4444"></span> Rojo/Gris: Enunciado</span><span><span class="dot" style="background:#f97316"></span> Naranja: Creado por Ti</span><span><span class="dot" style="background:#3b82f6"></span> Azul/Gris: Nombres</span><span><span class="dot" style="background:#f59e0b"></span> Ámbar/Gris: Colegios</span></div>`;
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
