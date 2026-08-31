# V14 — Routing y tema global

- El tema se guarda en `localStorage["tema"]` como `light` o `dark`.
- `js/nucleo/tema-global.js` es la única fuente de verdad para cambiar/aplicar el tema.
- Todas las páginas aplican el tema antes del primer render para evitar el flash.
- Las rutas públicas son lógicas (`/inicio`, `/asignaturas`, `/asignatura`, etc.).
- `js/nucleo/router.js` resuelve la ruta a la vista HTML correspondiente.
- Los enlaces internos ya no apuntan a `/modulos/*.html`.
- Los HTML siguen existiendo como vistas compiladas, pero no son la URL pública.
- En producción se recomienda configurar el servidor para que las rutas lógicas hagan fallback al shell de la aplicación.
