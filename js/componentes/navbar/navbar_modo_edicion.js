function emitirCambioModoEdicion(activo) {
  const estado = Boolean(activo);
  try {
    localStorage.setItem("modo_edicion_live", String(estado));
    sessionStorage.setItem("modo_edicion", String(estado));
  } catch (_) {}
  window.dispatchEvent(new CustomEvent("modo-edicion-cambiado", { detail: { activo: estado } }));
}

window.ModoEdicionLive = {
  obtener: () => localStorage.getItem("modo_edicion_live") === "true",
  cambiar: (estado) => emitirCambioModoEdicion(estado),
  alternar: () => emitirCambioModoEdicion(!window.ModoEdicionLive.obtener())
};

function asegurarModoEdicionBoton() {
  const boton = document.getElementById("boton-modo-edicion");
  if (!boton) return;

  const actualizar = () => {
    const esAdmin = Boolean(window.Permisos && window.Permisos.esAdmin);
    boton.hidden = !esAdmin;
    if (!esAdmin) return;
    const activo = window.ModoEdicionLive.obtener();
    boton.classList.toggle("modo-encendido", activo);
    boton.innerHTML = `<span class="btn-icon">${activo ? "✏️" : "📖"}</span><span class="btn-text">${activo ? "EDITAR" : "LECTURA"}</span>`;
    boton.title = activo ? "Cambiar a modo lectura" : "Cambiar a modo edición";
  };

  if (!boton.dataset.listener) {
    boton.dataset.listener = "1";
    boton.addEventListener("click", () => {
      if (!(window.Permisos && window.Permisos.esAdmin)) return;
      emitirCambioModoEdicion(!window.ModoEdicionLive.obtener());
      actualizar();
    });
    window.addEventListener("modo-edicion-cambiado", actualizar);
    window.addEventListener("sesion-lista", actualizar);
  }
  actualizar();
}
window.asegurarModoEdicionBoton = asegurarModoEdicionBoton;
