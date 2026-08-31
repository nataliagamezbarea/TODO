# Arquitectura modular V9

## Fuente canónica

Toda la interfaz HTML editable vive en `templates/html/`:

- `templates/html/paginas/` — páginas fuente (`inicio`, `modulos`, `visor-admin`).
- `templates/html/componentes/` — piezas reutilizables: navbar, buscadores, estados, cabeceras, tarjetas y bloques del visor.
- `templates/html/modales/` — **cada modal en su propio HTML**, separado del panel y de las páginas.

Los HTML públicos (`inicio.html`, `modulos/*.html`, `visor-admin/*.html`) son salidas compiladas y no deben editarse a mano.

## Regla de reutilización

Si un elemento aparece en más de una página, debe vivir en `templates/html/componentes/` y entrar mediante:

```html
<!-- @include: templates/html/componentes/navbar.html -->
```

Los modales siguen la misma regla, pero separados bajo `templates/html/modales/`:

```html
<!-- @include: templates/html/modales/visor-admin/modal-resumen.html -->
```

## Compilación

```bash
python herramientas/compilar_componentes.py
```

El compilador resuelve los `@include`, sustituye tokens y publica las páginas finales en sus rutas públicas.

## Responsive

`css/visor-admin/responsive-canonico.css` es la última capa de layout del visor. La navbar usa un único grid/flex responsive y los modales tienen límites de viewport para móvil, tablet y escritorio.

## Seguridad

El Visor Admin continúa protegido por `perfiles.rol = 'admin'` en Supabase. La interfaz no considera GitHub ni `sessionStorage` como fuente de privilegios.
