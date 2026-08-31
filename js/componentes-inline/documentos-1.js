// Esta ruta SÍ es el acceso directo al visor. No añade ningún botón ni pantalla
  // adicional en la plataforma: simplemente abre el visor integrado/administrativo.
  // Los accesos desde grados, trimestres y tareas siguen siendo los botones junto
  // a las descargas.
  const params = new URLSearchParams(location.search);
  const destino = new URL("/paginas/visor-admin/panel-administrador.html", location.origin);
  params.forEach((valor, clave) => destino.searchParams.set(clave, valor));
  location.replace(destino.href);
