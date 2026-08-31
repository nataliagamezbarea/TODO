window.PermisosSupabase = (() => {
  // Schema real de las tablas de la aplicación.
  // Supabase JS enviará Accept-Profile: grados-informaticos.
  const SCHEMA_NAME = "grados-informaticos";

  const esperarCliente = async () => {
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  };

  const getTabla = (cliente, nombreTabla) => {
    if (!cliente) return null;

    // perfiles está en public; todo lo demás de este módulo está en
    // "grados-informaticos". No hacemos primero una petición a public,
    // porque eso genera 404 y además oculta el problema real del schema.
    try {
      if (nombreTabla === "perfiles") {
        return cliente.schema("public").from(nombreTabla);
      }
      return cliente.schema(SCHEMA_NAME).from(nombreTabla);
    } catch (e) {
      return null;
    }
  };

  const consultarTablaConFallback = async (cliente, nombreTabla, callback) => {
    if (!cliente) return { data: null, error: new Error("Sin cliente Supabase") };

    try {
      const tabla = getTabla(cliente, nombreTabla);
      if (!tabla) throw new Error(`No se pudo crear el cliente para '${nombreTabla}'`);
      return await callback(tabla);
    } catch (e) {
      return { data: null, error: e };
    }
  };

  return {
    esperarCliente,
    getTabla,
    consultarTablaConFallback,
    SCHEMA_NAME,
  };
})();
