(function(){
  function abrirVisorAdminTodasLasRamas(ev){
    if (ev) ev.preventDefault();
    const base = new URL("/paginas/visor-admin/panel-administrador.html", document.baseURI).href;
    sessionStorage.setItem("visorAdminBranchMode", "all");
    sessionStorage.removeItem("visorAdminBranch");
    sessionStorage.removeItem("visorAdminFile");
    window.location.href = base;
  }
  window.abrirVisorAdminTodasLasRamas = abrirVisorAdminTodasLasRamas;
  document.addEventListener("click", function(e){
    const el = e.target.closest(
      '[data-visor-admin], [data-action="visor-admin"], #btnVisorAdmin, .btn-visor-admin'
    );
    if (!el) return;
    abrirVisorAdminTodasLasRamas(e);
  }, true);
})();
