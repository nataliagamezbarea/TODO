/* APERTURA Y CIERRE DEL MODAL VISOR (< 65 lineas) */

function openOv() {
  const it = ITEMS[POS];
  if (!it) return;
  it.visto = true;
  localStorage.setItem('last_grado', grad);
  localStorage.setItem('rama_actual', grad);
  localStorage.setItem('last_pos', POS);
  localStorage.setItem('last_open', '1');
  if (it.archivo) localStorage.setItem('last_archivo', it.archivo);
  const ov = document.getElementById('ov');
  if (ov) ov.classList.add('on');
  document.documentElement.classList.add('visor-document-open');
  document.body.classList.add('visor-document-open');
  document.body.style.overflow = 'hidden';
  openPos(POS);
}


function closeOv() {
  const ov = document.getElementById('ov');
  if (ov) ov.classList.remove('on');
  document.documentElement.classList.remove('visor-document-open');
  document.body.classList.remove('visor-document-open');
  document.body.style.overflow = '';
  localStorage.setItem('last_open', '0');
  localStorage.removeItem('last_archivo');
  if (typeof render === 'function') render();
}


async function nav(dir) {
  mostrarCargandoPagina('Cargando documento...');
  let nextPos = POS + dir;
  if (nextPos < 0) nextPos = ITEMS.length - 1;
  if (nextPos >= ITEMS.length) nextPos = 0;
  POS = nextPos;
  openOv();
}

async function openPos(p) {
  POS = p;
  const it = ITEMS[POS];
  if (!it) return;
  localStorage.setItem('last_pos', POS);
  localStorage.setItem('last_open', '1');
  if (it.archivo) localStorage.setItem('last_archivo', it.archivo);

  // La posición y la rama se conservan en el estado local del visor.
  // NO se escriben en la URL: el visor debe permanecer limpio, sin
  // ?rama=... ni ?pos=... mientras se navega entre documentos.
  try {
    localStorage.setItem('visor_pos', String(POS));
    localStorage.setItem('visor_rama', String(grad || ''));
  } catch (_) {}

  const posTxt = document.getElementById('ovPosText');

  if (posTxt) posTxt.textContent = `${POS + 1} / ${ITEMS.length}`;

  const spanOrig = document.getElementById('spanOrigName');
  const spanClean = document.getElementById('spanCleanName');
  const spanArrow = document.getElementById('spanRenameArrow');
  if (spanOrig) spanOrig.textContent = it.archivo;
  if (spanClean) spanClean.textContent = (it.cambia_nombre && it.nombre_limpio) ? it.nombre_limpio : it.archivo;
  if (spanArrow) spanArrow.style.display = (it.cambia_nombre && it.nombre_limpio) ? 'inline' : 'none';


  const cbInt = document.getElementById('cbInt');
  if (cbInt) cbInt.checked = !!it.inc_interior;
  const cbCol = document.getElementById('cbCol');
  if (cbCol) cbCol.checked = !!it.inc_colegio;
  const cbApunte = document.getElementById('cbApunte');
  if (cbApunte) cbApunte.checked = !!it.inc_apunte;
  const cbInc = document.getElementById('cbInc');
  if (cbInc) cbInc.checked = (it.type === 'e') ? !!it.include : true;
  const cbRen = document.getElementById('cbRen');
  if (cbRen) cbRen.checked = (it.cambia_nombre) ? (it.inc_renombre !== false) : true;

  if (typeof syncInternetCheckboxes === 'function') syncInternetCheckboxes();
  if (typeof updateDecisionButtons === 'function') updateDecisionButtons(it);
  if (typeof updateApunteButton === 'function') updateApunteButton(it);
  if (typeof _marcarBotonDejarOriginal === 'function') _marcarBotonDejarOriginal(it.decision === 'original');

  const enc = (cbInc && cbInc.checked) ? '1' : '0';
  const int = (cbInt && cbInt.checked) ? '1' : '0';
  const col = (cbCol && cbCol.checked) ? '1' : '0';
  const net = !!it.inc_internet ? '1' : '0';

  if (typeof loadDocViewer === 'function') {
    try {
      await Promise.all([
        loadDocViewer('viewerOld', true, enc, int, col, '0'),
        loadDocViewer('viewerNew', false, enc, int, col, net)
      ]);
    } catch (e) {
      console.error('Error cargando documento:', e);
    }
  }
  setTimeout(actualizarNavegacionCambios, 100);
  if (!window.__visorCargaInicial) ocultarCargandoPagina();
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
