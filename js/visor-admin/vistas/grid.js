/* SCROLL INFINITO Y GRID PROGRESIVO (< 60 lineas) */

function cargarMiniatura(el, it) {
  const ramaItem = it._rama || grad;
  const url = it.archivo ? `/api/thumb/${encodeURIComponent(ramaItem)}?archivo=${encodeURIComponent(it.archivo)}` : (it.idx !== undefined ? `/api/thumb/${grad}/${it.idx}` : '');
  if (!url) return;
  const img = el.querySelector('img');
  if (!img) return;
  fetch(url)
    .then(r => (r.ok ? r.blob() : Promise.reject(new Error('HTTP ' + r.status))))
    .then(blob => {
      const objUrl = URL.createObjectURL(blob);
      img.classList.add('loaded');
      img.classList.remove('is-loading');
      img.src = objUrl;
      img.onload = () => URL.revokeObjectURL(objUrl);
    })
    .catch(() => { img.classList.remove('is-loading'); img.src = FALLBACK_THUMB; });
}

function renderProgressiveGrid(gridEl, items, batchSize = 18) {
  let currentIndex = 0;

  function appendNextBatch() {
    const batch = items.slice(currentIndex, currentIndex + batchSize);
    batch.forEach(it => {
      const el = document.createElement('div');
      el.className = 'card' + (it.visto ? ' visited' : '');
      el.innerHTML = cardHTML(it);
      cargarMiniatura(el, it);
      el.onclick = () => {
        POS = ITEMS.findIndex(x => x.archivo === it.archivo && (x._rama || '') === (it._rama || ''));
        localStorage.setItem('last_grado', grad);
        localStorage.setItem('last_pos', POS);
        localStorage.setItem('last_open', '1');
        openOv();
      };
      gridEl.appendChild(el);
    });
    currentIndex += batch.length;
  }

  appendNextBatch();

  if (currentIndex < items.length) {
    const sentinel = document.createElement('div');
    sentinel.className = 'infinite-sentinel';
    sentinel.style.width = '100%';
    sentinel.style.height = '20px';
    sentinel.style.gridColumn = '1 / -1';
    gridEl.appendChild(sentinel);

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        sentinel.remove();
        appendNextBatch();
        if (currentIndex < items.length) {
          gridEl.appendChild(sentinel);
        } else {
          observer.disconnect();
        }
      }
    }, { rootMargin: '300px' });

    observer.observe(sentinel);
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
