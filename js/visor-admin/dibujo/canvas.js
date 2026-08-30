/* EVENTOS DE DIBUJO SOBRE CANVAS (< 60 lineas) */

const _CLASES_NO_DIBUJAR_AQUI = (typeof _CLASES_HOTSPOT !== 'undefined' ? _CLASES_HOTSPOT : [
  'orange-hotspot', 'red-hotspot', 'gray-hotspot', 'green-hotspot',
  'blue-name-hotspot', 'gray-name-hotspot', 'school-hotspot', 'gray-school-hotspot', 'image-hotspot'
]).concat(['box-handle', 'draw-box']);

function attachDrawingToPage(pageDiv, p, it) {
  pageDiv.onmousedown = (e) => {
    if (!isDrawingMode) return;
    e.preventDefault();
    e.stopPropagation();
    limpiarRecuadrosDibujoSobrantes();
    let isDrawing = true;
    const rect = pageDiv.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const drawBox = document.createElement('div');
    drawBox.className = 'draw-box ' + modoAnadirTipo;
    drawBox.style.left = startX + 'px';
    drawBox.style.top = startY + 'px';
    drawBox.style.width = '0px';
    drawBox.style.height = '0px';
    pageDiv.appendChild(drawBox);

    const onMouseMove = (ev) => {
      if (!isDrawing || !drawBox) return;
      const r = pageDiv.getBoundingClientRect();
      const currX = ev.clientX - r.left;
      const currY = ev.clientY - r.top;
      drawBox.style.left = Math.min(startX, currX) + 'px';
      drawBox.style.top = Math.min(startY, currY) + 'px';
      drawBox.style.width = Math.abs(currX - startX) + 'px';
      drawBox.style.height = Math.abs(currY - startY) + 'px';
    };

    const onMouseUp = async () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (!isDrawing) return;
      isDrawing = false;
      isDrawingMode = false;
      const vOld = document.getElementById('viewerOld');
      if (vOld) vOld.style.cursor = 'default';
      const editorBox = document.getElementById('editorBox');
      if (editorBox) editorBox.classList.remove('on');
      const tipoElegido = modoAnadirTipo;
      modoAnadirTipo = 'enunciado';
      await procesarFinDibujo(drawBox, pageDiv, p, it, tipoElegido);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
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
