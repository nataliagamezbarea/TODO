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
        /*
         * IMPORTANTE: no verificarAdmin antes de hidratar Permisos.
         * Esa comprobación consultaba public.perfiles demasiado pronto y,
         * ante un fallo/transición de Supabase, devolvía false y cerraba una
         * sesión que sí era válida. Primero esperamos al rol real y después
         * dejamos que la aplicación decida la vista.
         */
        try {
          if (window.Permisos?.asegurarSesion) await window.Permisos.asegurarSesion();
        } catch (e) {
        }
        sessionStorage.removeItem("esInvitado");
        try {
          const pCsv = window.PermisosVisibilidad?.asegurarCsvIniciales?.();
          if (pCsv && typeof pCsv.catch === "function") pCsv.catch(() => {});
        } catch (_) {}
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
      let rutaInicial = "login";
      let contextoInicial = {};
      if (!tieneAcceso) {
        await mostrar("login");
      } else {
        window.sesionActual = session;
        // Si ya había una rama seleccionada, no mostramos el selector: entramos
        // directamente en el grado. Solo se borra cuando el usuario vuelve
        // explícitamente al selector mediante Atrás y el selector queda vacío.
        let ramaPersistida = "";
        let forzarSelector = false;
        try { forzarSelector = window.RamaActual?.estaForzadoSelector?.() === true || sessionStorage.getItem("forzar_selector_rama") === "1"; } catch (_) {}
        if (!forzarSelector) {
          try { ramaPersistida = String(window.RamaActual?.obtener?.() || window.Estado?.obtener?.("rama") || "").trim(); } catch (_) {}
        }
        if (ramaPersistida) {
          rutaInicial = "clase";
          contextoInicial = { rama: ramaPersistida };
        } else {
          rutaInicial = "inicio";
          contextoInicial = {};
        }
        await mostrar(rutaInicial, contextoInicial);
        if (window.ComponenteNavbar?.inicializar) window.ComponenteNavbar.inicializar();
      }
      window.__AUTH_ROUTING_DONE = true;
      try { window.dispatchEvent(new CustomEvent("auth-ruta-lista", { detail: { ruta: rutaInicial, contexto: contextoInicial } })); } catch (_) {}
      document.documentElement.style.visibility = "visible";
      document.documentElement.classList.remove("auth-cargando");
    } catch (error) {
      await mostrar("login");
      window.__AUTH_ROUTING_DONE = true;
      try { window.dispatchEvent(new CustomEvent("auth-ruta-lista", { detail: { ruta: "login", contexto: {} } })); } catch (_) {}
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
