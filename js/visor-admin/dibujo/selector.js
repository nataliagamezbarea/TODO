/* SELECTOR DE MODO DIBUJO (< 60 lineas) */

let isDrawingMode = false;
let modoAnadirTipo = 'enunciado';

function _hayImagenesBorradasOInternet(it) {
  if (!it) return false;
  if (it.inc_internet === true) return true;
  const cbNet = document.getElementById('cbBorrarImgInternet');
  if (cbNet && cbNet.checked) return true;
  if (it.acciones_imagenes && typeof it.acciones_imagenes === 'object') {
    return Object.values(it.acciones_imagenes).some(acc => {
      if (typeof acc === 'string') return acc === 'borrar';
      if (acc && typeof acc === 'object') return acc.accion === 'borrar';
      return false;
    });
  }
  return false;
}

function abrirSelectorAnadir() {
  if (typeof closeEnunciadoPopup === 'function') closeEnunciadoPopup();
  if (typeof closeNombrePopup === 'function') closeNombrePopup();
  if (typeof closeColegioPopup === 'function') closeColegioPopup();
  const m = document.getElementById('modalAnadirTipo');
  const btnRef = document.getElementById('btnAnadirReflujo');
  if (btnRef) btnRef.style.display = 'inline-flex';
  if (m) m.style.display = 'flex';
}

function cerrarSelectorAnadir() {
  const m = document.getElementById('modalAnadirTipo');
  if (m) m.style.display = 'none';
}

function elegirTipoAnadir(tipo) {
  modoAnadirTipo = (tipo === 'nombre' || tipo === 'colegio' || tipo === 'reflujo') ? tipo : 'enunciado';
  cerrarSelectorAnadir();
  const mensajes = {
    enunciado: 'Sustituir Enunciado: dibuja el recuadro sobre el texto a sustituir.',
    nombre: 'Borrar Nombre: dibuja el recuadro sobre el nombre a eliminar.',
    colegio: 'Borrar Colegio/Logo: dibuja el recuadro sobre el colegio o logo a eliminar.',
    reflujo: 'Subir si hay Imágenes: dibuja el recuadro en la página y posición exacta donde debe empezar a subir el contenido.'
  };
  const txt = document.getElementById('editorBoxTexto');
  if (txt) txt.textContent = mensajes[modoAnadirTipo] || 'Selecciona la zona dibujando un recuadro.';
  toggleEditor(true);
}

function limpiarRecuadrosDibujoSobrantes() {
  document.querySelectorAll('.draw-box').forEach(el => el.remove());
}

function toggleEditor(force) {
  const vOld = document.getElementById('viewerOld');
  const editorBox = document.getElementById('editorBox');
  if (force === false) {
    isDrawingMode = false;
    modoAnadirTipo = 'enunciado';
    if (vOld) { vOld.style.cursor = 'default'; vOld.classList.remove('drawing-active'); }
    if (editorBox) editorBox.classList.remove('on');
    limpiarRecuadrosDibujoSobrantes();
    return;
  }
  isDrawingMode = true;
  if (vOld) { vOld.style.cursor = 'crosshair'; vOld.classList.add('drawing-active'); }
  if (editorBox) editorBox.classList.add('on');
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
