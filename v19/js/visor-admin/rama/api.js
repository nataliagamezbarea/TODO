// Las ramas del ADMIN se descubren SIEMPRE de forma dinamica desde GitHub.
// El token de GitHub nunca sale del backend. La sesion Supabase del ADMIN
// se envia como Bearer para que el backend pueda consultar configuracion_privada con RLS.
window.RamaAPI = (() => {
  const RAMAS_RESPALDO = [];

  const listarRamas = async () => {
    try {
      const headers = { "Accept": "application/json" };
      if (window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        if (data?.session?.access_token) {
          headers["Authorization"] = `Bearer ${data.session.access_token}`;
        }
      }
      const res = await fetch("/api/ramas", {
        headers,
        cache: "no-store"
      });
      if (res.ok) {
        const ramas = await res.json();
        if (Array.isArray(ramas)) return ramas;
      }
    } catch (e) {
      console.error("[RAMAS] Error obteniendo ramas:", e);
    }
    return RAMAS_RESPALDO;
  };

  return { listarRamas, RAMAS_RESPALDO };
})();


/* Selector de ramas: siempre conserva SELECCIONAR y permite TODAS las ramas */
