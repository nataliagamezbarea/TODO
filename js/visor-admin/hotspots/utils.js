/* UTILIDADES DE HOTSPOTS Y HANDLES (< 85 lineas) */
const _CLASES_HOTSPOT = ['orange-hotspot', 'red-hotspot', 'gray-hotspot', 'green-hotspot', 'blue-name-hotspot', 'gray-name-hotspot', 'school-hotspot', 'gray-school-hotspot', 'image-hotspot'];

function marcarHotspotSeleccionado(el) {
  _CLASES_HOTSPOT.forEach(c => document.querySelectorAll('.' + c).forEach(h => h.classList.remove('selected')));
  if (el && el.classList) el.classList.add('selected');
}

function anadirHandlesRedimensionamiento(box, hotspot, pageNum, tipo) {
  ['tl', 'tr', 'bl', 'br'].forEach(pos => {
    const h = document.createElement('div');
    h.className = `box-handle ${pos}`;
    box.appendChild(h);
    h.onmousedown = (e) => {
      e.preventDefault(); e.stopPropagation();
      const parent = box.parentElement, rectParent = parent.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY, startL = box.offsetLeft, startT = box.offsetTop, startW = box.offsetWidth, startH = box.offsetHeight;
      const onMouseMove = (ev) => {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        let newL = startL, newT = startT, newW = startW, newH = startH;
        if (pos.includes('r')) newW = Math.max(10, startW + dx);
        if (pos.includes('l')) { const w = Math.max(10, startW - dx); newL = startL + (startW - w); newW = w; }
        if (pos.includes('b')) newH = Math.max(10, startH + dy);
        if (pos.includes('t')) { const h = Math.max(10, startH - dy); newT = startT + (startH - h); newH = h; }
        box.style.left = ((newL / rectParent.width) * 100) + '%';
        box.style.top = ((newT / rectParent.height) * 100) + '%';
        box.style.width = ((newW / rectParent.width) * 100) + '%';
        box.style.height = ((newH / rectParent.height) * 100) + '%';
      };
      const onMouseUp = async () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        const pL = parseFloat(box.style.left).toFixed(2), pT = parseFloat(box.style.top).toFixed(2);
        const pW = parseFloat(box.style.width).toFixed(2), pH = parseFloat(box.style.height).toFixed(2);
        let txt = '';
        try {
          const rt = await fetch('/api/extract_box_text', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grado: (ITEMS[POS]?._rama || grad), archivo: ITEMS[POS].archivo, page_num: pageNum, left: pL, top: pT, width: pW, height: pH })
          });
          txt = ((await rt.json()).text || '').trim();
        } catch (_e) {}
        if (hotspot) {
          hotspot.left = parseFloat(pL); hotspot.top = parseFloat(pT);
          hotspot.width = parseFloat(pW); hotspot.height = parseFloat(pH);
          if (txt) hotspot.start = txt;
          if (txt) hotspot.old = txt;
        }
        await fetch('/api/recuadro', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grado: (ITEMS[POS]?._rama || grad), archivo: ITEMS[POS].archivo, tipo: tipo, page_num: pageNum, left: pL, top: pT, width: pW, height: pH, text: txt, hotspot_id: hotspot ? hotspot.id : undefined, start: hotspot ? hotspot.start : undefined })
        });
        if (typeof refrescarPaginaPreview === 'function') refrescarPaginaPreview(pageNum);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  });
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
