window.AppRouter = (() => {
  window.__routerVistasActivo = true;
  const vistas = {
    inicio: "componentes/vistas/inicio.html",
    clase: "componentes/vistas/clase.html"
  };
  let scriptClase = null;

  function contenedor() {
    let app = document.getElementById("app-vista");
    if (app) return app;
    app = document.createElement("main");
    app.id = "app-vista";
    const selector = document.querySelector(".selector-rama");
    if (selector) selector.replaceWith(app);
    else document.body.appendChild(app);
    return app;
  }

  function cargarScriptClase() {
    if (window.inicializarVistaClase) return Promise.resolve();
    if (scriptClase) return scriptClase;
    scriptClase = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "js/vistas/clase.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("No se pudo cargar la vista de clase."));
      document.head.appendChild(script);
    });
    return scriptClase;
  }

  async function renderizar(vista, contexto = {}, guardarHistorial = true) {
    const ruta = vistas[vista];
    if (!ruta) throw new Error(`Vista no registrada: ${vista}`);
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta}`);

    contenedor().innerHTML = await respuesta.text();
    if (guardarHistorial) window.history.pushState({ vista, contexto }, "", "/");
    else window.history.replaceState({ vista, contexto }, "", "/");

    if (vista === "inicio") {
      await iniciarSelectorRama();
      return;
    }
    if (vista === "clase") {
      if (contexto.rama) {
        window.RamaActual?.guardar(contexto.rama);
        window.Estado?.guardar?.("rama", contexto.rama);
      }
      await cargarScriptClase();
      await window.inicializarVistaClase?.();
    }
  }

  function iniciar() {
    renderizar("inicio", {}, false).catch(error => console.error("No se pudo cargar la vista inicial:", error));
    document.addEventListener("click", evento => {
      const inicio = evento.target.closest("#btn-inicio");
      if (!inicio) return;
      evento.preventDefault();
      renderizar("inicio").catch(error => console.error("No se pudo volver al inicio:", error));
    });
    window.addEventListener("popstate", evento => {
      const estado = evento.state || { vista: "inicio", contexto: {} };
      renderizar(estado.vista || "inicio", estado.contexto || {}, false)
        .catch(error => console.error("No se pudo restaurar la vista:", error));
    });
  }

  return { iniciar, renderizar };
})();

document.addEventListener("DOMContentLoaded", () => window.AppRouter.iniciar(), { once: true });

async function iniciarSelectorRama() {
  const selector = document.getElementById("selector-rama");
  const botonDescarga = document.getElementById("btn-descargar-rama-selector");
  const botonVisor = document.getElementById("btn-visor-rama-selector");
  if (!selector) return;

  configurarBotonVisor(selector, botonVisor);
  configurarBotonDescarga(selector, botonDescarga);
  selector.addEventListener("change", () => cambiarRamaDesdeSelector(selector));
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
  if (window.AppRouter) {
    window.AppRouter.renderizar("clase", { rama }).catch(error => console.error("No se pudo cargar la clase:", error));
    return;
  }
  const destino = new URL("modulos/clase.html", document.baseURI);
  destino.searchParams.set("rama", rama);
  window.location.href = destino.href;
}
