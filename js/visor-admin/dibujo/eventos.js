/* MANEJO DE FINALIZACION DE DIBUJO (< 60 lineas) */

async function procesarFinDibujo(drawBox, pageDiv, p, it, tipoElegido) {
  const rect = pageDiv.getBoundingClientRect();
  const w = parseFloat(drawBox.style.width || '0');
  const h = parseFloat(drawBox.style.height || '0');
  const l = parseFloat(drawBox.style.left || '0');
  const t = parseFloat(drawBox.style.top || '0');

  if (w > 10 && h > 10) {
    const pctLeft = ((l / rect.width) * 100).toFixed(2);
    const pctTop = ((t / rect.height) * 100).toFixed(2);
    const pctWidth = ((w / rect.width) * 100).toFixed(2);
    const pctHeight = ((h / rect.height) * 100).toFixed(2);

    if (tipoElegido === 'nombre' || tipoElegido === 'colegio' || tipoElegido === 'reflujo') {
      await guardarRecuadroNuevoDirecto(tipoElegido, it, p.page_num, pctLeft, pctTop, pctWidth, pctHeight);
      return;
    }

    showBlocker('Detectando texto en el recuadro...');
    try {
      const res = await fetch('/api/extract_box_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad), archivo: it.archivo, page_num: p.page_num,
          left: pctLeft, top: pctTop, width: pctWidth, height: pctHeight
        })
      });
      const data = await res.json();
      hideBlocker();
      const detectedText = (data.text && data.text.trim()) ? data.text.trim() : `[Zona Pág ${p.page_num + 1}: ${pctLeft}% x ${pctTop}%]`;
      window._selContext = { page: p.page_num, pct_top: parseFloat(pctTop) };
      openCrearEnunciadoModal(detectedText);
    } catch (_err) {
      hideBlocker();
      window._selContext = { page: p.page_num, pct_top: parseFloat(pctTop) };
      openCrearEnunciadoModal(`[Zona Pág ${p.page_num + 1}: ${pctLeft}% x ${pctTop}%]`);
    }
  } else {
    if (drawBox) drawBox.remove();
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
