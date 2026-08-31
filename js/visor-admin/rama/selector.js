/* Selector de rama del Visor: usa la misma persistencia que la aplicación principal. */
window.RamaActual = window.RamaActual || (() => {
  const KEY = 'rama_actual';
  const FORCE = 'forzar_selector_rama';
  const obtener = () => {
    try { if (sessionStorage.getItem(FORCE) === '1') return ''; } catch (_) {}
    try { return (localStorage.getItem(KEY) || '').trim(); } catch (_) { return ''; }
  };
  const guardar = (rama) => {
    const r = String(rama || '').trim();
    try {
      if (r) { localStorage.setItem(KEY, r); sessionStorage.removeItem(FORCE); }
      else localStorage.removeItem(KEY);
    } catch (_) {}
    try { window.Estado?.guardar?.('rama', r); } catch (_) {}
  };
  const limpiar = () => {
    try { localStorage.removeItem(KEY); sessionStorage.setItem(FORCE, '1'); } catch (_) {}
    try { window.Estado?.guardar?.('rama', ''); } catch (_) {}
  };
  const pintarSeleccionActual = (select) => {
    const r = obtener();
    if (!select) return r;
    if (r && !Array.from(select.options).some(o => o.value === r)) {
      const o = document.createElement('option'); o.value = r; o.textContent = r; select.appendChild(o);
    }
    select.value = r;
    return r;
  };
  const poblarSelector = async (select) => {
    if (!select) return [];
    const ramas = await (window.RamaAPI?.poblarSelector ? window.RamaAPI.poblarSelector(select) : Promise.resolve([]));
    pintarSeleccionActual(select);
    window.RamaUI?.ensureAllBranchesOption?.(select, 'TODAS LAS RAMAS');
    return ramas;
  };
  return { obtener, guardar, limpiar, pintarSeleccionActual, poblarSelector, listarRamas: () => window.RamaAPI?.listarRamas?.() || Promise.resolve([]) };
})();
