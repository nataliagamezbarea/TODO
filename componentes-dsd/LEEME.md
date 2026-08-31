# Componentes HTML — Declarative Shadow DOM

Todos los componentes HTML se mantienen como archivos independientes dentro de `componentes-dsd/`. Cada componente tiene su propio `<template shadowrootmode="open">`.

La composición se materializa en las páginas HTML finales; no existe un cargador de componentes en JavaScript ni un router para montar HTML. JavaScript queda reservado para comportamiento y cada script continúa en su archivo `.js`.

## Reutilización

`comunes/navbar/navbar-general.html` es la navbar general. La aplicación principal la usa directamente y `visor-administradoristrador` la reutiliza dentro de `visor-navbar`, añadiendo sus botones y controles específicos del visor.

Los componentes internos del visor (botones, menús, modales, overlays, columnas, documentos, etc.) también tienen sus propios archivos HTML y su propio DSD.
