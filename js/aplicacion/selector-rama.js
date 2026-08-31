window.__routerVistasActivo = true;

async function iniciarSelectorRama() {
  const selector = document.getElementById("selector-rama");

  if (!selector) {
    console.warn("[Ramas] No se encontró #selector-rama.");
    return;
  }

  if (selector.dataset.inicializado === "1") {
    return;
  }

  selector.dataset.inicializado = "1";

  const botonDescarga = document.getElementById(
    "btn-descargar-rama-selector"
  );

  const botonVisor = document.getElementById(
    "btn-visor-rama-selector"
  );

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

  try {
    if (window.Permisos?.asegurarSesion) {
      await window.Permisos.asegurarSesion();
    }

    await cargarRamasSelector(selector);
  } catch (error) {
    console.error(
      "[Ramas] Error inicializando el selector:",
      error
    );
  }

  actualizarBotonesSelector(
    selector,
    botonDescarga,
    botonVisor
  );
}

function configurarBotonDescarga(selector, boton) {
  if (!boton) {
    return;
  }

  boton.addEventListener("click", async (evento) => {
    evento.preventDefault();

    const rama = obtenerRamaSeleccionada(selector);

    const ramas = rama
      ? [rama]
      : Array.from(selector.options)
          .map((opcion) => opcion.value)
          .filter(
            (valor) =>
              valor &&
              valor !== "__ALL_BRANCHES__"
          );

    if (
      !window.recogerUrlsMaterial ||
      !window.descargarTodosArchivos ||
      !ramas.length
    ) {
      return;
    }

    boton.disabled = true;

    try {
      const archivos = [];

      for (const ramaActual of ramas) {
        const urls =
          await window.recogerUrlsMaterial({
            rama: ramaActual
          });

        urls.forEach((archivo) => {
          archivos.push({
            ...archivo,
            carpeta: ramaActual
          });
        });
      }

      await window.descargarTodosArchivos(
        archivos,
        null,
        {
          nombreZip: rama
            ? `${rama.replace(
                /[^a-z0-9_-]+/gi,
                "_"
              )}.zip`
            : "todas_las_ramas.zip"
        }
      );
    } catch (error) {
      console.error(
        "[Ramas] No se pudo descargar:",
        error
      );
    } finally {
      boton.disabled = false;
    }
  });
}

function cambiarRamaDesdeSelector(selector) {
  const rama = obtenerRamaSeleccionada(selector);

  if (!rama) {
    actualizarBotonesSelector(
      selector,
      document.getElementById(
        "btn-descargar-rama-selector"
      ),
      document.getElementById(
        "btn-visor-rama-selector"
      )
    );

    return;
  }

  window.RamaActual?.guardar(rama);
  window.Estado?.guardar?.("rama", rama);
  window.NavegacionApp?.ir("clase", {
    rama
  });
}

/*
 * IMPORTANTE:
 * El archivo se carga desde vista-inicio.html.
 * Se inicializa aquí después de que el DOM exista.
 */
function arrancarSelectorRamaCuandoEsteListo() {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarSelectorRama,
      { once: true }
    );

    return;
  }

  iniciarSelectorRama();
}

arrancarSelectorRamaCuandoEsteListo();
