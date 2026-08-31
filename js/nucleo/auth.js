(() => {
  document.documentElement.style.visibility = "visible";
  document.documentElement.classList.add("auth-cargando");

  // El tema lo controla js/nucleo/tema-global.js. No usar modo_oscuro aquí.

  if (!window.SUPABASE_URL) {
    window.SUPABASE_URL = "https://lztatgnlplpduiatmlrv.supabase.co";
  }
  if (!window.SUPABASE_ANON_KEY) {
    window.SUPABASE_ANON_KEY = "sb_publishable_z_T7Y3yKqPdXLnvL3ltnQA_ZAPrXImZ";
  }

  if (!window.GITHUB_CONFIG) {
    window.GITHUB_CONFIG = {
      repo: "nataliagamezbarea/GRADOS_INFORMATICOS",
      token: "",
    };
  } else if (!window.GITHUB_CONFIG.repo) {
    window.GITHUB_CONFIG.repo = "nataliagamezbarea/GRADOS_INFORMATICOS";
  }

  if (
    typeof document !== "undefined" &&
    !document.querySelector('link[href*="font-awesome"]') &&
    !document.querySelector('link[href*="fontawesome"]')
  ) {
    const link = document.createElement("link");
    link.id = "fa-cdn";
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(link);
  }

  if (typeof document !== "undefined" && !document.getElementById("emojis-script")) {
    const rutaActual = window.location.pathname;
    const enModulos = rutaActual.includes("/modulos/");
    const enVisorAdmin = rutaActual.includes("/visor-admin/");
    const scriptEmoji = document.createElement("script");
    scriptEmoji.id = "emojis-script";
    scriptEmoji.src =
      enModulos || enVisorAdmin
        ? "../js/componentes/emojis.js"
        : "js/componentes/emojis.js";
    document.head.appendChild(scriptEmoji);
  }

  const credencialesListas = true;
  const pathname = window.location.pathname.replace(/\\/g, "/");

  // La página real de autenticación es modulos/iniciar-sesion.html.
  const esPaginaLogin = /(?:login|iniciar-sesion)\.html$/.test(pathname) || /\/iniciar-sesion$/.test(pathname);

  // El panel de gestión vive aquí y requiere rol admin en Supabase.
  const esPaginaVisor =
    /\/visor-admin\/panel-administrador\.html$/.test(pathname) ||
    /\/visor-admin\/index\.html$/.test(pathname) ||
    /\/visor-admin$/.test(pathname);

  const redirigir = (destino) => window.location.replace(destino);

  const rutaLogin = () => "/iniciar-sesion";

  const mostrarErrorLogin = (mensaje) => {
    if (!esPaginaLogin) return;
    const errorBox = document.getElementById("mensaje-error");
    if (errorBox) {
      errorBox.textContent = mensaje;
      errorBox.hidden = false;
    }
  };

  const iniciar = async () => {
    try {
      if (!credencialesListas) {
        throw new Error("Configura SUPABASE_URL y SUPABASE_ANON_KEY.");
      }

      if (!window.supabase?.createClient) {
        throw new Error("Supabase JS no está cargado.");
      }

      const supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY,
        { db: { schema: "grados-informaticos" } }
      );
      window.supabaseClient = supabase;

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session && window.location.hash.includes("access_token")) {
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const res = await supabase.auth.getSession();
          if (res.data?.session) {
            session = res.data.session;
            break;
          }
        }
      }

      let esAdmin = false;

      if (session?.user && window.Permisos) {
        try {
          // cargoSesion consulta perfiles.rol en Supabase y es la única
          // fuente de verdad para el privilegio de administrador.
          await window.Permisos.cargoSesion();
          esAdmin = window.Permisos.esAdmin === true;
        } catch (_) {
          esAdmin = false;
        }
      }

      // Un usuario autenticado no admin NO puede entrar al visor.
      if (esPaginaVisor && !esAdmin) {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        try {
          sessionStorage.removeItem("esAdmin");
        } catch (_) {}
        redirigir(rutaLogin());
        return;
      }

      // En el login, una sesión admin entra al inicio.
      if (esPaginaLogin && esAdmin) {
        try { sessionStorage.removeItem("esInvitado"); } catch (_) {}
        const destino = window.location.search
          ? new URLSearchParams(window.location.search).get("redir")
          : null;
        redirigir(destino || "/inicio");
        return;
      }

      // Si hay una sesión no-admin en el login, no la usamos como privilegio.
      // Se limpia para evitar estados inconsistentes y bucles de redirección.
      if (esPaginaLogin && session?.user && !esAdmin) {
        try {
          await supabase.auth.signOut();
          session = null;
        } catch (_) {}
        try { sessionStorage.removeItem("esAdmin"); } catch (_) {}
        mostrarErrorLogin(
          "Esta cuenta no tiene rol admin en Supabase. Para el área de administración debes acceder con una cuenta cuyo perfil tenga rol = admin."
        );
      }

      const esInvitado =
        sessionStorage.getItem("esInvitado") === "true";

      const tieneAcceso = Boolean(session || esInvitado);

      if (!esPaginaLogin && !tieneAcceso) {
        redirigir(rutaLogin());
        return;
      }

      if (
        esInvitado &&
        window.Permisos &&
        window.Permisos.invitadosActivos === false
      ) {
        sessionStorage.removeItem("esInvitado");
        if (esPaginaLogin) {
          mostrarErrorLogin(
            "El acceso como invitado está desactivado temporalmente."
          );
          document.documentElement.style.visibility = "visible";
          document.documentElement.classList.remove("auth-cargando");
          return;
        }
        redirigir(rutaLogin());
        return;
      }

      document.documentElement.style.visibility = "visible";
      document.documentElement.classList.remove("auth-cargando");
      window.sesionActual = session;
      try { window.dispatchEvent(new CustomEvent("sesion-lista")); } catch (_) {}

      if (
        !esPaginaLogin &&
        !esPaginaVisor &&
        window.ComponenteNavbar &&
        typeof window.ComponenteNavbar.inicializar === "function"
      ) {
        window.ComponenteNavbar.inicializar();
      }
    } catch (error) {
      console.error("Error de autenticación:", error);

      if (!esPaginaLogin) {
        redirigir(rutaLogin());
        return;
      }

      document.documentElement.style.visibility = "visible";
      document.documentElement.classList.remove("auth-cargando");
      mostrarErrorLogin("No se pudo comprobar la sesión. Inténtalo de nuevo.");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
