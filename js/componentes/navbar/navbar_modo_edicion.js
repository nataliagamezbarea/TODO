function emitirCambioModoEdicion(activo) {
  const estado = Boolean(activo);
  try {
    sessionStorage.setItem("modo_edicion", estado ? "true" : "false");
    sessionStorage.setItem("modo_edicion_activo", estado ? "true" : "false");
    localStorage.setItem("modo_edicion_live", estado ? "true" : "false");
  } catch (e) {}

  if (window.Permisos && typeof window.Permisos.setVistaInvitado === "function") {
    window.Permisos.setVistaInvitado(estado);
  }

  // CustomEvent sí se dispara en la misma pestaña (a diferencia de
  // window.storage), por lo que todos los renderizadores se actualizan
  // inmediatamente sin recargar.
  try {
    window.dispatchEvent(new CustomEvent("modo-edicion-cambiado", {
      detail: { activo: estado }
    }));
  } catch (e) {}
}

window.ModoEdicionLive = {
  obtener() {
    try { return localStorage.getItem("modo_edicion_live") === "true"; } catch (e) { return false; }
  },
  cambiar(activo) {
    emitirCambioModoEdicion(Boolean(activo));
  },
  alternar() {
    emitirCambioModoEdicion(!this.obtener());
  }
};

function asegurarModoEdicionBoton() {
  const path = window.location.pathname;
  const esPaginaIndex = path.endsWith("/index.html") || path.endsWith("/") || path.endsWith("/GRADOS_INFORMATICOS-LOGIN");
  const esPaginaLogin = /login\.html/.test(path);
  const esPaginaVisor = /visor\.html/.test(path);

  if (esPaginaIndex || esPaginaLogin || esPaginaVisor) return;
  const esAdmin = Boolean(window.Permisos && window.Permisos.esAdmin);
  if (!esAdmin) return;

  const barra = document.getElementById("barra-superior");
  const navRight = barra ? barra.querySelector(".nav-right") : null;
  if (!barra) return;

  let boton = document.getElementById("boton-modo-edicion");
  let modoEdicion = localStorage.getItem("modo_edicion_live") === "true";

  const actualizarTextoBoton = () => {
    boton.innerHTML = `<span class="btn-icon">${modoEdicion ? "✏️" : "📖"}</span><span class="btn-text"> ${modoEdicion ? "EDITAR" : "LECTURA"}</span>`;
    boton.classList.toggle("modo-encendido", modoEdicion);
    boton.title = modoEdicion
      ? "Modo Edición activo (Clic para cambiar a Lectura)"
      : "Modo Lectura activo (Clic para cambiar a Edición)";
  };

  if (!boton) {
    boton = document.createElement("button");
    boton.id = "boton-modo-edicion";
    actualizarTextoBoton();

    boton.addEventListener("click", async () => {
      modoEdicion = !modoEdicion;
      emitirCambioModoEdicion(modoEdicion);
      actualizarTextoBoton();
    });

    if (navRight) {
      barra.insertBefore(boton, navRight);
    } else {
      barra.appendChild(boton);
    }
  } else {
    actualizarTextoBoton();
  }
}

window.asegurarModoEdicionBoton = asegurarModoEdicionBoton;
