# DSD — versión estática

Esta versión está preparada para ejecutarse **sin `servidor.py`, Flask, Python ni `/api` del servidor**.

## Arquitectura

- Frontend estático: HTML + CSS + JavaScript.
- Supabase: autenticación, roles y configuración.
- GitHub REST API: ramas, archivos, JSON de revisión, PDFs y escrituras.
- GitHub Actions: compilación remota de apuntes LaTeX.
- PDF.js en el navegador: visor y miniaturas.

El frontend conserva las rutas internas `/api/*` mediante `js/static-api.js`, que las traduce directamente a Supabase/GitHub. No hay servidor intermedio.

## Configuración

`js/config.js` contiene la URL y la publishable/anon key de Supabase.

En Supabase, dentro del schema `grados-informaticos`:

- `configuracion_privada`: `gh_repo_general`, `gh_token` (solo admin).
- `configuracion_publica`: `gh_repo_invitados` o `gh_repo_publico` (solo nombre del repo público).

El token no se guarda en `configuracion_publica`.

## Despliegue

Puede publicarse como sitio estático en GitHub Pages, Netlify, Cloudflare Pages, etc.

Para OAuth de Supabase no se recomienda abrir `index.html` con doble clic (`file://`); usa un hosting estático con HTTPS.

## Importante sobre la funcionalidad PDF

La lectura de PDFs, miniaturas, ramas y guardado de JSON se hace directamente desde el navegador.
La compilación de apuntes LaTeX se mantiene en GitHub Actions.
Las transformaciones PDF que antes se hacían con Python local se resuelven usando los PDFs de la rama `*_limpia` cuando están disponibles. No se ejecuta Python en el cliente.
