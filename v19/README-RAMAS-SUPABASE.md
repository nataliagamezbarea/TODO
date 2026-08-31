# Flujo de ramas

1. `Permisos.asegurarSesion()` determina el rol.
2. ADMIN lee `configuracion_privada` y obtiene `gh_repo` + `gh_token`.
3. INVITADO lee `configuracion_publica` y obtiene `gh_repo` + `gh_token`.
4. `js/servicios/rama.js` usa `window.GITHUB_CONFIG.repo`.
5. Las ramas se solicitan directamente a GitHub mediante `/branches`.
6. No existe un repositorio hardcodeado para el selector.
7. En consola se muestra el rol, tabla, `gh_repo` y el token parcialmente oculto para depuración.

El selector excluye `master` y mantiene el resto de la lógica de selección, descarga y navegación.
