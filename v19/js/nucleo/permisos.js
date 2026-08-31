window.Permisos = (() => {
 let usuario = null; let rol = null; try { if (sessionStorage.getItem("esAdmin") === "true") { rol = "admin"; } } catch (e) { } let invitadosActivos = true; try { invitadosActivos = localStorage.getItem("invitados_activos_live") !== "false"; } catch (e) { } const CLAVE_INVITADOS_ACTIVOS = "invitados_activos_live"; const CLAVES_AJUSTES = { modoOscuro: "modo_oscuro", invitados: "invitados_activos", descargarTodas: "descargar_todas_clases", descargarAsignatura: "descargar_asignatura", descargarCurso: "descargar_curso", descargarAsignaturaTodos: "descargar_asignatura_todos", visorActivo: "visor_activo", visorEnTareas: "visor_en_tareas", visorEnAsignaturas: "visor_en_asignaturas", visorEnTrimestres: "visor_en_trimestres", visorEnGrados: "visor_en_grados", visorEnSelectorRamas: "visor_en_selector_ramas", descargasEnSelectorRamas: "descargas_en_selector_ramas", }; const BUCKET_CSV = "csv-grados"; const modoEdicionActivo = () => { try { return localStorage.getItem("modo_edicion_live") === "true"; } catch (e) { return false; } }; const ramaActual = () => new URLSearchParams(window.location.search).get("rama") || (window.Estado ? window.Estado.obtener("rama") : "") || (window.RamaActual ? window.RamaActual.obtener() : ""); const esLocal = () => { const host = window.location.hostname; return host === "localhost" || host === "127.0.0.1"; }; let promesaSesion = null; let sesionCargada = false; const asegurarSesion = async () => { if (!promesaSesion) promesaSesion = cargoSesion(); try { await promesaSesion; sesionCargada = true; } catch (e) { sesionCargada = true; } }; const cargoSesion = async () => {
    const cliente = window.PermisosSupabase
      ? await window.PermisosSupabase.esperarCliente()
      : null;

    if (!cliente) {
      rol = "invitado";
      return;
    }

    try {
      const {
        data: { session }
      } = await cliente.auth.getSession();

      usuario = session?.user || null;

      if (!usuario) {
        try {
          const { data: userData } = await cliente.auth.getUser();
          usuario = userData?.user || null;
        } catch (_) {}
      }

      let perfilRol = "";
      let perfilConsultado = false;

      /*
       * El origen de verdad del rol es public.perfiles.
       * NO tratamos el valor por defecto "invitado" de rol_actual()
       * como un rol real: esa función devuelve "invitado" también
       * cuando auth.uid() no encuentra una fila.
       */
      if (usuario) {
        try {
          const resultadoPerfil =
            await window.PermisosSupabase.consultarTablaConFallback(
              cliente,
              "perfiles",
              (tabla) =>
                tabla
                  .select("id, email, rol")
                  .eq("id", usuario.id)
                  .maybeSingle()
            );

          if (
            !resultadoPerfil.error &&
            resultadoPerfil.data
          ) {
            perfilConsultado = true;
            perfilRol = String(
              resultadoPerfil.data.rol || ""
            )
              .trim()
              .toLowerCase();

            console.info(
              "[Supabase] Perfil encontrado:",
              {
                id: resultadoPerfil.data.id,
                email: resultadoPerfil.data.email,
                rol: perfilRol
              }
            );
          } else if (resultadoPerfil.error) {
            console.warn(
              "[Supabase] Error leyendo public.perfiles:",
              resultadoPerfil.error
            );
          }

          /*
           * Respaldo por email. Sirve para cuentas cuyo registro
           * de perfil quedó con un id antiguo, pero mantiene como
           * fuente Supabase, nunca localStorage.
           */
          if (!perfilConsultado) {
            const resultadoEmail =
              await window.PermisosSupabase.consultarTablaConFallback(
                cliente,
                "perfiles",
                (tabla) =>
                  tabla
                    .select("id, email, rol")
                    .eq("email", usuario.email)
                    .maybeSingle()
              );

            if (
              !resultadoEmail.error &&
              resultadoEmail.data
            ) {
              perfilConsultado = true;
              perfilRol = String(
                resultadoEmail.data.rol || ""
              )
                .trim()
                .toLowerCase();

              console.info(
                "[Supabase] Perfil encontrado por email:",
                {
                  email: resultadoEmail.data.email,
                  rol: perfilRol
                }
              );
            }
          }

          /*
           * Solo si no se pudo consultar el perfil usamos RPC.
           * Un RPC que devuelva "invitado" sin encontrar perfil NO
           * debe pisar un rol válido de public.perfiles.
           */
          if (!perfilConsultado) {
            try {
              const {
                data: rolRpc,
                error: rpcError
              } = await cliente.rpc("rol_actual");

              if (
                !rpcError &&
                rolRpc &&
                String(rolRpc).trim().toLowerCase() !==
                  "invitado"
              ) {
                perfilRol = String(rolRpc)
                  .trim()
                  .toLowerCase();
              }
            } catch (errorRpc) {
              console.warn(
                "[Supabase] RPC rol_actual no disponible:",
                errorRpc
              );
            }
          }
        } catch (error) {
          console.warn(
            "[Supabase] No se pudo obtener el perfil:",
            error
          );
        }
      }

      /*
       * Supabase manda. Un valor local "esAdmin=true" solo se
       * conserva como respaldo si Supabase no pudo proporcionar
       * absolutamente ningún dato del rol.
       */
      const adminPorSesion =
        !perfilConsultado &&
        !perfilRol &&
        sessionStorage.getItem("esAdmin") === "true";

      if (perfilRol === "admin" || adminPorSesion) {
        rol = "admin";
        sessionStorage.setItem("esAdmin", "true");
      } else {
        rol = "invitado";
        sessionStorage.setItem("esAdmin", "false");
      }

      console.info("[Supabase] Rol detectado:", {
        usuario: usuario?.email || "(sin usuario)",
        rolSupabase: perfilRol || "(sin rol)",
        rolAplicacion: rol
      });

      /*
       * La configuración se obtiene SIEMPRE desde Supabase según el rol.
       *
       * ADMIN:
       *   configuracion_privada -> gh_repo + gh_token
       *
       * INVITADO:
       *   configuracion_publica -> gh_repo + gh_token
       */
      const tablaConfiguracion =
        rol === "admin"
          ? "configuracion_privada"
          : "configuracion_publica";

      const resConfiguracion =
        await window.PermisosSupabase.consultarTablaConFallback(
          cliente,
          tablaConfiguracion,
          (tabla) =>
            tabla
              .select("clave, valor")
              .in("clave", ["gh_repo", "gh_token"])
        );

      if (resConfiguracion.error) {
        console.error(
          `[Supabase] Error leyendo ${tablaConfiguracion}:`,
          resConfiguracion.error
        );
      }

      const configuracion = {};
      for (const fila of resConfiguracion.data || []) {
        configuracion[String(fila.clave)] = String(fila.valor || "").trim();
      }

      const repo = configuracion.gh_repo || "";
      const token = configuracion.gh_token || "";

      window.GITHUB_CONFIG = {
        ...(window.GITHUB_CONFIG || {}),
        repo,
        token
      };

      console.info("[Supabase] Configuración GitHub recibida:", {
        rol,
        tabla: tablaConfiguracion,
        gh_repo: repo || "(vacío)",
        gh_token: token
          ? `${token.slice(0, 4)}…${token.slice(-4)}`
          : "(vacío)"
      });

      if (window.PermisosCrypto) {
        window.PermisosCrypto.asegurarConfigSegura(token, repo);
      }

      await cargarAjustesServidor();

      if (
        window.Ajustes &&
        typeof window.Ajustes.asegurarBotonAjustes === "function"
      ) {
        window.Ajustes.asegurarBotonAjustes();
      }

      return;
    } catch (error) {
      console.error("[Supabase] Error cargando sesión/configuración:", error);

      rol =
        sessionStorage.getItem("esAdmin") === "true"
          ? "admin"
          : "invitado";
    }
  };

  
  const valoresAjustes = { modo_oscuro: false, descargar_todas_clases: false, descargar_asignatura: false, descargar_curso: false, descargar_asignatura_todos: false, visor_activo: true, visor_en_tareas: true, visor_en_asignaturas: true, visor_en_trimestres: true, visor_en_grados: true, visor_en_selector_ramas: true, descargas_en_selector_ramas: true, }; const obtenerAjuste = (clave, def = false) => { if (valoresAjustes[clave] !== undefined) return Boolean(valoresAjustes[clave]); try { const v = localStorage.getItem(`ajustes_${clave}`); return v === null ? def : v === "true"; } catch (e) { return def; } }; const guardarConfig = async (clave, valor) => { const esTrue = Boolean(valor); valoresAjustes[clave] = esTrue; try { localStorage.setItem(`ajustes_${clave}`, esTrue ? "true" : "false"); } catch (e) { } if (clave === "modo_oscuro") { try { localStorage.setItem("modo_oscuro", esTrue ? "true" : "false"); } catch (e) { } } if (rol !== "admin") return; const cliente = window.PermisosSupabase ? await window.PermisosSupabase.esperarCliente() : null; if (!cliente) return; try { const { data: perfilData, error: errorPerfil } = await window.PermisosSupabase.consultarTablaConFallback(cliente, "perfiles", (t) => t.select("rol").eq("id", usuario.id).maybeSingle()); if (!errorPerfil && perfilData && perfilData.rol === "admin") { await window.PermisosSupabase.getTabla(cliente, "configuracion_privada").upsert({ clave, valor: String(esTrue) }, { onConflict: "clave" }); } } catch (e) { } }; const normalizarRamaNombre = (ramaStr) => { if (!ramaStr) return ""; let r = String(ramaStr).trim(); return r; }; const cargarAjustesServidor = async () => { if (!usuario || rol !== "admin") return valoresAjustes; const cliente = window.PermisosSupabase ? await window.PermisosSupabase.esperarCliente() : null; if (!cliente) return valoresAjustes; try { const { data: perfilData, error: errorPerfil } = await window.PermisosSupabase.consultarTablaConFallback(cliente, "perfiles", (t) => t.select("rol").eq("id", usuario.id).maybeSingle()); if (!errorPerfil && perfilData && perfilData.rol === "admin") { const res = await window.PermisosSupabase.consultarTablaConFallback(cliente, "configuracion_privada", (t) => t.select("clave, valor").in("clave", [CLAVES_AJUSTES.modoOscuro, CLAVES_AJUSTES.invitados, CLAVES_AJUSTES.descargarTodas, CLAVES_AJUSTES.descargarAsignatura, CLAVES_AJUSTES.descargarCurso, CLAVES_AJUSTES.descargarAsignaturaTodos, CLAVES_AJUSTES.visorActivo, CLAVES_AJUSTES.visorEnTareas, CLAVES_AJUSTES.visorEnAsignaturas, CLAVES_AJUSTES.visorEnTrimestres, CLAVES_AJUSTES.visorEnGrados, CLAVES_AJUSTES.visorEnSelectorRamas, CLAVES_AJUSTES.descargasEnSelectorRamas,])); if (!res.error && res.data) { res.data.forEach((fila) => { if (fila.clave === CLAVES_AJUSTES.invitados) { invitadosActivos = fila.valor !== "false"; try { localStorage.setItem(CLAVE_INVITADOS_ACTIVOS, invitadosActivos ? "true" : "false"); } catch (e) { } } else if (fila.clave === CLAVES_AJUSTES.modoOscuro) { const esDark = fila.valor === "true"; valoresAjustes[fila.clave] = esDark; if (rol === "admin") { try { localStorage.setItem("modo_oscuro", esDark ? "true" : "false"); } catch (e) { } if (esDark) document.body.classList.add("modo-oscuro"); else document.body.classList.remove("modo-oscuro"); } } else { const esTrue = fila.valor === "true"; valoresAjustes[fila.clave] = esTrue; try { localStorage.setItem(`ajustes_${fila.clave}`, esTrue ? "true" : "false"); } catch (e) { } } }); } } } catch (e) { } try { window.dispatchEvent(new CustomEvent("ajustes-servidor-cargados")); } catch (e) { } return valoresAjustes; }; const leerCsv = async (nombreCsv, rama) => { await asegurarSesion(); const r = String(rama || ramaActual() || "").trim(); if (!r) return null; const claveCache = `cache_file_${r}_${nombreCsv}`; let contenidoFresco = null; try { const config = window.GITHUB_CONFIG || {}; const tokenSeguro = typeof config.obtenerTokenSeguro === "function" ? config.obtenerTokenSeguro() : (config.token || ""); const repoPrivado = String(config.repo || "").trim(); const repoReal = "nataliagamezbarea/GRADOS_INFORMATICOS"; const repos = [repoPrivado, repoReal].filter(Boolean).filter((repo, i, a) => a.indexOf(repo) === i); for (const repo of repos) { const resG = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(nombreCsv)}?ref=${encodeURIComponent(r)}`, { headers: { ...(tokenSeguro ? { Authorization: `Bearer ${tokenSeguro}` } : {}), Accept: "application/vnd.github+json", }, }); if (!resG.ok) continue; const datos = await resG.json(); if (datos && datos.content && window.PermisosCrypto) { contenidoFresco = window.PermisosCrypto.decodificarBase64(datos.content); break; } } } catch (e) { } if (!contenidoFresco) { try { const config = window.GITHUB_CONFIG || {}; const repo = config.repo || ""; const rawUrl = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(r)}/${encodeURIComponent(nombreCsv)}`; const resRaw = await fetch(rawUrl); if (resRaw.ok) { contenidoFresco = (await resRaw.text()).replace(/^\uFEFF/, ""); } } catch (e) { } } if (contenidoFresco) { try { localStorage.setItem(claveCache, contenidoFresco); } catch (e) { } return contenidoFresco; } try { const enCache = localStorage.getItem(claveCache); if (enCache) return enCache; } catch (e) { } return null; }; const listarRamasStorage = async () => { try { if (window.supabaseClient) { const { data, error } = await window.supabaseClient.storage.from("csv-grados").list("", { limit: 100 }); if (!error && Array.isArray(data) && data.length > 0) { return data.map((item) => item.name).filter((n) => n && n !== ".emptyFolderPlaceholder" && String(n).toLowerCase() !== "master"); } } } catch (e) { } return []; }; 
  return {
    BUCKET_CSV, get usuario() { return usuario; }, get rol() { return rol; }, get esAdmin() { return rol === "admin"; }, get vistaInvitado() { return rol === "admin" && modoEdicionActivo(); }, setVistaInvitado(vista) { vistaInvitadoModo = Boolean(vista); try { localStorage.setItem("vista_invitado", vistaInvitadoModo ? "true" : "false"); } catch (e) { } }, get invitadosActivos() { return invitadosActivos; }, setInvitadosActivos(activo) { invitadosActivos = Boolean(activo); try { localStorage.setItem(CLAVE_INVITADOS_ACTIVOS, invitadosActivos ? "true" : "false"); } catch (e) { } guardarConfig(CLAVES_AJUSTES.invitados, invitadosActivos); }, get sesionCargada() { return sesionCargada; }, cargoSesion, asegurarSesion, guardarConfig, cargarAjustesServidor, obtenerAjuste, listarRamasStorage, cargarArchivos: (a, t) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.cargarArchivos(a, t) : new Map()), puedeVer: (s, n) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.puedeVer(s, n, rol === "admin", modoEdicionActivo()) : false), esVisibleParaInvitado: (s, n) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.esVisibleParaInvitado(s, n) : false), esArchivoVisibleParaInvitado: (s, nf, na) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.esArchivoVisibleParaInvitado(s, nf, na) : true), guardarVisibilidad: (a, t, s, n, v) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.guardarVisibilidad(a, t, s, n, v) : { error: null }), guardarVisibilidadArchivo: (a, t, s, nf, na, v) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.guardarVisibilidadArchivo(a, t, s, nf, na, v) : { error: null }), guardarVisibilidadSeccion: (a, t, s, l, v) => (window.PermisosVisibilidad ? window.PermisosVisibilidad.guardarVisibilidadSeccion(a, t, s, l, v) : { error: null }), verificarAdmin: (user, c, t) => (window.PermisosGithub ? window.PermisosGithub.verificarAdmin(user, c, t) : false), leerCsv, esLocal, ramaActual,   };
})(); 