(() => {
  function volverAlInicio(evento) {
    evento.preventDefault();
    try {
      const contexto = JSON.parse(localStorage.getItem("visor_contexto") || "{}");
      localStorage.setItem("visor_contexto", JSON.stringify({ ...contexto, abrirLista: true }));
    } catch (_) {}
    location.assign("/paginas/inicio.html");
  }

  function volverDesdeVisor(evento) {
    evento.preventDefault();
    const documento = document.getElementById("ov");
    if (documento?.classList.contains("on") && typeof window.closeOv === "function") {
      window.closeOv();
      return;
    }
    const destino = evento.currentTarget.dataset.returnPath || "/paginas/inicio.html";
    location.assign(destino);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const inicio = document.getElementById("btn-inicio");
    const atras = document.getElementById("volver-atras");
    if (inicio) inicio.onclick = volverAlInicio;
    if (atras) atras.onclick = volverDesdeVisor;
  }, { once: true });
})();
