window.Estado = (() => {
  const prefijo = "app_";
  const CLAVE_CONTEXTO = "app_contexto_navegacion";

  const leerContexto = () => {
    try { return JSON.parse(localStorage.getItem(CLAVE_CONTEXTO) || "{}"); } catch (_) { return {}; }
  };

  const guardarContexto = (parcial = {}) => {
    const actual = leerContexto();
    const nuevo = { ...actual };
    Object.entries(parcial).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") nuevo[k] = v;
    });
    try { localStorage.setItem(CLAVE_CONTEXTO, JSON.stringify(nuevo)); } catch (_) {}
    return nuevo;
  };

  const obtener = (clave, valorPorDefecto = "") => {
    const ctx = leerContexto();
    if (ctx[clave] !== undefined && ctx[clave] !== "") return ctx[clave];
    try {
      const guardado = localStorage.getItem(prefijo + clave);
      return guardado !== null && guardado !== "" ? guardado : valorPorDefecto;
    } catch (_) { return valorPorDefecto; }
  };

  const guardar = (clave, valor) => {
    if (valor !== undefined && valor !== null) {
      try { localStorage.setItem(prefijo + clave, valor); } catch (_) {}
      guardarContexto({ [clave]: valor });
    }
  };

  const navegar = (ruta, contexto = {}) => {
    guardarContexto(contexto);
    window.AppRouter?.navegar(ruta, { contexto }) ?? (window.location.href = ruta);
  };

  const limpiarUrlVisible = () => {
    const params = new URLSearchParams(window.location.search);
    let hayParams = false;
    const contexto = {};
    for (const [k, v] of params.entries()) {
      if (v !== "") contexto[k] = v;
      hayParams = true;
    }
    if (hayParams) guardarContexto(contexto);
    if (hayParams && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  limpiarUrlVisible();

  return { obtener, guardar, guardarContexto, leerContexto, navegar, limpiarUrlVisible };
})();
