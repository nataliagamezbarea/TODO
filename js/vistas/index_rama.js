document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("selector-rama");
  const btnDesc = document.getElementById("btn-descargar-rama-selector");
  const btnVisor = document.getElementById("btn-visor-rama-selector");
  if (!select) return;

  if (window.Permisos && typeof window.Permisos.asegurarSesion === "function") {
    try { await window.Permisos.asegurarSesion(); } catch (_) {}
  }

  await RamaActual.poblarSelector(select);

  // "SELECCIONAR" significa TODAS LAS RAMAS. No existe una opción adicional.
  const todasLasRamas = () => Array.from(select.options)
    .map(o => String(o.value || "").trim())
    .filter(r => r && r !== "__cargando__");

  const ramaSeleccionada = () => String(select.value || "").trim();

  const actualizarBotonesSelector = () => {
    const cfg = window.Ajustes ? window.Ajustes.obtener() : {};
    const esAdmin = !!(window.Permisos && window.Permisos.esAdmin);
    const rama = ramaSeleccionada();
    const todas = !rama;
    const cantidad = todasLasRamas().length;

    if (btnDesc) {
      const visible = esAdmin && cfg.descargasEnSelectorRamas !== false;
      btnDesc.style.display = visible ? "inline-flex" : "none";
      btnDesc.disabled = cantidad === 0;
      btnDesc.title = todas ? `Descargar todas las ramas (${cantidad})` : `Descargar ${rama}`;
      btnDesc.setAttribute("aria-label", btnDesc.title);
    }

    if (btnVisor) {
      const visible = esAdmin && cfg.visorActivo !== false && cfg.visorEnSelectorRamas !== false;
      btnVisor.style.display = visible ? "inline-flex" : "none";
      btnVisor.disabled = cantidad === 0;
      btnVisor.title = todas ? `Abrir Visor Admin: todas las ramas (${cantidad})` : `Abrir Visor Admin: ${rama}`;
      btnVisor.setAttribute("aria-label", btnVisor.title);
    }
  };

  if (btnDesc) {
    btnDesc.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      const rama = ramaSeleccionada();
      const ramas = rama ? [rama] : todasLasRamas();
      if (!ramas.length || !window.recogerUrlsMaterial || !window.descargarTodosArchivos) return;

      btnDesc.disabled = true;
      btnDesc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      try {
        const acumuladas = [];
        for (const r of ramas) {
          const urls = await window.recogerUrlsMaterial({ rama: r });
          urls.forEach(x => acumuladas.push({ ...x, carpeta: [r, x.carpeta || ""].filter(Boolean).join("/") }));
        }
        await window.descargarTodosArchivos(acumuladas, null, {
          nombreZip: rama ? `${String(rama).replace(/[^a-z0-9_-]+/gi, "_")}.zip` : "todas_las_ramas.zip"
        });
        btnDesc.innerHTML = '<i class="fa-solid fa-check icono-exito"></i>';
      } catch (_) {
        btnDesc.innerHTML = '<i class="fa-solid fa-circle-xmark icono-error"></i>';
      }
      setTimeout(() => {
        btnDesc.innerHTML = '<i class="fa-solid fa-download"></i>';
        actualizarBotonesSelector();
      }, 1800);
    });
  }

  if (btnVisor) {
    btnVisor.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const rama = ramaSeleccionada();
      if (typeof window.abrirVisorAdminIntegrado !== "function") return;
      // Sin selección = TODAS las ramas.
      window.abrirVisorAdminIntegrado({ rama: rama || "", todas: !rama });
    });
  }

  // Al seleccionar una rama concreta, ENTRAMOS en esa rama.
  // El index sigue mostrando únicamente el selector y los dos botones;
  // no vuelve a crear ningún listado de clases aquí.
  // SELECCIONAR (valor vacío) no navega: significa TODAS para Descargar/Visor.
  select.addEventListener("change", () => {
    const rama = ramaSeleccionada();
    if (!rama) {
      try {
        localStorage.removeItem("last_grado");
        localStorage.removeItem("rama_actual");
      } catch (_) {}
      if (window.Estado && typeof window.Estado.guardar === "function") {
        try { window.Estado.guardar("rama", ""); } catch (_) {}
      }
      actualizarBotonesSelector();
      return;
    }

    RamaActual.guardar(rama);
    if (window.Estado && typeof window.Estado.guardar === "function") {
      try { window.Estado.guardar("rama", rama); } catch (_) {}
    }

    // Ir directamente a la vista de la rama seleccionada.
    // Usamos URL relativa al documento actual para que funcione también
    // si la web está publicada dentro de un subdirectorio.
    const destino = new URL("modulos/clase.html", document.baseURI);
    destino.searchParams.set("rama", rama);
    window.location.assign(destino.href);
  });

  // Siempre arrancamos en SELECCIONAR = TODAS, aunque hubiera una rama guardada.
  // El selector SIEMPRE arranca visualmente en SELECCIONAR.
  // No reutilizamos una rama guardada para este selector: vacío significa
  // TODAS LAS RAMAS para los botones de Descargar y Visor Admin.
  select.selectedIndex = 0;
  select.value = "";
  RamaActual.guardar("");
  window.__pintarAccionesRamas = actualizarBotonesSelector;
  actualizarBotonesSelector();
  // Algunos navegadores restauran el valor anterior del <select> después de
  // completar una carga asíncrona; lo forzamos de nuevo al placeholder.
  setTimeout(() => {
    if (select) { select.selectedIndex = 0; select.value = ""; }
    actualizarBotonesSelector();
  }, 0);
});
