window.PermisosGithub = (() => {
  /*
   * Autorización centralizada:
   * GitHub NO decide quién es administrador.
   * La única fuente de verdad para el rol es grados-informaticos.perfiles.rol.
   *
   * Este módulo conserva el nombre/API anterior para no romper llamadas
   * existentes, pero ya no usa email, sessionStorage, commits ni
   * colaboradores de GitHub como prueba de privilegios.
   */
  const verificarAdmin = async (user, clientParam) => {
    if (!user) return false;

    try {
      const cliente =
        clientParam ||
        (window.PermisosSupabase
          ? await window.PermisosSupabase.esperarCliente()
          : null);

      if (!cliente || !window.PermisosSupabase) return false;

      const resPerfil = await window.PermisosSupabase.consultarTablaConFallback(
        cliente,
        "perfiles",
        (t) => t.select("rol").eq("id", user.id).maybeSingle()
      );

      const esAdmin =
        !resPerfil.error &&
        resPerfil.data &&
        String(resPerfil.data.rol || "").trim().toLowerCase() === "admin";

      return esAdmin;
    } catch (_) {
      return false;
    }
  };

  return { verificarAdmin };
})();
