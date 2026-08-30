/* SCROLL SINCRONIZADO Y AUTO-FIT (< 80 lineas) */

let _syncScrollSuspend = 0;
let _restauracionVisoresPendiente = null;

function initSynchronizedScrolling() {
  const left = document.getElementById('viewerOld');
  const right = document.getElementById('viewerNew');
  if (!left || !right) return;

  const sync = (source, target) => {
    if (_syncScrollSuspend > 0) return;
    const maxSource = source.scrollHeight - source.clientHeight;
    const maxTarget = target.scrollHeight - target.clientHeight;
    if (maxSource <= 0 || maxTarget <= 0) return;
    const pct = source.scrollTop / maxSource;
    _syncScrollSuspend++;
    target.scrollTop = pct * maxTarget;
    setTimeout(() => { if (_syncScrollSuspend > 0) _syncScrollSuspend--; }, 40);
  };

  left.onscroll = () => sync(left, right);
  right.onscroll = () => sync(right, left);
}

let _resizeReloadTimer = null;

function initResizeAutoFit() {
  window.onresize = () => {
    const vOld = document.getElementById('viewerOld');
    const vNew = document.getElementById('viewerNew');
    if (!vOld || !vNew) return;
    const anchoDisp = Math.max(280, vOld.clientWidth - 32);
    document.querySelectorAll('.doc-page').forEach(page => {
      page.style.width = anchoDisp + 'px';
    });

    // El canvas de cada página se renderiza a una resolución fija en el
    // momento de cargarlo; el CSS lo estira a 100% del contenedor, así que
    // si la ventana se hace más grande se ve borroso (pixelado). Para que
    // se vea nítido, cuando el usuario termina de redimensionar (tras 450ms
    // sin más eventos de resize) se recarga el visor para volver a
    // renderizar los canvas a la resolución correcta.
    clearTimeout(_resizeReloadTimer);
    _resizeReloadTimer = setTimeout(() => {
      const ov = document.getElementById('ov');
      if (ov && ov.classList.contains('on') && typeof openPos === 'function' && typeof POS !== 'undefined') {
        openPos(POS);
      }
    }, 450);
  };
}

function capturarPosicionVisores() {
  const left = document.getElementById('viewerOld');
  const right = document.getElementById('viewerNew');
  return {
    leftTop: left ? left.scrollTop : 0,
    rightTop: right ? right.scrollTop : 0
  };
}

function pedirRestauracionVisores(pos) {
  _restauracionVisoresPendiente = pos;
}

function consumirRestauracionVisor(containerId) {
  if (!_restauracionVisoresPendiente) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  if (containerId === 'viewerOld') el.scrollTop = _restauracionVisoresPendiente.leftTop || 0;
  if (containerId === 'viewerNew') el.scrollTop = _restauracionVisoresPendiente.rightTop || 0;
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
