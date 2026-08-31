(() => {
  function volverAlInicio(evento) {
    evento.preventDefault();
    /*
     * En VISOR-ADMIN el Home es SIEMPRE el selector de ramas.
     * No reutilizamos la rama anterior aunque localStorage/sessionStorage
     * todavía la conozcan: el usuario ha pedido volver al selector.
     */
    try {
      window.RamaActual?.limpiar?.();
      window.Estado?.guardar?.("rama", "");
      sessionStorage.setItem("forzar_selector_rama", "1");
      localStorage.removeItem("last_grado");
      localStorage.removeItem("last_archivo");
      localStorage.removeItem("last_open");
      localStorage.removeItem("visor_todas");
      localStorage.setItem("visor_contexto", JSON.stringify({
        rama: "",
        todas: false,
        abrirLista: true,
        directo: false,
        archivo: "",
        asignatura: "",
        trimestre: "",
        tarea: ""
      }));
    } catch (_) {}
    const url = "/paginas/visor-administrador/panel-administrador.html";
    location.assign(url);
  }

  function volverDesdeVisor(evento) {
    evento.preventDefault();
    const documento = document.getElementById("ov");
    if (documento?.classList.contains("on") && typeof window.closeOv === "function") {
      window.closeOv();
      return;
    }
    const destino = evento.currentTarget.dataset.returnPath || "";
    if (destino && destino.startsWith("/") && destino !== "/") {
      location.assign(destino);
      return;
    }
    /* Sin una ruta de retorno explícita, Atrás del VISOR-ADMIN = selector. */
    try {
      window.RamaActual?.limpiar?.();
      window.Estado?.guardar?.("rama", "");
      sessionStorage.setItem("forzar_selector_rama", "1");
      localStorage.removeItem("last_grado");
      localStorage.removeItem("last_archivo");
      localStorage.removeItem("last_open");
      localStorage.removeItem("visor_todas");
      localStorage.setItem("visor_contexto", JSON.stringify({
        rama: "", todas: false, abrirLista: true, directo: false,
        archivo: "", asignatura: "", trimestre: "", tarea: ""
      }));
    } catch (_) {}
    location.assign("/paginas/visor-administrador/panel-administrador.html");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const inicio = document.getElementById("btn-inicio");
    const atras = document.getElementById("volver-atras");
    if (inicio) inicio.onclick = volverAlInicio;
    if (atras) atras.onclick = volverDesdeVisor;
  }, { once: true });
})();
