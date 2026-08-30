/* VERIFICACION EN INTERNET DE IMAGENES (< 85 lineas) */

async function checkSelectedImageInternet() {
  if (!selectedImageIh) return;
  const ih = selectedImageIh;
  closeImgPopup();
  const autoBorrar = isAutoDelInternetActive();
  showBlocker('Comprobando presencia de imagen en Internet...');
  try {
    const it = ITEMS[POS];
    const res = await fetch('/api/check_image_internet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: (it?._rama || grad),
        archivo: it.archivo,
        page_num: ih.page_num || 0,
        img_idx: ih.img_idx || 0,
        auto_borrar: autoBorrar
      })
    });
    const data = await res.json();
    hideBlocker();

    const existe = data.existe_en_internet || data.exists_in_internet;

    if (existe) {
      let fuentesHtml = '';
      if (data.fuentes && data.fuentes.length > 0) {
        fuentesHtml = '\n\n<b>🔗 URLs encontradas:</b>\n' + 
          data.fuentes.map(u => `<a href="${u}" target="_blank" style="color:#38bdf8;text-decoration:underline;word-break:break-all;">${u}</a>`).join('\n');
      } else if (data.url_busqueda) {
        fuentesHtml = `\n\n<b>🔗 Enlace de búsqueda:</b>\n<a href="${data.url_busqueda}" target="_blank" style="color:#38bdf8;text-decoration:underline;word-break:break-all;">Ver en Google Lens / Imágenes</a>`;
      }

      await showCustomAlert(
        'Imagen Encontrada en Internet',
        `✓ La imagen (${ih.id}) SÍ existe en Internet.\n\n- ${data.detalles || 'Conservada e identificada en la web.'}${fuentesHtml}`,
        '<i class="fa-solid fa-globe"></i>',
        '#38bdf8'
      );
    } else {
      if (autoBorrar) {
        await handleImageAction('borrar', null, ih);
        await showCustomAlert(
          'Imagen Borrada Automáticamente',
          `✕ La imagen (${ih.id}) NO fue encontrada en Internet.\n\n- Eliminada del resultado porque la opción Internet está ACTIVA.`,
          '<i class="fa-solid fa-trash-can"></i>',
          '#ef4444'
        );
      } else {
        await showCustomAlert(
          'Imagen NO Encontrada en Internet',
          `ℹ La imagen (${ih.id}) NO fue encontrada en Internet.\n\n- NO se borra porque la opción Internet está DESACTIVADA.`,
          '<i class="fa-solid fa-circle-info"></i>',
          '#f59e0b'
        );
        if (typeof refreshRightIframe === 'function') refreshRightIframe();
      }
    }
  } catch (err) {
    hideBlocker();
    console.error('Error al comprobar imagen:', err);
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
