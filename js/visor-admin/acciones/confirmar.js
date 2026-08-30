/* CONFIRMACION DE ITEM (SUBIR GITHUB / DEJAR ORIGINAL) Y QUITAR AÑADIDO MANUAL (< 90 lineas) */

function _marcarBotonDejarOriginal(activo) {
  const btn = document.getElementById('btnDejarOriginal');
  const txt = document.getElementById('btnDejarOriginalTexto');
  if (!btn) return;
  btn.classList.toggle('marcado-original', !!activo);
  if (txt) {
    txt.innerHTML = activo
      ? 'Dejar Editado <i class="fa-solid fa-check" style="margin-left:4px"></i>'
      : 'Dejar Original';
  }
  btn.title = activo
    ? 'Volver al modo editado sin subir todavía a GitHub'
    : 'Mantener el archivo en modo original';
}


/**
 * Acción de los botones de la cabecera del visor:
 *  - confirmItem(true, true)  -> Aceptar cambios y subirlos a GitHub.
 *  - confirmItem(false)       -> Dejar el archivo original (revierte TODO
 *                                 lo hecho sobre este archivo: checks,
 *                                 nombres, colegio, enunciados y el propio
 *                                 PDF físico) y lo marca con un check.
 * En ambos casos, al terminar, se pasa automáticamente al siguiente archivo.
 */
async function confirmItem(aceptar, subirGithub) {
  if (window.__accionEnCurso) return;
  window.__accionEnCurso = true;
  const liberar = () => { window.__accionEnCurso = false; };
  const it = ITEMS[POS];
  if (!it) { liberar(); return; }

  /*
   * IMPORTANTE:
   * - "Dejar Original" SOLO cambia el estado. No restaura ni borra nada.
   * - Si ya está en Original, "Dejar Editado" recupera la lógica anterior
   *   SOLO para volver a aplicar las modificaciones del archivo (incluida
   *   la eliminación de Nombre/Colegio-Logo). No sube a GitHub.
   */
  if (!aceptar && it.decision === 'original') {
    showBlocker('Dejando el archivo editado...');
    try {
      const res = await fetch('/api/apply_single_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad),
          archivo: it.archivo,
          subir_github: false
        })
      });
      const data = await res.json();

      if (!data.ok) {
        hideBlocker();
        if (typeof showCustomAlert === 'function') {
          await showCustomAlert(
            'No se pudo dejar editado',
            data.msg || 'Ha ocurrido un error al aplicar las modificaciones.',
            '<i class="fa-solid fa-triangle-exclamation"></i>',
            '#ef4444'
          );
        }
        liberar();
        return;
      }

      it.decision = 'applied';
      _marcarBotonDejarOriginal(false);

      await fetch('/api/set_decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad),
          archivo: it.archivo,
          decision: 'applied'
        })
      });

      if (typeof load === 'function') await load();
      hideBlocker();

      // NO avanzar de archivo: permite comprobar inmediatamente
      // que Nombre y Colegio/Logo se han eliminado correctamente.
      if (typeof openPos === 'function') {
        await openPos(POS);
      } else if (typeof refreshRightIframe === 'function') {
        refreshRightIframe();
      }
      liberar();
    } catch (err) {
      hideBlocker();
      console.error('Error al dejar el archivo editado:', err);
      liberar();
    }
    return;
  }

  if (!aceptar) {
    /*
     * "Dejar Original" NO toca el PDF ni las modificaciones.
     * Solo cambia el estado visual/persistente a Original.
     */
    try {
      it.decision = 'original';
      _marcarBotonDejarOriginal(true);

      await fetch('/api/set_decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad),
          archivo: it.archivo,
          decision: 'original'
        })
      });

      if (typeof load === 'function') await load();
      if (typeof openPos === 'function') await openPos(POS);
      liberar();
    } catch (err) {
      console.error('Error al marcar el archivo como original:', err);
      liberar();
    }
    return;
  }

  /*
   * Un archivo marcado como Original no se sube accidentalmente.
   * Primero hay que pulsar "Dejar Editado".
   */
  if (it.decision === 'original') {
    if (typeof showCustomAlert === 'function') {
      await showCustomAlert(
        'Archivo marcado como Original',
        'Este archivo está marcado como ORIGINAL y no se subirá a GitHub. Pulsa "Dejar Editado" para volver al modo editado.',
        '<i class="fa-solid fa-check"></i>',
        '#f59e0b'
      );
    }
    liberar();
    return;
  }

  showBlocker(subirGithub ? 'Aplicando cambios y subiendo a GitHub...' : 'Aplicando cambios...');
  try {
    const res = await fetch('/api/apply_single_file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: (it?._rama || grad),
        archivo: it.archivo,
        subir_github: !!subirGithub
      })
    });
    const data = await res.json();
    hideBlocker();

    if (!data.ok) {
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert(
          'No se pudo aplicar',
          data.msg || 'Ha ocurrido un error al aplicar los cambios.',
          '<i class="fa-solid fa-triangle-exclamation"></i>',
          '#ef4444'
        );
      }
      liberar();
      return;
    }

    it.decision = 'applied';
    _marcarBotonDejarOriginal(false);

    await fetch('/api/set_decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: (it?._rama || grad),
        archivo: it.archivo,
        decision: 'applied'
      })
    });

    nav(1);
    liberar();
  } catch (err) {
    hideBlocker();
    console.error('Error al confirmar el archivo:', err);
    liberar();
  }
}

/**
 * Quita SOLO lo que el usuario ha añadido manualmente con "Añadir"/"Crear"
 * (recuadros de nombre/colegio dibujados a mano, el punto de reflujo manual
 * y los enunciados creados con "Crear"). No toca nada que ya viniera
 * detectado por defecto en el JSON predeterminado.
 */
async function quitarAñadidoManual() {
  if (window.__accionEnCurso) return;
  window.__accionEnCurso = true;
  const it = ITEMS[POS];
  if (!it) { window.__accionEnCurso = false; return; }
  const ok = (typeof showCustomConfirm === 'function')
    ? await showCustomConfirm('¿Quitar lo añadido manualmente?', 'Se eliminarán solo los recuadros y enunciados que has creado tú a mano. Lo detectado por defecto no se toca.', '<i class="fa-solid fa-eraser"></i>', '#f59e0b')
    : true;
  if (!ok) { window.__accionEnCurso = false; return; }

  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);
  showBlocker('Quitando lo añadido manualmente...');
  try {
    await fetch('/api/quitar_manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo })
    });
    if (typeof load === 'function') await load();
    hideBlocker();
    refreshRightIframe();
    window.__accionEnCurso = false;
  } catch (err) {
    hideBlocker();
    console.error('Error al quitar lo añadido manual:', err);
    window.__accionEnCurso = false;
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
