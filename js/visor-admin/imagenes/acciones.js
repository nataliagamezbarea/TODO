/* ACCIONES Y SUBIDA DE IMAGENES (< 90 lineas) */

async function handleImageAction(act, extra, targetIh) {
  const ih = targetIh || selectedImageIh;
  if (!ih) return;
  const it = ITEMS[POS];
  closeImgPopup();
  showBlocker(act === 'borrar' && extra && extra.global
    ? 'Guardando borrado de imagen (también en otros PDFs)...'
    : 'Guardando acción sobre imagen...');
  try {
    await fetch('/api/image_action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: (it?._rama || grad),
        archivo: it.archivo,
        img_id: ih.id,
        accion: act,
        ruta: (extra && extra.ruta) ? extra.ruta : '',
        cita: (extra && extra.cita) ? extra.cita : '',
        global: !!(extra && extra.global),
        page_num: ih.page_num,
        img_idx: ih.img_idx
      })
    });
    hideBlocker();
    if (act === 'borrar' && extra && extra.global) {
      await showCustomAlert('Imagen Registrada Globalmente', '✓ Se borrará POR DEFECTO en todos los PDFs donde aparezca igual.', '<i class="fa-solid fa-trash-arrow-up"></i>', '#dc2626');
    } else if (act === 'conservar' && extra && extra.global) {
      await showCustomAlert('Imagen Protegida Globalmente', '✓ Se CONSERVARÁ en todos los PDFs donde aparezca igual.', '<i class="fa-solid fa-shield-halved"></i>', '#059669');
    }
    if (typeof syncInternetCheckboxes === 'function') syncInternetCheckboxes();
    if (typeof refreshRightIframe === 'function') refreshRightIframe();
    openPos(POS);
  } catch (e) {
    hideBlocker();
    console.error('Error al guardar acción sobre imagen:', e);
  }
}

function triggerUploadImage() {
  const inp = document.getElementById('inputImageFile');
  if (inp) { inp.value = ''; inp.click(); }
}

function uploadImageFile(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0], ih = selectedImageIh;
  if (!ih) return;
  const it = ITEMS[POS];

  showBlocker('Subiendo imagen de reemplazo...');
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const res = await fetch('/api/upload_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad), archivo: it.archivo, img_id: ih.id,
          nombre_imagen: file.name, datos_base64: e.target.result
        })
      });
      const data = await res.json();
      hideBlocker();
      if (data.ok) handleImageAction('reemplazar', { ruta: data.ruta }, ih);
    } catch (err) {
      hideBlocker();
      console.error('Error al subir imagen:', err);
    }
  };
  reader.readAsDataURL(file);
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
