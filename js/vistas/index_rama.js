function iniciarSelectorRama() {
  if (window.__selectorRamaInicializado) {
    return;
  }

  const selector = document.getElementById("selector-rama");
  const botonDescarga = document.getElementById(
    "btn-descargar-rama-selector"
  );
  const botonVisor = document.getElementById(
    "btn-visor-rama-selector"
  );

  if (!selector) {
    return;
  }

  window.__selectorRamaInicializado = true;

  configurarBotonVisor(selector, botonVisor);
  configurarBotonDescarga(selector, botonDescarga);

  selector.addEventListener("change", () => {
    cambiarRamaDesdeSelector(selector);
  });

  actualizarBotonesSelector(
    selector,
    botonDescarga,
    botonVisor
  );

  cargarRamasSelector(selector)
    .then(() => {
      actualizarBotonesSelector(
        selector,
        botonDescarga,
        botonVisor
      );
    })
    .catch((error) => {
      console.error(
        "[Ramas] Error inicializando el selector:",
        error
      );

      actualizarBotonesSelector(
        selector,
        botonDescarga,
        botonVisor
      );
    });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarSelectorRama,
    { once: true }
  );
} else {
  iniciarSelectorRama();
}
