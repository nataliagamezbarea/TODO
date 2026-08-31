async function inicializarVistaClase() {
  const urlRama = new URLSearchParams(
    window.location.search
  ).get("rama");

  const rama =
    urlRama ||
    (window.Estado
      ? window.Estado.obtener("rama")
      : "") ||
    (window.RamaActual
      ? window.RamaActual.obtener()
      : "");

  if (!rama) {
    const lista =
      document.getElementById("lista-asignaturas");

    if (lista) {
      lista.innerHTML =
        '<p id="sin-rama">Selecciona una rama.</p>';
    }

    return;
  }

  if (urlRama) {
    window.RamaActual?.guardar(urlRama);
    window.Estado?.guardar("rama", urlRama);
  }

  if (window.InformacionGrado) {
    await window.InformacionGrado.pintar(
      rama,
      "lista-asignaturas"
    );
  } else {
    console.error(
      "[Clase] InformacionGrado todavía no está cargado."
    );
  }
}

window.inicializarVistaClase =
  inicializarVistaClase;

/*
 * Esta vista también se carga dinámicamente mediante
 * cargador-vistas.js. En ese caso DOMContentLoaded ya
 * ocurrió, por lo que hay que inicializarla inmediatamente.
 */
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    inicializarVistaClase,
    { once: true }
  );
} else {
  inicializarVistaClase();
}
