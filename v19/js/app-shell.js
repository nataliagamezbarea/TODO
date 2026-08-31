(() => {
  if (!window.AppDOM) {
    const originalGetElementById = Document.prototype.getElementById;
    const findInShadowRoots = (root, id, seen = new Set()) => {
      if (!root || seen.has(root)) return null;
      seen.add(root);
      const direct = root.querySelectorAll ? Array.from(root.querySelectorAll("[id]")).find((el) => el.id === id) : null;
      if (direct) return direct;
      const nodes = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (const node of nodes) {
        if (node.shadowRoot) {
          const found = findInShadowRoots(node.shadowRoot, id, seen);
          if (found) return found;
        }
      }
      return null;
    };
    window.AppDOM = {
      getById(id) { return originalGetElementById.call(document, id) || findInShadowRoots(document, id); }
    };
    Document.prototype.getElementById = function(id) {
      return window.AppDOM.getById(id);
    };
  }

  const V = new Set(["login","inicio","clase","asignaturas","asignatura","apuntes"]);
  const COMPONENTS = {
    login: "componentes-dsd/index/vistas/login.html",
    inicio: "componentes-dsd/index/vistas/inicio.html",
    clase: "componentes-dsd/index/vistas/clase.html",
    asignaturas: "componentes-dsd/index/vistas/asignaturas.html",
    asignatura: "componentes-dsd/index/vistas/asignatura.html",
    apuntes: "componentes-dsd/index/vistas/apuntes.html"
  };
  const CSS = {'core': ['css/global/base.css', 'css/global/iconos.css', 'css/global/barra-navegacion-base.css', 'css/global/barra-navegacion-oscuro.css', 'css/global/barra-navegacion-botones.css', 'css/global/barra-navegacion-botones-oscuro.css', 'css/global/barra-navegacion-botones-varios.css', 'css/global/tabla.css', 'css/global/tabla-varios.css', 'css/global/panel-configuracion.css', 'css/global/panel-configuracion-varios.css', 'css/global/autenticacion.css', 'css/botones/animaciones.css', 'css/botones/claro.css', 'css/botones/oscuro.css', 'css/componentes/index-inline.css', 'css/componentes/dsd-componentes.css', 'css/componentes/declarative-shadow-shell.css'], 'login': ['css/login/base.css', 'css/login/base-2.css', 'css/login/botones.css'], 'navbar': ['css/navbar/base.css', 'css/navbar/elementos.css', 'css/navbar/oscuro.css', 'css/navbar/responsivo.css'], 'inicio': ['css/notificador/modal.css', 'css/notificador/notificacion.css', 'css/notificador/progreso.css', 'css/notificador/insignias.css', 'css/archivos/archivos.css', 'css/archivos/archivos-varios.css', 'css/inicio/base.css', 'css/inicio/base-2.css', 'css/inicio/selector.css', 'css/inicio/flexion.css', 'css/inicio/oscuro.css', 'css/inicio/oscuro-varios.css', 'css/inicio/claro.css', 'css/inicio/claro-varios.css', 'css/ajustes/boton.css', 'css/ajustes/panel.css', 'css/ajustes/panel-varios.css', 'css/ajustes/panel-oscuro.css', 'css/ajustes/panel-oscuro-varios.css', 'css/ajustes/oscuro.css'], 'clase': ['css/inicio/base.css', 'css/inicio/base-2.css', 'css/inicio/selector.css', 'css/inicio/flexion.css', 'css/inicio/oscuro.css', 'css/inicio/oscuro-varios.css', 'css/inicio/claro.css', 'css/inicio/claro-varios.css'], 'asignaturas': ['css/portada/portada-emoji.css', 'css/trimestre/trimestre.css'], 'asignatura': ['css/portada/portada-emoji.css', 'css/asignatura/base.css', 'css/asignatura/tarjetas.css', 'css/asignatura/tabla.css', 'css/asignatura/interruptor.css', 'css/asignatura/archivo.css', 'css/asignatura/archivo-enlaces.css', 'css/asignatura/conmutador.css', 'css/asignatura/oscuro.css', 'css/asignatura/oscuro-varios.css', 'css/asignatura/oscuro-varios-2.css', 'css/popover/popover.css'], 'apuntes': ['css/popover/popover.css', 'css/apuntes/base.css', 'css/apuntes/valores.css', 'css/apuntes/archivos.css', 'css/apuntes/permisos.css', 'css/apuntes/oscuro.css', 'css/apuntes/responsivo.css']};
  const FONT_AWESOME_CSS = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  const SCRIPTS = {
    login: ["js/vistas/login.js"],
    inicio: ["js/componentes/navbar.js","js/componentes/navbar/navbar_movil.js","js/componentes/navbar/navbar_modo_edicion.js","js/componentes/emojis.js","js/vistas/selector_rama_utilidades.js","js/vistas/index_rama.js","js/servicios/rama.js","js/servicios/informacion.js","js/descargas/notificador.js","js/descargas/recolector_urls.js","js/descargas/ziper.js","js/descargas/exportador_proyecto.js","js/modales/previsualizador.js","js/modales/visor_admin_integrado.js","js/modales/gestor_archivos_modal.js","js/renderizadores/mostrar_archivos.js","js/renderizadores/mostrar_datos.js"],
    clase: ["js/vistas/clase.js","js/servicios/trimestres.js","js/vistas/volver_atras.js"],
    asignaturas: ["js/vistas/trimestre.js","js/servicios/trimestres.js","js/vistas/volver_atras.js"],
    asignatura: ["js/renderizadores/mostrar_archivos.js","js/renderizadores/mostrar_datos.js","js/renderizadores/apuntes_practicas_ejercicios_tareas.js","js/vistas/volver_atras.js"],
    apuntes: ["js/renderizadores/mostrar_archivos.js","js/renderizadores/apuntes_practicas_ejercicios_tareas.js","js/vistas/volver_atras.js"]
  };
  let actual = null, historial = [], contexto = {}, cargadosJS = new Set(), cargadosCSS = new Set(), promesasJS = new Map(), promesasCSS = new Map();
  const root = () => document.getElementById("app-root");
  function cargarCSS(path) {
    if (cargadosCSS.has(path)) return Promise.resolve();
    if (promesasCSS.has(path)) return promesasCSS.get(path);
    const promesa = new Promise((resolve, reject) => {
      const existente = document.head.querySelector(`link[data-app-dynamic-css="1"][href="${path}"]`);
      if (existente) {
        cargadosCSS.add(path); resolve(); return;
      }
      const l = document.createElement("link"); l.rel="stylesheet"; l.href=path; l.dataset.appDynamicCss="1";
      l.onload=()=>{cargadosCSS.add(path);promesasCSS.delete(path);resolve();};
      l.onerror=()=>{promesasCSS.delete(path);reject(new Error("CSS no encontrado: "+path));};
      document.head.appendChild(l);
    });
    promesasCSS.set(path,promesa);
    return promesa;
  }
  function descargarCSSDe(pathSet) {
    const keep = new Set(pathSet);
    document.head.querySelectorAll('link[data-app-dynamic-css="1"]').forEach(l => {
      if (!keep.has(l.getAttribute("href"))) { l.remove(); cargadosCSS.delete(l.getAttribute("href")); }
    });
  }
  function cargarJS(path) {
    if (cargadosJS.has(path)) return Promise.resolve();
    if (promesasJS.has(path)) return promesasJS.get(path);
    const existente = document.body.querySelector(`script[data-app-dynamic-script="1"][src="${path}"]`);
    if (existente) {
      const promesaExistente = new Promise((resolve,reject)=>{
        if (existente.dataset.loaded === "1") { cargadosJS.add(path); resolve(); return; }
        existente.addEventListener("load",()=>{cargadosJS.add(path);resolve();},{once:true});
        existente.addEventListener("error",()=>reject(new Error("JS no encontrado: "+path)),{once:true});
      });
      promesasJS.set(path,promesaExistente);
      return promesaExistente;
    }
    const promesa = new Promise((resolve,reject)=>{
      const s=document.createElement("script"); s.src=path; s.dataset.appDynamicScript="1";
      s.onload=()=>{s.dataset.loaded="1";cargadosJS.add(path);promesasJS.delete(path);resolve();};
      s.onerror=()=>{promesasJS.delete(path);reject(new Error("JS no encontrado: "+path));};
      document.body.appendChild(s);
    });
    promesasJS.set(path,promesa);
    return promesa;
  }
  async function obtenerHTML(path) {
    const res=await fetch(path, {cache:"no-store"});
    if(!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    return await res.text();
  }
  function extraerBody(html) {
    const m = String(html).match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return m ? m[1] : String(html);
  }
  function insertarHTML(host, html) {
    // setHTMLUnsafe preserva y activa Declarative Shadow DOM al insertar HTML dinámico.
    if (typeof host.setHTMLUnsafe === "function") { host.setHTMLUnsafe(html); return; }
    host.innerHTML = html;
  }
  async function montar(nombre) {
    const path=COMPONENTS[nombre];
    if(!path) throw new Error("Componente no definido: "+nombre);
    const cssSet=[...CSS.core];
    if(nombre!=="login") cssSet.push(...(CSS.navbar||[]));
    if(nombre!=="login") cssSet.push(FONT_AWESOME_CSS);
    cssSet.push(...(CSS[nombre]||[]));
    const unique=[...new Set(cssSet)];
    descargarCSSDe(unique);
    await Promise.all(unique.map(cargarCSS));
    const html=extraerBody(await obtenerHTML(path));
    const r=root(); if(!r) return;
    r.replaceChildren();
    insertarHTML(r,html);
    const vistaMontada = r.querySelector(`[data-app-view="${nombre}"]`);
    if (vistaMontada) vistaMontada.hidden = false;
    // La navbar es un componente independiente y solo se monta cuando hay sesión/vista interna.
    if(nombre!=="login") {
      const navHTML=extraerBody(await obtenerHTML("componentes-dsd/comunes/navbar/navbar-general.html"));
      const navHost=document.createElement("div"); navHost.className="app-navbar-host";
      insertarHTML(navHost,navHTML);
      r.insertBefore(navHost,r.firstChild);
      const nav=document.querySelector("navbar-general") || r.querySelector("navbar-general");
      if(nav) nav.hidden=false;
    }
    for(const s of SCRIPTS[nombre]||[]) try { await cargarJS(s); } catch(e) { console.error(e); }
    // Reinicializadores existentes.
    if(nombre==="login" && typeof window.inicializarVistaLogin==="function") await window.inicializarVistaLogin();
    if(nombre==="inicio" && typeof window.inicializarVistaInicio==="function") await window.inicializarVistaInicio();
    if(nombre==="clase" && typeof window.inicializarVistaClase==="function") await window.inicializarVistaClase();
    if(nombre==="asignaturas" && typeof window.inicializarVistaTrimestre==="function") await window.inicializarVistaTrimestre();
    // Los renderizadores pueden haber sido cargados en una vista anterior.
    // Al cambiar de vista el DOM se reconstruye, así que hay que repintar
    // explícitamente el contenido del nuevo componente sin volver a cargar
    // el mismo script (lo que provocaría redeclaraciones).
    if(nombre==="apuntes" && typeof window.__pintarDetalle==="function") {
      try { await window.__pintarDetalle(); } catch(e) { console.error("Error pintando apuntes:", e); }
    }
    if(nombre==="asignatura" && typeof window.__pintarTodo==="function") {
      try { await window.__pintarTodo(); } catch(e) { console.error("Error pintando asignatura:", e); }
    }
  }
  async function mostrar(nombre, datos={}, opciones={}) {
    nombre=String(nombre||"").toLowerCase(); if(!V.has(nombre)) nombre="inicio";
    Object.assign(contexto,datos||{});
    if(window.Estado && Object.keys(datos||{}).length) try { window.Estado.guardarContexto?.(datos); Object.entries(datos).forEach(([k,v])=>window.Estado.guardar?.(k,v)); } catch(_){}
    if(actual===nombre && !opciones.forzar) return;
    if(!opciones.reemplazar && actual) historial.push({vista:actual,contexto:{...contexto}});
    await montar(nombre);
    actual=nombre; document.body.dataset.vista=nombre; document.documentElement.dataset.vista=nombre;
    window.dispatchEvent(new CustomEvent("app-vista-cambiada",{detail:{vista:nombre,contexto:{...contexto}}}));
  }
  function navegar(ruta,datos={}) {
    const r=String(ruta||"");
    const ctx = datos || {};
    let n = "inicio";

    // La aplicación usa siempre la URL /: el destino se determina por el
    // contexto de navegación, no por una ruta HTML visible en el navegador.
    if (/apuntes\.html|\/apuntes\b/i.test(r)) n="apuntes";
    else if (/asignatura\.html/i.test(r)) n="asignatura";
    else if (/asignaturas\.html/i.test(r)) n="asignaturas";
    else if (/clase\.html/i.test(r)) n="clase";
    else if (/iniciar-sesion\.html|login/i.test(r)) n="login";
    else if (ctx.asignatura) n="asignatura";
    else if (ctx.trimestre) n="asignaturas";
    else if (ctx.rama) n="clase";
    else n="inicio";

    return mostrar(n,ctx);
  }
  window.AppViews={mostrar,navegar,irInicio:()=>mostrar("inicio"),atras:()=>{const x=historial.pop();return x?mostrar(x.vista,x.contexto,{reemplazar:true,forzar:true}):mostrar("inicio",{},{reemplazar:true,forzar:true})},obtener:()=>actual,contexto:()=>({...contexto})};
  window.__mostrarVista=mostrar;
  window.addEventListener("app-navegar",e=>{const d=e.detail||{}; navegar(d.ruta||d.vista,d.contexto||{});});
  window.addEventListener("DOMContentLoaded", async ()=>{
    if(window.Estado && typeof Estado.navegar==="function") Estado.navegar=(r,d={})=>navegar(r,d);
    const destino=sessionStorage.getItem("esInvitado")==="true"||window.sesionActual?"inicio":"login";
    try { await mostrar(destino,{},{reemplazar:true,forzar:true}); } catch(e) { console.error("Error cargando la vista inicial:",e); }
  },{once:true});
})();
