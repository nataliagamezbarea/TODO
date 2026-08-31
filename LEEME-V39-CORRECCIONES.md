# V39 — visor responsive y persistencia de rama

- El visor en tablet/móvil usa pestañas Original / Cómo quedaría en vez de encoger dos PDFs simultáneamente.
- En escritorio mantiene la comparación a dos columnas.
- La rama se conserva al recargar si ya existe una selección.
- Entrar expresamente al selector limpia la rama persistida y fuerza el selector en la siguiente carga.
- Cerrar sesión elimina la rama persistida, pero conserva la preferencia de tema.
- El servicio de rama se carga antes que las vistas que lo consumen.
