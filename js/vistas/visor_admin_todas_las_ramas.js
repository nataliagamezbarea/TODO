(() => {
  function abrirVisorAdminTodasLasRamas(ev) {
    ev?.preventDefault();
    const base = new URL("./visor-admin/panel-administrador.html", document.baseURI).href;
    sessionStorage.setItem("visorAdminBranchMode", "all");
    sessionStorage.removeItem("visorAdminBranch");
    sessionStorage.removeItem("visorAdminFile");
    window.location.href = base;
  }

  window.abrirVisorAdminTodasLasRamas = abrirVisorAdminTodasLasRamas;
  document.addEventListener("click", (event) => {
    const element = event.target.closest(
      '[data-visor-admin], [data-action="visor-admin"], #btnVisorAdmin, .btn-visor-admin'
    );
    if (element) abrirVisorAdminTodasLasRamas(event);
  }, true);
})();
