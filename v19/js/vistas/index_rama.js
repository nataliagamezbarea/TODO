async function iniciarVistaInicio() {
  const selector = document.getElementById("selector-rama");
  const botonDescarga = document.getElementById("btn-descargar-rama-selector");
  const botonVisor = document.getElementById("btn-visor-rama-selector");
  if (!selector) return;

  // Los eventos se registran una sola vez. La carga de ramas sí se
  // puede repetir después de obtener la configuración de GitHub.
  if (selector.dataset.inicializado !== "1") {
    selector.dataset.inicializado = "1";
    configurarBotonVisor(selector, botonVisor);
    configurarBotonDescarga(selector, botonDescarga);
    selector.addEventListener("change", () => cambiarRamaDesdeSelector(selector));
  }

  actualizarBotonesSelector(selector, botonDescarga, botonVisor);

  try {
    if (window.Permisos?.asegurarSesion) await window.Permisos.asegurarSesion();
    await cargarRamasSelector(selector);
  } catch (error) {
    console.error("Error inicializando el selector:", error);
  }

  actualizarBotonesSelector(selector, botonDescarga, botonVisor);
}
function configurarBotonDescarga(selector, boton) {
  if (!boton) return;
  boton.addEventListener("click", async evento => {
    evento.preventDefault();
    const rama = obtenerRamaSeleccionada(selector);
    const ramas = rama ? [rama] : Array.from(selector.options)
      .map(opcion => opcion.value)
      .filter(valor => valor && valor !== "__ALL_BRANCHES__");
    if (!window.recogerUrlsMaterial || !window.descargarTodosArchivos || !ramas.length) return;
    boton.disabled = true;
    try {
      const archivos = [];
      for (const ramaActual of ramas) {
        const urls = await window.recogerUrlsMaterial({ rama: ramaActual });
        urls.forEach(archivo => archivos.push({ ...archivo, carpeta: ramaActual }));
      }
      await window.descargarTodosArchivos(archivos, null, {
        nombreZip: rama ? `${rama.replace(/[^a-z0-9_-]+/gi, "_")}.zip` : "todas_las_ramas.zip"
      });
    } catch (error) {
      console.error("No se pudo descargar:", error);
    } finally {
      boton.disabled = false;
    }
  });
}

function cambiarRamaDesdeSelector(selector) {
  const rama = obtenerRamaSeleccionada(selector);
  if (!rama) {
    actualizarBotonesSelector(selector,
      document.getElementById("btn-descargar-rama-selector"),
      document.getElementById("btn-visor-rama-selector"));
    return;
  }
  RamaActual.guardar(rama);
  window.Estado?.guardar?.("rama", rama);
  if (window.AppViews?.mostrar) {
    window.AppViews.mostrar("clase", { rama });
    return;
  }
}

window.inicializarVistaInicio = iniciarVistaInicio;
