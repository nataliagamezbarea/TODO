/* RENDERIZADO DE TARJETAS Y ETIQUETAS (< 60 lineas) */

var LOADING_THUMB = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='45' r='22' fill='none' stroke='#4b5563' stroke-width='5' opacity='0.3'/><circle cx='50' cy='45' r='22' fill='none' stroke='#818cf8' stroke-width='5' stroke-linecap='round' stroke-dasharray='34 104'><animateTransform attributeName='transform' type='rotate' from='0 50 45' to='360 50 45' dur='0.9s' repeatCount='indefinite'/></circle><text x='50' y='86' font-size='11' text-anchor='middle' fill='#9ca3af' font-family='sans-serif'>Cargando…</text></svg>"
);

var FALLBACK_THUMB = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='#1f2937'/><text x='50' y='55' font-size='16' text-anchor='middle' fill='#6b7280' font-family='sans-serif'>Sin vista</text></svg>"
);

function vbadge(v, decision) {
  if (decision === 'applied') return '<span class="badge v" style="background:#065f46;color:#34d399;font-weight:700"><i class="fa-solid fa-check-double"></i> ✓ Aplicado</span>';
  if (decision === 'original') return '<span class="badge v" style="background:#78350f;color:#fbbf24;font-weight:700"><i class="fa-solid fa-rotate-left"></i> ✓ Original</span>';
  return '';
}

function groupBySubfolder(items) {
  const groups = {};
  items.forEach(it => {
    let sub = 'archivos';
    if (it.archivo.includes('/')) {
      sub = it.archivo.split('/')[0];
    }
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(it);
  });
  return groups;
}

function cardHTML(it) {
  const tag = (it.type === 'e') ? '<span class="tag enc">Enunciado + Nombres</span>' : '<span class="tag nom">Solo Nombres</span>';
  const ren = (it.cambia_nombre && it.nombre_limpio) ? `<div style="font-size:11px;color:#c084fc;margin-top:4px">➔ ${it.nombre_limpio}</div>` : '';
  const apuTag = it.inc_apunte ? '<span class="badge apu" style="background:#065f46;color:#34d399;font-size:10px;margin-left:4px">Apunte</span>' : '';
  const orig = (it.type === 'e') ? `<div class="orig-txt">Original: ${it.start || it.old || '-'}</div>` : '<div class="orig-txt">Limpieza de nombres de profesores y escolares.</div>';
  const nuev = (it.type === 'e') ? `<div class="new-txt">Nuevo: ${it.new || '-'}</div>` : '';
  // Las miniaturas cargan desde GitHub (backend). Como solo acceden admins con
  // sesión, se piden por fetch() para que lleven el JWT y el backend pueda leer
  // configuracion_privada y servir el PDF. El <img> se rellena en renderProgressiveGrid.
  const thumbId = 'thumb-' + (it.idx !== undefined ? it.idx : (it.archivo || '').replace(/[^\w-]/g, '_'));

  return `
    <div class="card-content-layout">
      <div class="card-thumb-box">
        <img id="${thumbId}" src="${LOADING_THUMB}" class="card-thumb-img is-loading" alt="Vista Previa PDF" loading="lazy" />
      </div>
      <div class="card-info-box">
        <div style="font-weight:700;font-size:14px;word-break:break-all;color:#f3f4f6">${it.archivo}</div>
        <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">${tag}${apuTag}${vbadge(it.visto, it.decision)}</div>
        ${ren}
        ${orig}
        ${nuev}
      </div>
    </div>
  `;
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
