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
    const url = new URL("/paginas/visor-administrador/panel-administrador.html", document.baseURI);
    if (rama) url.searchParams.set("rama", rama);
    else url.searchParams.set("todas", "1");
    window.location.href = url.href;
  } catch (error) {
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
  selector.innerHTML = '';
  try {
    const ramas = await Promise.race([
      window.RamaAPI.poblarSelector(selector, { incluirMarcador: false }),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error("Tiempo agotado")), 8000))
    ]);
    const lista = Array.isArray(ramas) ? ramas : [];
    // La primera opción debe ser siempre la primera rama real de GitHub.
    // No mostramos "SELECCIONAR RAMA" como opción ficticia.
    if (lista.length) {
      selector.value = lista[0];
      window.RamaActual?.guardar?.(lista[0]);
      window.Estado?.guardar?.("rama", lista[0]);
    }
    // La opción especial se añade al final; no se crea ningún marcador vacío.
    Array.from(selector.options).forEach(opcion => {
      if (opcion.value === '__ALL_BRANCHES__') opcion.remove();
    });
    const todas = document.createElement('option');
    todas.value = '__ALL_BRANCHES__';
    todas.textContent = 'TODAS LAS RAMAS';
    selector.appendChild(todas);
    return lista;
  } catch (error) {
    return [];
  }
}
