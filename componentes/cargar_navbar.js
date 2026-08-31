(() => {
  async function cargarNavbar() {
    const marcador = document.querySelector("[data-navbar]");
    if (!marcador) return;
    const ruta = marcador.dataset.navbar;
    if (!ruta) return;
    try {
      const respuesta = await fetch(ruta, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      marcador.outerHTML = await respuesta.text();
      document.dispatchEvent(new CustomEvent("navbar-cargada"));
    } catch (error) {
      console.error("No se pudo cargar la barra de navegación:", error);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargarNavbar);
  } else {
    cargarNavbar();
  }
})();
