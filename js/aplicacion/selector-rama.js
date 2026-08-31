window.__routerVistasActivo = false;

async function iniciarSelectorRama() {
  const selector = document.getElementById("selector-rama");

  if (!selector) {
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

  // No bloqueamos la entrada a la pantalla mientras Supabase termina de
  // cargar perfil/configuración. El selector ya es visible y las ramas se
  // rellenan en cuanto la sesión/configuración estén disponibles.
  selector.innerHTML = '<option value="">CARGANDO RAMAS...</option>';
  (async () => {
    try {
      if (window.Permisos?.asegurarSesion) {
        await window.Permisos.asegurarSesion();
      }
      await cargarRamasSelector(selector);
    } catch (error) {
      selector.innerHTML = '<option value="">SELECCIONAR</option>';
    }
    actualizarBotonesSelector(selector, botonDescarga, botonVisor);
  })();

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
    } finally {
      boton.disabled = false;
    }
  });
}

function cambiarRamaDesdeSelector(selector) {
  const rama = obtenerRamaSeleccionada(selector);

  if (!rama) {
    try { sessionStorage.setItem("forzar_selector_rama", "1"); } catch (_) {}
    try { window.RamaActual?.limpiar?.(); } catch (_) { try { window.RamaActual?.guardar?.(""); } catch (_) {} }
    try { window.Estado?.guardar?.("rama", ""); } catch (_) {}
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

  try { sessionStorage.removeItem("forzar_selector_rama"); } catch (_) {}
  window.RamaActual?.guardar(rama);
  window.Estado?.guardar?.("rama", rama);
  if (window.AppViews?.mostrar) {
    window.AppViews.mostrar("clase", { rama });
    return;
  }
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
