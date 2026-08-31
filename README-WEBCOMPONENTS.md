# Arquitectura reconstruida desde el ZIP original

- index.html es la única entrada pública.
- Las vistas se cargan como fragmentos HTML dentro de #contenido.
- Cada fragmento conserva sus enlaces CSS y sus scripts declarativos; el cargador ejecuta los scripts después de insertar el HTML.
- No se usa AppRouter.
- Estado.navegar delega en AppNavegacion y conserva la URL en /.
- Se conservan los JS originales y su orden de ejecución por vista.
- No se modifica la lógica de datos de GitHub/Supabase salvo la adaptación de navegación.
