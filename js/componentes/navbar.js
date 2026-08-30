(function () {
  const ComponenteNavbar = {
    inicializar: function () {
      const path = window.location.pathname;
      const esPaginaVisorAdmin = /\/visor-admin\/index\.html$/.test(path);
      const esPaginaIndex = !esPaginaVisorAdmin && (path.endsWith("/index.html") || path.endsWith("/") || path.endsWith("/GRADOS_INFORMATICOS-LOGIN"));
      const esPaginaLogin = /login\.html/.test(path);
      const esPaginaVisor = /visor\.html/.test(path);

      if (esPaginaLogin || esPaginaVisor) return;

      const enModulos = path.includes("/modulos");
      const rutaInicio = enModulos ? "../index.html" : "index.html";

      if (!document.querySelector('link[href*="navbar_movil.css"]')) {
        const linkCSS = document.createElement("link");
        linkCSS.rel = "stylesheet";
        linkCSS.href = enModulos ? "../css/navbar_movil.css" : "css/navbar_movil.css";
        document.head.appendChild(linkCSS);
      }

      const aplicarModoOscuro = (activar) => {
        if (activar) {
          document.body.classList.add("modo-oscuro");
          document.documentElement.classList.add("modo-oscuro");
        } else {
          document.body.classList.remove("modo-oscuro");
          document.documentElement.classList.remove("modo-oscuro");
        }
      };

      const modoOscuroActivo = localStorage.getItem("modo_oscuro") === "true";
      aplicarModoOscuro(modoOscuroActivo);

      let barra = document.getElementById("barra-superior");
      document.documentElement.classList.add("navbar-inicializada");
      if (!barra) {
        barra = document.createElement("header");
        barra.id = "barra-superior";
        barra.className = "barra-superior";
        document.body.prepend(barra);
      }

      let navLeft = barra.querySelector(".nav-left");
      if (!navLeft) {
        navLeft = document.createElement("div");
        navLeft.className = "nav-left";
        barra.prepend(navLeft);
      }

      let navRight = barra.querySelector(".nav-right");
      if (!navRight) {
        navRight = document.createElement("div");
        navRight.className = "nav-right";
        barra.appendChild(navRight);
      }

      let btnInicio = document.getElementById("btn-inicio");
      if (!btnInicio) {
        btnInicio = document.createElement("a");
        btnInicio.id = "btn-inicio";
        btnInicio.className = "btn-inicio";
        btnInicio.innerHTML = '<i class="fa-solid fa-house"></i>';
        btnInicio.title = "Inicio";
        btnInicio.href = rutaInicio;
        navLeft.appendChild(btnInicio);
      } else if (btnInicio.parentElement !== navLeft) {
        navLeft.appendChild(btnInicio);
      }

      let volverAtras = document.getElementById("volver-atras");
      if (!volverAtras) {
        volverAtras = document.createElement("a");
        volverAtras.id = "volver-atras";
        volverAtras.className = "btn-volver";
        volverAtras.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        volverAtras.title = "Volver Atrás";
        volverAtras.href = "#";
        navLeft.appendChild(volverAtras);
      } else if (volverAtras.parentElement !== navLeft) {
        navLeft.appendChild(volverAtras);
      }

      if (esPaginaIndex) {
        if (btnInicio) btnInicio.classList.add("oculto");
        if (volverAtras) volverAtras.classList.add("oculto");
      } else {
        if (btnInicio) btnInicio.classList.remove("oculto");
        if (volverAtras) volverAtras.classList.remove("oculto");

        // La navbar es fija y NO se oculta mientras carga el contenido.
        // Mostramos un indicador independiente debajo de ella.
        let loader = document.getElementById("global-navbar-loading");
        if (!loader) {
          loader = document.createElement("div");
          loader.id = "global-navbar-loading";
          loader.classList.add("on");
          loader.setAttribute("aria-live", "polite");
          loader.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Cargando...</span>';
          document.body.appendChild(loader);
        }
        const ocultarLoader = () => {
          if (loader) loader.classList.remove("on");
        };
        if (document.readyState === "complete") ocultarLoader();
        else window.addEventListener("load", ocultarLoader, { once: true });
      }

      const ejecutarVolverAtras = (e) => {
        if (e) e.preventDefault();

        // El visor-admin puede recibir una ruta exacta de retorno desde la página
        // que lo abrió. Esta ruta tiene prioridad para que "Volver" siempre
        // devuelva al contexto correcto (clase/asignatura/etc.).
        if (path.includes("/visor-admin/")) {
          const returnPath = volverAtras && volverAtras.dataset.returnPath;
          if (returnPath && returnPath.startsWith("/")) {
            window.location.href = returnPath;
            return;
          }
        }

        const rama = (window.Estado ? window.Estado.obtener("rama") : "") || (window.RamaActual ? window.RamaActual.obtener() : "master");
        const trimestre = (window.Estado ? window.Estado.obtener("trimestre") : "") || "1º Trimestre";
        const asignatura = (window.Estado ? window.Estado.obtener("asignatura") : "") || "";

        if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
          window.history.back();
          return;
        }

        if (path.includes("apuntes_practicas_ejercicios_tareas")) {
          window.location.href = `asignatura.html?asignatura=${encodeURIComponent(asignatura)}&trimestre=${encodeURIComponent(trimestre)}&rama=${encodeURIComponent(rama)}`;
        } else if (path.includes("asignatura.")) {
          window.location.href = `asignaturas.html?trimestre=${encodeURIComponent(trimestre)}&rama=${encodeURIComponent(rama)}`;
        } else if (path.includes("asignaturas.")) {
          window.location.href = `clase.html?rama=${encodeURIComponent(rama)}`;
        } else if (path.includes("clase.")) {
          window.location.href = rutaInicio;
        } else {
          window.location.href = rutaInicio;
        }
      };

      if (volverAtras && !volverAtras.dataset.listener) {
        volverAtras.dataset.listener = "true";
        volverAtras.addEventListener("click", ejecutarVolverAtras);
      }

      let btnModoOscuro = document.getElementById("btn-modo-oscuro");
      if (!btnModoOscuro) {
        btnModoOscuro = document.createElement("button");
        btnModoOscuro.id = "btn-modo-oscuro";
        btnModoOscuro.className = "btn-modo-oscuro";
        btnModoOscuro.title = "Modo Oscuro";
        navRight.appendChild(btnModoOscuro);
      } else if (btnModoOscuro.parentElement !== navRight) {
        navRight.appendChild(btnModoOscuro);
      }

      const actualizarIconoModoOscuro = () => {
        const esOscuro = document.body.classList.contains("modo-oscuro");
        btnModoOscuro.innerHTML = esOscuro ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        // El visor-admin puede cargar CSS/controles propios; forzamos el icono
        // cada vez que se actualiza para que nunca quede el icono de Ajustes.
        btnModoOscuro.dataset.modo = esOscuro ? 'dark' : 'light';
        btnModoOscuro.title = esOscuro ? "Modo Claro" : "Modo Oscuro";

        const chkDarkAjustes = document.getElementById("ajuste-modo-oscuro");
        if (chkDarkAjustes && chkDarkAjustes.checked !== esOscuro) {
          chkDarkAjustes.checked = esOscuro;
        }
      };

      actualizarIconoModoOscuro();

      const alternarModoOscuro = () => {
        const esOscuro = !document.body.classList.contains("modo-oscuro");
        aplicarModoOscuro(esOscuro);
        try { localStorage.setItem("modo_oscuro", esOscuro ? "true" : "false"); } catch (e) {}

        if (window.Permisos && window.Permisos.esAdmin && window.Permisos.guardarConfig) {
          window.Permisos.guardarConfig("modo_oscuro", esOscuro);
        }

        actualizarIconoModoOscuro();
      };

      window.__alternarModoOscuro = alternarModoOscuro;
      window.__actualizarIconoModoOscuro = actualizarIconoModoOscuro;

      if (!btnModoOscuro.dataset.listener) {
        btnModoOscuro.dataset.listener = "true";
        btnModoOscuro.addEventListener("click", alternarModoOscuro);
      }

      let btnCerrar = document.getElementById("btn-cerrar-sesion");
      if (!btnCerrar) {
        btnCerrar = document.createElement("button");
        btnCerrar.id = "btn-cerrar-sesion";
        btnCerrar.className = "btn-cerrar-sesion";
        btnCerrar.title = "Cerrar Sesión";
        btnCerrar.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
        navRight.appendChild(btnCerrar);
      } else if (btnCerrar.parentElement !== navRight) {
        navRight.appendChild(btnCerrar);
      }

      const ejecutarCerrarSesion = async () => {
        sessionStorage.clear();
        try { localStorage.removeItem("modo_edicion_live"); } catch (e) {}
        if (window.supabaseClient) {
          try { await window.supabaseClient.auth.signOut(); } catch (err) {}
        }
        const destino = enModulos ? "login.html" : "modulos/login.html";
        window.location.replace(destino);
      };

      if (btnCerrar && !btnCerrar.dataset.listener) {
        btnCerrar.dataset.listener = "true";
        btnCerrar.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await ejecutarCerrarSesion();
        });
      }

      if (typeof window.inicializarNavbarMovil === "function") {
        const navMovil = window.inicializarNavbarMovil({
          ejecutarVolverAtras,
          alternarModoOscuro,
          ejecutarCerrarSesion,
        });
        if (navMovil && typeof navMovil.sincronizarMenuHamburguesa === "function") {
          navMovil.sincronizarMenuHamburguesa();
        }
      }

      if (typeof window.asegurarModoEdicionBoton === "function") {
        window.asegurarModoEdicionBoton();
      }
      try { window.dispatchEvent(new CustomEvent("navbar-lista")); } catch (e) {}

      if (window.Permisos && typeof window.Permisos.cargoSesion === "function") {
        window.Permisos.cargoSesion().then(() => {
          if (typeof window.asegurarModoEdicionBoton === "function") window.asegurarModoEdicionBoton();
        }).catch(() => {});
      }
    },
  };

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("#btn-cerrar-sesion, .btn-cerrar-sesion, #hm-btn-cerrar-sesion");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.clear();
    try { localStorage.removeItem("modo_edicion_live"); } catch (err) {}
    if (window.supabaseClient) {
      try { await window.supabaseClient.auth.signOut(); } catch (err) {}
    }
    const enModulos = window.location.pathname.includes("/modulos");
    window.location.replace(enModulos ? "login.html" : "modulos/login.html");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => ComponenteNavbar.inicializar());
  } else {
    ComponenteNavbar.inicializar();
  }

  window.ComponenteNavbar = ComponenteNavbar;
})();


/* Selector de ramas: siempre conserva SELECCIONAR y permite TODAS las ramas */
function ensureAllBranchesOption(select) {
  if (!select) return;

  // SELECCIONAR siempre primero
  let defaultOpt = Array.from(select.options).find(o =>
    o.value === "" || o.dataset.defaultBranch === "1"
  );
  if (!defaultOpt) {
    defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "SELECCIONAR";
    defaultOpt.dataset.defaultBranch = "1";
  }
  select.insertBefore(defaultOpt, select.firstChild);

  // TODAS LAS RAMAS siempre al FINAL
  Array.from(select.options).forEach(o => {
    if (o.dataset.allBranches === "1" || o.value === "__ALL_BRANCHES__") o.remove();
  });
  const allOpt = document.createElement("option");
  allOpt.value = "__ALL_BRANCHES__";
  allOpt.textContent = "— TODAS LAS RAMAS —";
  allOpt.dataset.allBranches = "1";
  select.appendChild(allOpt);
}
