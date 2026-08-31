(() => {
  document.documentElement.style.visibility = "visible";
  document.documentElement.classList.add("auth-cargando");
  if (typeof localStorage !== "undefined" && localStorage.getItem("modo_oscuro") === "true") document.documentElement.classList.add("modo-oscuro");
  if (!window.SUPABASE_URL) window.SUPABASE_URL = "https://lztatgnlplpduiatmlrv.supabase.co";
  if (!window.SUPABASE_ANON_KEY) window.SUPABASE_ANON_KEY = "sb_publishable_z_T7Y3yKqPdXLnvL3ltnQA_ZAPrXImZ";
  if (!window.GITHUB_CONFIG) window.GITHUB_CONFIG = { repo: "", token: "" };
  const credencialesListas = true;
  const mostrar = (vista, datos = {}) => window.AppViews?.mostrar ? window.AppViews.mostrar(vista, datos, { reemplazar: true }) : Promise.resolve();

  const iniciar = async () => {
    try {
      if (!credencialesListas) throw new Error("Configura las credenciales de Supabase.");
      const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, { db: { schema: "grados-informaticos" } });
      window.supabaseClient = supabase;
      let { data: { session } } = await supabase.auth.getSession();
      if (!session && window.location.hash.includes("access_token")) {
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 100));
          const res = await supabase.auth.getSession();
          if (res.data?.session) { session = res.data.session; break; }
        }
      }
      if (session?.user) {
        let esAdminValido = false;
        try { esAdminValido = window.Permisos ? await window.Permisos.verificarAdmin(session.user) : false; } catch (_) {}
        if (!esAdminValido) {
          sessionStorage.removeItem("esInvitado");
          await supabase.auth.signOut();
          session = null;
          await mostrar("login");
          const errorBox = document.getElementById("mensaje-error");
          if (errorBox) { errorBox.textContent = "Acceso restringido: Esta cuenta no pertenece a un administrador ni colaborador del repositorio. Debes pulsar 'Entrar como Invitado'."; errorBox.hidden = false; }
        } else {
          sessionStorage.removeItem("esInvitado");
          // La pantalla se muestra inmediatamente. La carga de perfil/configuración
          // continúa en segundo plano y el selector de ramas espera solo cuando
          // necesita esos datos.
          try {
            const pSesion = window.Permisos?.cargoSesion?.();
            if (pSesion && typeof pSesion.catch === "function") pSesion.catch((e) => console.warn("[Supabase] Carga de sesión en segundo plano:", e));
            const pCsv = window.PermisosVisibilidad?.asegurarCsvIniciales?.();
            if (pCsv && typeof pCsv.catch === "function") pCsv.catch(() => {});
          } catch (_) {}
        }
      }
      const esInvitado = sessionStorage.getItem("esInvitado") === "true";
      const tieneAcceso = Boolean(session || esInvitado);
      const MSG_BLOQUEO = "Acceso restringido: Esta cuenta no pertenece a un administrador ni colaborador del repositorio. En este momento el material está en revisión o actualización y el acceso temporal a invitados está desactivado. Inténtalo de nuevo más tarde. Si necesitas acceso, contacta con la propietaria del repositorio.";
      try { await window.Permisos?.cargarAjustesServidor?.(); } catch (_) {}
      if (esInvitado && window.Permisos && window.Permisos.invitadosActivos === false) {
        sessionStorage.removeItem("esInvitado");
        await mostrar("login");
        const errorBox = document.getElementById("mensaje-error");
        if (errorBox) { errorBox.textContent = MSG_BLOQUEO; errorBox.hidden = false; }
        return;
      }
      if (!tieneAcceso) {
        await mostrar("login");
      } else {
        window.sesionActual = session;
        await mostrar("inicio");
        // No esperamos otra consulta de Supabase aquí: la vista y el selector
        // ya están montados. La inicialización específica puede continuar sin
        // bloquear la navegación.
        try { if (typeof window.inicializarVistaInicio === "function") window.inicializarVistaInicio(); } catch (_) {}
        if (window.ComponenteNavbar?.inicializar) window.ComponenteNavbar.inicializar();
      }
      document.documentElement.style.visibility = "visible";
      document.documentElement.classList.remove("auth-cargando");
    } catch (error) {
      console.error("Error inicializando autenticación:", error);
      await mostrar("login");
      document.documentElement.style.visibility = "visible";
      document.documentElement.classList.remove("auth-cargando");
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();


// Mantener siempre la URL limpia: el hash de OAuth solo sirve durante el retorno del proveedor.
(() => {
  const limpiarHashOAuth = () => {
    if (!window.location.hash) return;
    const h = window.location.hash;
    if (/access_token=|refresh_token=|expires_in=|token_type=/i.test(h)) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } catch (_) {}
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", limpiarHashOAuth, {once:true});
  else limpiarHashOAuth();
})();
