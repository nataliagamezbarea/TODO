# V35 — correcciones de navegación, caché, ajustes, errores y responsive

- **Atrás / ramas:** el contexto de navegación distingue entre conservar la rama al volver dentro del curso y eliminarla al salir al selector. Al salir de la rama se limpian `localStorage`/`sessionStorage`, por lo que el selector vuelve a `SELECCIONAR`.
- **Contexto:** los valores vacíos ahora eliminan claves persistidas y el contexto completo se sincroniza al cambiar de vista, evitando ramas/trimestres/asignaturas antiguas.
- **Caché:** los CSV/JSON usan caché local primero y actualización en segundo plano. Así Atrás puede mostrar la última información disponible mientras llega GitHub; cuando cambia el contenido se actualiza la caché y se notifica a la interfaz.
- **Ajustes:** `js/componentes/ajustes.js` se carga realmente en las vistas internas y el panel se sincroniza al terminar la carga de Supabase. Los cambios de configuración repintan las acciones de descarga/visor.
- **Descargas de trimestres:** se mantienen conectadas a `descargar_todas_clases` y se repintan cuando la configuración cambia.
- **404 público:** la visibilidad comprueba primero los archivos existentes en la rama pública y evita pedir CSV que no existen.
- **PDF.js:** se usa la copia local de PDF.js y su worker local, configurado después de cargar la librería, eliminando el aviso de worker no configurado y la dependencia del CDN para el worker.
- **Responsive:** portada, barra de navegación y renderizado PDF se adaptan al ancho disponible sin forzar scroll horizontal.
