function obtenerRamaSeleccionada(selector) {
  const valor = String(selector.value || "").trim();
  return valor === "__ALL_BRANCHES__" ? "" : valor;
}

function actualizarBotonesSelector(selector, botonDescarga, botonVisor) {
  const cantidad = Array.from(selector.options)
    .filter(opcion => opcion.value && opcion.value !== "__ALL_BRANCHES__").length;
  const rama = obtenerRamaSeleccionada(selector);
  const ajustes = window.Ajustes?.obtener?.() || {};
  const esAdmin = !window.Permisos || window.Permisos.esAdmin !== false;

  if (botonDescarga) {
    botonDescarga.style.display = esAdmin && ajustes.descargasEnSelectorRamas !== false
      ? "inline-flex" : "none";
    botonDescarga.disabled = cantidad === 0;
    botonDescarga.title = rama ? `Descargar ${rama}` : `Descargar todas las ramas (${cantidad})`;
  }

  if (botonVisor) {
    botonVisor.style.display = esAdmin && ajustes.visorActivo !== false && ajustes.visorEnSelectorRamas !== false
      ? "inline-flex" : "none";
    botonVisor.disabled = cantidad === 0;
    botonVisor.title = rama ? `Abrir Visor Admin: ${rama}` : `Abrir Visor Admin: todas las ramas (${cantidad})`;
  }
}

function abrirVisorDesdeSelector(selector) {
  const rama = obtenerRamaSeleccionada(selector);
  try {
    localStorage.setItem("visor_contexto", JSON.stringify({
      rama, todas: !rama, archivo: "", abrirLista: true
    }));
    sessionStorage.setItem("visorAdminBranchMode", rama ? "branch" : "all");
    sessionStorage.setItem("visorAdminBranch", rama);
    if (window.NavegacionApp) {
      window.NavegacionApp.ir("visor", { rama, todas: !rama });
    }
  } catch (error) {
    console.error("No se pudo abrir el Visor Admin:", error);
  }
}

function configurarBotonVisor(selector, boton) {
  if (!boton) return;
  boton.addEventListener("click", evento => {
    evento.preventDefault();
    evento.stopPropagation();
    abrirVisorDesdeSelector(selector);
  });
}

async function cargarRamasSelector(selector) {
  selector.innerHTML = '<option value="">SELECCIONAR</option>';
  try {
    return await Promise.race([
      RamaActual.poblarSelector(selector),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error("Tiempo agotado")), 8000))
    ]);
  } catch (error) {
    console.warn("No se pudieron cargar las ramas:", error.message);
    return [];
  }
}
