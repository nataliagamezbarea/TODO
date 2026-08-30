/* ACCIONES GITHUB Y FAÇADE PRINCIPAL (< 60 lineas) */

async function pushToGitHubModal() {
  const ok = await showCustomConfirm(
    '¿Enviar cambios a GitHub?',
    'Se sincronizarán las modificaciones de revision.json con el repositorio remoto de GitHub.',
    '<i class="fa-brands fa-github"></i>',
    '#38bdf8'
  );
  if (!ok) return;
  triggerFastCommitPush();
}

async function triggerFastCommitPush() {
  showBlocker('Enviando cambios a GitHub...');
  try {
    const res = await fetch('/api/github_push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: grad })
    });
    const data = await res.json();
    hideBlocker();
    if (data.ok) {
      await showCustomAlert('Sincronizado con GitHub', '✓ Los datos de revisión se han guardado en GitHub.', '<i class="fa-brands fa-github"></i>', '#10b981');
    } else {
      await showCustomAlert('Error en GitHub', data.error || 'No se pudo subir.', '<i class="fa-solid fa-triangle-exclamation"></i>', '#ef4444');
    }
  } catch (err) {
    hideBlocker();
    console.error('Error al sincronizar con GitHub:', err);
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
