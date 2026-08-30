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
