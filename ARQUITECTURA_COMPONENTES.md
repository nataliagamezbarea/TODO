# Arquitectura modular V7

## Objetivo

Evitar que la aplicación dependa de HTML repetido o de JavaScript que construye la interfaz.

### HTML
`componentes/` contiene piezas reutilizables.  
`plantillas/` contiene las páginas fuente.  
`herramientas/compilar_componentes.py` genera los HTML finales.

### CSS
- `css/componentes/tokens.css`: variables y reglas base.
- `css/componentes/componentes.css`: componentes comunes.
- `css/visor-admin/responsive-canonico.css`: responsive específico del visor.
- El resto del CSS queda reservado para estilos propios de una pantalla o módulo.

### JavaScript
- `js/componentes/core.js`: comportamiento UI común.
- `js/componentes/navbar.js`: comportamiento de navegación/tema/sesión.
- Los scripts de cada módulo mantienen únicamente la lógica de negocio.

**Regla:** JavaScript no debe crear la estructura base de navbar, tarjetas, modales, buscadores, etc. Esa estructura es HTML estático.

## Flujo

1. Editar `componentes/...`.
2. Si es necesario, editar `plantillas/...`.
3. Ejecutar `python herramientas/compilar_componentes.py`.
4. Publicar los HTML/CSS/JS resultantes.

No hace falta Node, SSR, backend ni servidor de componentes.
