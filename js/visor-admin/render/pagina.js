/* RENDERIZADO DE CANVAS Y CAPA DE TEXTO PDF.JS (< 85 lineas) */

async function _renderPaginaPDFJS(doc, idx0, wrapper, escalaPreferida, elRef) {
  const pagina = await doc.getPage(idx0 + 1);
  const vp1 = pagina.getViewport({ scale: 1 });
  const anchoDisp = Math.max(280, elRef.clientWidth - 32);
  let escala = escalaPreferida || (anchoDisp / vp1.width);
  if (escala > 3.5) escala = 3.5;
  if (escala < 0.1) escala = 0.1;
  const viewport = pagina.getViewport({ scale: escala });

  wrapper.innerHTML = '';
  wrapper.style.width = `${viewport.width}px`;
  wrapper.style.minHeight = `${viewport.height}px`;
  wrapper.style.setProperty('--scale-factor', escala);


  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.display = 'block';
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  await pagina.render({ canvasContext: ctx, viewport: viewport }).promise;

  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'pdfTextLayer';
  textLayerDiv.style.position = 'absolute';
  textLayerDiv.style.left = '0';
  textLayerDiv.style.top = '0';
  textLayerDiv.style.width = `${viewport.width}px`;
  textLayerDiv.style.height = `${viewport.height}px`;
  textLayerDiv.style.setProperty('--scale-factor', escala);
  wrapper.appendChild(textLayerDiv);

  try {
    const textContent = await pagina.getTextContent();
    pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: []
    });
  } catch (_e) {}
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
