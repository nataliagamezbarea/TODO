(function(){
  function aplicarTemaDOM(oscuro) {
    try {
      const activo = Boolean(oscuro);
      document.documentElement.classList.toggle('modo-oscuro', activo);
      if (document.body) document.body.classList.toggle('modo-oscuro', activo);
      document.documentElement.dataset.theme = activo ? 'dark' : 'light';
      if (document.body) document.body.dataset.theme = activo ? 'dark' : 'light';
    } catch (e) {}
  }

  function obtenerTemaActivo() {
    try {
      return document.documentElement.classList.contains('modo-oscuro') ||
        (document.body && document.body.classList.contains('modo-oscuro'));
    } catch (e) {
      return false;
    }
  }

  function leerTemaGuardado() {
    try {
      return localStorage.getItem('modo_oscuro') === 'true';
    } catch (e) {
      return false;
    }
  }

  function guardarTema(oscuro) {
    try {
      localStorage.setItem('modo_oscuro', String(Boolean(oscuro)));
    } catch (e) {}
    aplicarTemaDOM(oscuro);
    window.dispatchEvent(new CustomEvent('modo-oscuro-cambiado', { detail: { activo: Boolean(oscuro) } }));
  }

  // Aplica el tema (modo claro/oscuro) lo antes posible y sincroniza cambios entre pestañas.
  try {
    const apply = () => {
      aplicarTemaDOM(leerTemaGuardado());
    };
    apply();

    // Escuchar cambios desde otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'modo_oscuro') apply();
    });

    window.__temaOscuroActivo = () => obtenerTemaActivo();
    window.__guardarTemaOscuro = guardarTema;

    // Exponer atajo para alternar desde consola o código externo
    window.__alternarModoOscuro = () => {
      try {
        const nuevo = !obtenerTemaActivo();
        guardarTema(nuevo);
        return nuevo;
      } catch (e) {
        return false;
      }
    };
  } catch (e) {}
})();
