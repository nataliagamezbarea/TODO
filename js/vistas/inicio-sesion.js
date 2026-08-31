function inicializarVistaLogin() {
  const form = document.getElementById("form-login");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const errorBox = document.getElementById("mensaje-error");
  const btnEmail = document.getElementById("btn-email");
  const btnGoogle = document.getElementById("btn-google");
  const btnGithub = document.getElementById("btn-github");
  const btnInvitado = document.getElementById("btn-invitado");
  if (!form) return;
  if (form.dataset.inicializado === "1") return;
  form.dataset.inicializado = "1";
  const mostrarError = msg => { if (errorBox) { errorBox.textContent = msg; errorBox.hidden = false; } };
  const irAlInicio = async () => {
    let rama = "";
    let forzarSelector = false;
    try { forzarSelector = sessionStorage.getItem("forzar_selector_rama") === "1"; } catch (_) {}
    if (!forzarSelector) {
      try { rama = String(window.RamaActual?.obtener?.() || window.Estado?.obtener?.("rama") || "").trim(); } catch (_) {}
    }
    if (rama) {
      return window.AppViews?.mostrar("clase", { rama });
    }
    return window.AppViews?.mostrar("inicio", {});
  };
  const conseguirSupabase = async () => { for (let i=0;i<50;i++) { if (window.supabaseClient) return window.supabaseClient; await new Promise(r=>setTimeout(r,100)); } return null; };
  form.addEventListener("submit", async e => {
    e.preventDefault(); if (errorBox) errorBox.hidden = true;
    const supabase = await conseguirSupabase(); if (!supabase) return mostrarError("Error al conectar con Supabase.");
    if (btnEmail) { btnEmail.disabled = true; btnEmail.textContent = "Entrando..."; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value });
    if (error) { mostrarError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message); if (btnEmail) { btnEmail.disabled=false; btnEmail.textContent="Iniciar sesión"; } return; }
    sessionStorage.removeItem("esInvitado");
    try { await window.Permisos?.cargoSesion?.(); } catch (_) {}
    window.sesionActual = data?.session || null;
    await irAlInicio();
  });
  const loginConOAuth = async proveedor => {
    if (errorBox) errorBox.hidden = true;
    const supabase = await conseguirSupabase(); if (!supabase) return mostrarError("Error al conectar con Supabase.");
    const { error } = await supabase.auth.signInWithOAuth({ provider: proveedor, options: { redirectTo: window.location.origin + "/" } });
    if (error) mostrarError(error.message);
  };
  btnGoogle?.addEventListener("click", () => loginConOAuth("google"));
  btnGithub?.addEventListener("click", () => loginConOAuth("github"));
  btnInvitado?.addEventListener("click", async () => {
    try { await window.Permisos?.cargarAjustesServidor?.(); } catch (_) {}
    if (window.Permisos?.invitadosActivos === false) return mostrarError("Acceso restringido: el acceso temporal a invitados está desactivado.");
    sessionStorage.setItem("esInvitado", "true");
    await irAlInicio();
  });
  const tarjeta = document.querySelector(".login-tarjeta");
  if (tarjeta && !tarjeta.querySelector("[data-login-aviso]")) {
    const aviso=document.createElement("div"); aviso.dataset.loginAviso="1"; aviso.className="login-aviso";
    aviso.innerHTML="<strong>Nota:</strong> El acceso con Email, Google o GitHub está reservado al administrador. Para acceder como alumno pulsa <strong>Entrar como Invitado</strong>.";
    tarjeta.appendChild(aviso);
  }
}
