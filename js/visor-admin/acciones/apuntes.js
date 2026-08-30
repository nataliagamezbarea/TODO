/* GESTION DE APUNTES LATEX (< 85 lineas) */

function updateApunteButton(it) {
  const btn = document.getElementById('btnActionApunte');
  if (!btn) return;
  btn.classList.toggle('active-apunte', !!it.inc_apunte);
}

function updateApunteName(val) {
  const it = ITEMS[POS];
  if (!it) return;
  it.nombre_apunte = (val || '').trim();
  guardarCheckEnServidor('nombre_apunte', it.nombre_apunte);
}

async function setApunte(val) {
  const it = ITEMS[POS];
  if (!it) return;
  const nuevoVal = (val !== undefined) ? val : !it.inc_apunte;
  const cb = document.getElementById('cbApunte');

  // Al DESMARCAR el check Apunte: confirmar y limpiar desde/contra GitHub.
  if (!nuevoVal && it.inc_apunte) {
    const nombre = (typeof it.nombre_apunte === 'string' && it.nombre_apunte.trim())
      ? it.nombre_apunte.trim()
      : 'APUNTE_' + osBaseName(it.archivo).replace(/\.pdf$/i, '');
    const confirmado = await solicitarEliminacionApunte(nombre);
    if (!confirmado) {
      if (cb) cb.checked = true;
      updateApunteButton(it);
      return;
    }
    showBlocker('Eliminando apunte en GitHub...');
    try {
      const res = await fetch('/api/eliminar_apunte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo, nombre_apunte: nombre, borrar_pdfs: true })
      });
      const data = await res.json();
      hideBlocker();
      if (!data.ok) {
        if (typeof showCustomAlert === 'function') {
          await showCustomAlert('Error al Eliminar Apunte', 'No se pudo eliminar: ' + (data.error || data.msg || 'Fallo en GitHub.'), '<i class="fa-solid fa-triangle-exclamation"></i>', '#ef4444');
        }
        if (cb) cb.checked = true;
        return;
      }
    } catch (err) {
      hideBlocker();
      console.error('Error eliminando apunte:', err);
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert('Error al Eliminar Apunte', 'Falló la conexión con el servidor: ' + (err && err.message ? err.message : 'no se pudo comunicar con el servidor.'), '<i class="fa-solid fa-triangle-exclamation"></i>', '#ef4444');
      }
      if (cb) cb.checked = true;
      return;
    }
  }

  it.inc_apunte = nuevoVal;
  const origE = DATA[grad].entries.find(x => x.archivo === it.archivo);
  if (origE) origE.inc_apunte = nuevoVal;
  const origN = DATA[grad].no_cambian.find(x => x.archivo === it.archivo);
  if (origN) origN.inc_apunte = nuevoVal;

  if (cb) cb.checked = nuevoVal;
  updateApunteButton(it);
  guardarCheckEnServidor('apunte', nuevoVal);

  const apunteBar = document.getElementById('apunteBar');
  const inputName = document.getElementById('inputApunteName');
  if (apunteBar) {
    apunteBar.style.display = nuevoVal ? 'flex' : 'none';
    if (nuevoVal && inputName && !inputName.value) {
      inputName.value = it.nombre_apunte || ('APUNTE_' + osBaseName(it.archivo).replace(/\.pdf$/i, ''));
    }
  }
  if (typeof renderStats === 'function') renderStats();
}

function solicitarEliminacionApunte(nombre) {
  return showCustomConfirm(
    '¿Desactivar el Apunte?',
    `El apunte <b style="color:#34d399">${nombre}</b> se quitará del visor. Se borrará su PDF de la rama del grado y se quitará del historial de GitHub (además de limpiar el residual .tex/.txt). ¿Continuar?`,
    '<i class="fa-solid fa-trash-can"></i>',
    '#ef4444'
  );
}

function saveApunteName() {
  const it = ITEMS[POS];
  const inp = document.getElementById('inputApunteName');
  if (!it || !inp) return;
  it.nombre_apunte = inp.value.trim();
  guardarCheckEnServidor('nombre_apunte', it.nombre_apunte);
}

async function confirmGenerateApunteLatex() {
  const it = ITEMS[POS];
  if (!it) return;
  saveApunteName();
  const nombre = it.nombre_apunte || document.getElementById('inputApunteName')?.value || '';
  showBlocker('Generando código LaTeX y lanzando compilación...');
  try {
    const res = await fetch('/api/compilar_apunte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: (it?._rama || grad), archivo: it.archivo, nombre_apunte: nombre })
    });
    const data = await res.json();
    hideBlocker();
    if (!data.ok) {
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert('Error al Generar Apunte', data.msg || 'Fallo en LaTeX.', '<i class="fa-solid fa-triangle-exclamation"></i>', '#ef4444');
      }
      return;
    }
    it.latex_compilado = true;
    // Flujo GitHub Actions: la compilación es asíncrona. Se hace polling hasta
    // que el PDF aparezca en GI/<grado>/apuntes/.
    if (data.en_proceso) {
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert('Apunte en Proceso', 'Compilando en GitHub Actions (Docker + LaTeX). Esto puede tardar hasta ~1 min. Se actualizará automáticamente al terminar.', '<i class="fa-solid fa-spinner fa-spin"></i>', '#3b82f6');
      }
      esperarPdfCompilado(grad, nombre, it);
      return;
    }
    if (typeof showCustomAlert === 'function') {
      await showCustomAlert('Apunte Creado', `✓ Apunte compilado: ${nombre}`, '<i class="fa-solid fa-book"></i>', '#10b981');
    }
    if (typeof openPos === 'function') openPos(POS);
  } catch (err) {
    hideBlocker();
    console.error('Error generando apunte:', err);
  }
}

function esperarPdfCompilado(grado, nombre, it, reintentos = 0) {
  const maxIntentos = typeof reintentos === 'number' ? reintentos : 0;
  const url = `/api/estado_compilacion?grado=${encodeURIComponent(grado)}&nombre_apunte=${encodeURIComponent(nombre)}`;
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.listo) {
        if (typeof showCustomAlert === 'function') {
          showCustomAlert('Apunte Creado', `✓ Apunte compilado: ${nombre}`, '<i class="fa-solid fa-book"></i>', '#10b981');
        }
        if (typeof openPos === 'function') openPos(POS);
      } else if (maxIntentos >= 36) {
        if (typeof showCustomAlert === 'function') {
          showCustomAlert('Compilación en curso', 'Todavía se está compilando. Recarga la página en un momento.', '<i class="fa-solid fa-hourglass-half"></i>', '#f59e0b');
        }
      } else {
        setTimeout(() => esperarPdfCompilado(grado, nombre, it, maxIntentos + 1), 5000);
      }
    })
    .catch(() => {
      if (maxIntentos < 36) {
        setTimeout(() => esperarPdfCompilado(grado, nombre, it, maxIntentos + 1), 5000);
      }
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
