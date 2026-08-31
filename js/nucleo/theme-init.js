(function(){
  // Aplica el tema (modo claro/oscuro) lo antes posible y sincroniza cambios entre pestañas.
  try {
    const apply = () => {
      try {
        const oscuro = (localStorage.getItem('modo_oscuro') === 'true');
        document.documentElement.classList.toggle('modo-oscuro', oscuro);
      } catch (e) {}
    };
    apply();

    // Escuchar cambios desde otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'modo_oscuro') apply();
    });

    // Exponer atajo para alternar desde consola o código externo
    window.__alternarModoOscuro = () => {
      try {
        const nuevo = !(document.documentElement.classList.contains('modo-oscuro'));
        localStorage.setItem('modo_oscuro', String(nuevo));
        apply();
        window.dispatchEvent(new CustomEvent('modo-oscuro-cambiado', { detail: { activo: nuevo } }));
      } catch (e) {}
    };
  } catch (e) {}
})();
