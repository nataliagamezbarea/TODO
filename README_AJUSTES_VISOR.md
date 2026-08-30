# Ajustes del visor

Los ajustes del visor se guardan en `grados-informaticos.configuracion_privada` y son solo para administradores.

- `visor_activo`: habilita/deshabilita el visor.
- `visor_en_tareas`: muestra el acceso dentro de las tareas.
- `visor_en_trimestres`: muestra el acceso en la vista del trimestre.

Por defecto los tres están activos.


## Integración
El visor-admin forma parte de la plataforma y reutiliza `js/nucleo/auth.js`, `js/nucleo/permisos.js` y los servicios globales. No tiene autenticación, configuración ni SQL propios. `supabase/esquema_grados.sql` es el SQL global del proyecto.


### Integración única
- El visor reutiliza la autenticación global de `js/nucleo/auth.js`; no existe autenticación propia del visor.
- La configuración Supabase/GitHub procede de la configuración global y de `configuracion_privada`/`configuracion_publica`.
- El SQL es únicamente `supabase/esquema_grados.sql`; no hay SQL específico del visor.
- Los estilos del visor están consolidados en `css/visor_admin.css`.
- El código del visor está consolidado bajo `js/visor-admin/`.
- La URL directa `modulos/visor.html` sigue siendo válida y abre `visor-admin/index.html`.
