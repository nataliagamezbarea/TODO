# Configuración Supabase por rol

Después del login, la aplicación obtiene:

- admin -> `configuracion_privada.gh_repo` + `configuracion_privada.gh_token`
- invitado -> `configuracion_publica.gh_repo` + `configuracion_publica.gh_token`

El selector de ramas usa el repositorio activo de `window.GITHUB_CONFIG` y las ramas se consultan directamente a GitHub.

En consola se imprime la tabla, rol, repositorio activo y `gh_repo`; el token se muestra parcialmente oculto.
