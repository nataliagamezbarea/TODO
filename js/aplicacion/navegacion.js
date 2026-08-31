(() => {
  const VISTAS = {
    login: 'componentes/vistas/vista-login.html',
    inicio: 'componentes/vistas/vista-inicio.html',
    clase: 'componentes/vistas/vista-clase.html',
    asignaturas: 'componentes/vistas/vista-asignaturas.html',
    asignatura: 'componentes/vistas/vista-asignatura.html',
    apuntes: 'componentes/vistas/vista-apuntes.html',
    documentos: 'componentes/vistas/vista-documentos.html',
    visor: 'componentes/vistas/vista-visor-admin.html'
  };
  const RUTAS = Object.entries(VISTAS).reduce((m,[k,v]) => { m[v]=k; return m; }, {});
  const claveVista = 'app_vista_actual';
  const claveContexto = 'app_contexto_vista';
  function vistaActual() { return sessionStorage.getItem(claveVista) || ''; }
  function contextoActual() { try { return JSON.parse(sessionStorage.getItem(claveContexto)||'{}'); } catch (_) { return {}; } }
  function guardar(vista, contexto={}) {
    sessionStorage.setItem(claveVista, vista);
    try { sessionStorage.setItem(claveContexto, JSON.stringify(contexto||{})); } catch (_) {}
  }
  function vistaDesdeRuta(ruta='') {
    try {
      const u = new URL(ruta, location.origin);
      const path = u.pathname;
      for (const [v,p] of Object.entries(VISTAS)) {
        if (path === '/' + p || path === p || path.endsWith('/'+p.split('/').pop())) return v;
      }
      if (/iniciar-sesion\.html|login\.html/i.test(path)) return 'login';
      if (/panel-administrador\.html|visualizar-documentos\.html|visor\.html/i.test(path)) return 'visor';
      if (/\/clase\.html$/i.test(path)) return 'clase';
      if (/\/asignaturas\.html$/i.test(path)) return 'asignaturas';
      if (/\/asignatura\.html$/i.test(path)) return 'asignatura';
      if (/\/apuntes\.html$/i.test(path)) return 'apuntes';
      if (/\/inicio\.html$/i.test(path)) return 'inicio';
    } catch (_) {}
    return '';
  }
  function ir(vista, contexto={}) {
    if (!VISTAS[vista]) throw new Error('Vista no registrada: '+vista);
    guardar(vista, contexto);
    // En la raíz, cambiaremos el contenido sin recargar toda la página.
    // Esto evita que el selector de ramas entre en un ciclo de recargas.
    if (location.pathname === '/' && !location.search && !location.hash && window.CargadorVistas?.cargarVista) {
      window.CargadorVistas.cargarVista(vista, contexto).catch(error => console.error('Error cargando vista:', error));
      return;
    }
    location.replace('/');
  }
  function irDesdeRuta(ruta, contexto={}) {
    const v = vistaDesdeRuta(ruta) || 'inicio';
    let ctx = {...contexto};
    try { const u=new URL(ruta,location.origin); u.searchParams.forEach((val,key)=>ctx[key]=val); } catch (_) {}
    ir(v,ctx);
  }
  window.NavegacionApp = { VISTAS, vistaActual, contextoActual, guardar, ir, irDesdeRuta, vistaDesdeRuta };
  window.addEventListener('click', e => {
    const a=e.target.closest?.('a[href]'); if(!a) return;
    const href=a.getAttribute('href')||'';
    if(!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    const v=vistaDesdeRuta(href); if(!v) return;
    e.preventDefault();
    const u=new URL(href,location.origin); const ctx={}; u.searchParams.forEach((val,key)=>ctx[key]=val);
    ir(v,ctx);
  }, true);
})();
