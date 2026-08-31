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
    login: "componentes-dsd/indice/vistas/inicio-sesion.html",
    inicio: "componentes-dsd/indice/vistas/inicio.html",
    clase: "componentes-dsd/indice/vistas/clase.html",
    asignaturas: "componentes-dsd/indice/vistas/asignaturas.html",
    asignatura: "componentes-dsd/indice/vistas/asignatura.html",
    apuntes: "componentes-dsd/indice/vistas/apuntes.html"
  };
  const CSS = {"core":["css/global/base.css","css/global/iconos.css","css/global/barra-navegacion-base.css","css/global/barra-navegacion-oscuro.css","css/global/barra-navegacion-botones.css","css/global/barra-navegacion-botones-oscuro.css","css/global/barra-navegacion-botones-varios.css","css/global/tabla.css","css/global/tabla-varios.css","css/global/panel-configuracion.css","css/global/panel-configuracion-varios.css","css/global/autenticacion.css","css/botones/animaciones.css","css/botones/claro.css","css/botones/oscuro.css","css/componentes/indice-en-linea.css","css/componentes/dsd-componentes.css","css/componentes/carcasa-sombra-declarativa.css"],"login":["css/botones/oscuro.css","css/inicio-sesion/base.css","css/inicio-sesion/base-2.css","css/inicio-sesion/botones.css"],"inicio":["css/botones/oscuro.css","css/barra-navegacion/base.css","css/barra-navegacion/elementos.css","css/barra-navegacion/oscuro.css","css/barra-navegacion/responsivo.css","css/notificador/emergente.css","css/notificador/notificacion.css","css/notificador/progreso.css","css/notificador/insignias.css","css/archivos/archivos.css","css/archivos/archivos-varios.css","css/inicio/base.css","css/inicio/base-2.css","css/inicio/selector.css","css/inicio/flexion.css","css/inicio/oscuro.css","css/inicio/oscuro-varios.css","css/inicio/claro.css","css/inicio/claro-varios.css","css/ajustes/boton.css","css/ajustes/panel.css","css/ajustes/panel-varios.css","css/ajustes/panel-oscuro.css","css/ajustes/panel-oscuro-varios.css","css/ajustes/oscuro.css"],"clase":["css/botones/oscuro.css","css/barra-navegacion/base.css","css/barra-navegacion/elementos.css","css/barra-navegacion/oscuro.css","css/barra-navegacion/responsivo.css","css/notificador/emergente.css","css/notificador/notificacion.css","css/notificador/progreso.css","css/notificador/insignias.css","css/archivos/archivos.css","css/archivos/archivos-varios.css","css/inicio/base.css","css/inicio/base-2.css","css/inicio/selector.css","css/inicio/flexion.css","css/inicio/oscuro.css","css/inicio/oscuro-varios.css","css/inicio/claro.css","css/inicio/claro-varios.css","css/ajustes/boton.css","css/ajustes/panel.css","css/ajustes/panel-varios.css","css/ajustes/panel-oscuro.css","css/ajustes/panel-oscuro-varios.css","css/ajustes/oscuro.css"],"asignaturas":["css/botones/oscuro.css","css/barra-navegacion/base.css","css/barra-navegacion/elementos.css","css/barra-navegacion/oscuro.css","css/barra-navegacion/responsivo.css","css/notificador/emergente.css","css/notificador/notificacion.css","css/notificador/progreso.css","css/notificador/insignias.css","css/archivos/archivos.css","css/archivos/archivos-varios.css","css/portada/portada-emoji.css","css/trimestre/trimestre.css","css/ajustes/boton.css","css/ajustes/panel.css","css/ajustes/panel-varios.css","css/ajustes/panel-oscuro.css","css/ajustes/panel-oscuro-varios.css","css/ajustes/oscuro.css"],"asignatura":["css/botones/oscuro.css","css/barra-navegacion/base.css","css/barra-navegacion/elementos.css","css/barra-navegacion/oscuro.css","css/barra-navegacion/responsivo.css","css/notificador/emergente.css","css/notificador/notificacion.css","css/notificador/progreso.css","css/notificador/insignias.css","css/archivos/archivos.css","css/archivos/archivos-varios.css","css/portada/portada-emoji.css","css/asignatura/base.css","css/asignatura/tarjetas.css","css/asignatura/tabla.css","css/asignatura/interruptor.css","css/asignatura/archivo.css","css/asignatura/archivo-enlaces.css","css/asignatura/conmutador.css","css/asignatura/oscuro.css","css/asignatura/oscuro-varios.css","css/asignatura/oscuro-varios-2.css","css/ventana-emergente/ventana-emergente.css","css/ajustes/boton.css","css/ajustes/panel.css","css/ajustes/panel-varios.css","css/ajustes/panel-oscuro.css","css/ajustes/panel-oscuro-varios.css","css/ajustes/oscuro.css"],"apuntes":["css/botones/oscuro.css","css/barra-navegacion/base.css","css/barra-navegacion/elementos.css","css/barra-navegacion/oscuro.css","css/barra-navegacion/responsivo.css","css/notificador/emergente.css","css/notificador/notificacion.css","css/notificador/progreso.css","css/notificador/insignias.css","css/archivos/archivos.css","css/archivos/archivos-varios.css","css/asignatura/base.css","css/asignatura/tarjetas.css","css/asignatura/tabla.css","css/asignatura/interruptor.css","css/asignatura/archivo.css","css/asignatura/archivo-enlaces.css","css/asignatura/conmutador.css","css/asignatura/oscuro.css","css/asignatura/oscuro-varios.css","css/asignatura/oscuro-varios-2.css","css/apuntes/base.css","css/apuntes/valores.css","css/apuntes/archivos.css","css/apuntes/permisos.css","css/apuntes/oscuro.css","css/ventana-emergente/ventana-emergente.css","css/ajustes/boton.css","css/ajustes/panel.css","css/ajustes/panel-varios.css","css/ajustes/panel-oscuro.css","css/ajustes/panel-oscuro-varios.css","css/ajustes/oscuro.css"]};
  const FONT_AWESOME_CSS = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  // PapaParse es una dependencia compartida de los renderizadores/servicios CSV.
  // Se carga una sola vez y antes de cualquier vista que la necesite.
  const PAPAPARSE_URL = "js/proveedor-procesador-csv.js";
  const SCRIPTS = {
    login: ["js/vistas/inicio-sesion.js"],
    inicio: ["js/servicios/rama-api.js","js/componentes/barra-navegacion.js","js/componentes/barra-navegacion/barra-navegacion-movil.js","js/componentes/ajustes.js","js/componentes/barra-navegacion/barra-navegacion-modo-edicion.js","js/componentes/emojis.js","js/servicios/rama.js","js/vistas/selector_rama_utilidades.js","js/vistas/indice_rama.js","js/servicios/informacion.js","js/descargas/notificador.js","js/descargas/recolector_direcciones.js","js/descargas/ziper.js","js/descargas/exportador_proyecto.js","js/modales/previsualizador.js","js/modales/visor-administradoristradoristrador-integrado.js?v=41","js/modales/gestor-archivos-emergente.js","js/renderizadores/mostrar_archivos.js","js/renderizadores/mostrar_datos.js"],
    clase: ["js/componentes/ajustes.js","js/vistas/clase.js","js/servicios/trimestres.js","js/vistas/volver_atras.js"],
    asignaturas: ["js/componentes/ajustes.js","js/vistas/trimestre.js","js/servicios/trimestres.js","js/vistas/volver_atras.js"],
    asignatura: ["js/componentes/ajustes.js","js/renderizadores/mostrar_archivos.js","js/renderizadores/mostrar_datos.js","js/vistas/volver_atras.js"],
    apuntes: ["js/componentes/ajustes.js","js/renderizadores/mostrar_archivos.js","js/renderizadores/apuntes_practicas_ejercicios_tareas.js","js/vistas/volver_atras.js"]
  };
  let actual = null, contexto = {}, cargadosJS = new Set(), cargadosCSS = new Set(), promesasJS = new Map(), promesasCSS = new Map();
  // Las transiciones se serializan para que al pulsar Atrás no queden cargas CSS
  // antiguas terminando después de la nueva vista y sobrescribiendo su diseño.
  let colaTransiciones = Promise.resolve();
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
  async function asegurarPapaParse() {
    if (window.Papa && typeof window.Papa.parse === "function") return;
    const existente = document.querySelector('script[data-papaparse="1"]');
    if (existente) {
      await new Promise((resolve, reject) => {
        if (window.Papa && typeof window.Papa.parse === "function") return resolve();
        existente.addEventListener("load", resolve, { once: true });
        existente.addEventListener("error", () => reject(new Error("No se pudo cargar PapaParse")), { once: true });
      });
      return;
    }
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PAPAPARSE_URL;
      script.dataset.papaparse = "1";
      script.onload = () => {
        if (window.Papa && typeof window.Papa.parse === "function") resolve();
        else reject(new Error("PapaParse se cargó pero no expuso window.Papa"));
      };
      script.onerror = () => reject(new Error("No se pudo cargar PapaParse"));
      document.head.appendChild(script);
    });
  }
  async function montar(nombre) {
    const path=COMPONENTS[nombre];
    if(!path) throw new Error("Componente no definido: "+nombre);
    const cssSet=[...CSS.core];
    if(nombre!=="login") cssSet.push(...(CSS.navbar||[]));
    cssSet.push(FONT_AWESOME_CSS);
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
      const navHTML=extraerBody(await obtenerHTML("componentes-dsd/comunes/barra-navegacion/barra-navegacion-general.html"));
      const navHost=document.createElement("div"); navHost.className="app-navbar-host";
      insertarHTML(navHost,navHTML);
      r.insertBefore(navHost,r.firstChild);
      const nav=document.querySelector("navbar-general") || r.querySelector("navbar-general");
      if(nav) nav.hidden=false;
    }
    // Las vistas que leen CSV necesitan PapaParse antes de ejecutar sus scripts.
    if (nombre !== "login") {
      try { await asegurarPapaParse(); } catch (e) { void 0; }
    }
    for(const s of SCRIPTS[nombre]||[]) try { await cargarJS(s); } catch(e) { void 0; }
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
      try { await window.__pintarDetalle(); } catch(e) { void 0; }
    }
    if(nombre==="asignatura") {
      // mostrar_datos.js puede haber sido cargado anteriormente (por inicio).
      // Re-inicializarlo hace que vuelva a leer rama/trimestre/asignatura del
      // contexto actual y vuelva a pintar título, emoji y tablas sobre el DSD nuevo.
      if (typeof window.inicializarMostrarDatos === "function") {
        try { window.inicializarMostrarDatos(); } catch(e) { void 0; }
      }
      if (typeof window.__pintarTodo === "function") {
        try { await window.__pintarTodo(); } catch(e) { void 0; }
      }
    }
  }
  async function mostrarInterno(nombre, datos={}, opciones={}) {
    nombre=String(nombre||"").toLowerCase(); if(!V.has(nombre)) nombre="inicio";
    const datosNuevos = datos || {};
    const contextoSiguiente = {...contexto};
    Object.entries(datosNuevos).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v) === "") delete contextoSiguiente[k];
      else contextoSiguiente[k] = v;
    });
    if(actual===nombre && !opciones.forzar) {
      contexto = contextoSiguiente;
      return;
    }
    contexto = contextoSiguiente;
    if(window.Estado) try {
      window.Estado.establecerContexto?.(contextoSiguiente);
      Object.entries(datosNuevos).forEach(([k,v])=>window.Estado.guardar?.(k,v));
    } catch(_){}
    await montar(nombre);
    actual=nombre; document.body.dataset.vista=nombre; document.documentElement.dataset.vista=nombre;
    window.dispatchEvent(new CustomEvent("app-vista-cambiada",{detail:{vista:nombre,contexto:{...contexto}}}));
  }
  function mostrar(nombre, datos={}, opciones={}) {
    const ejecutar = () => mostrarInterno(nombre, datos, opciones);
    // Cada cambio de vista espera a que termine el anterior. Así nunca quedan
    // dos juegos de CSS/HTML desmontándose y montándose a la vez.
    const siguiente = colaTransiciones.then(ejecutar, ejecutar);
    colaTransiciones = siguiente.catch(() => {});
    return siguiente;
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
  const volverAtras = () => {
    // El flujo es jerárquico, no depende del historial del navegador.
    // Así Atrás siempre retrocede exactamente un paso y nunca salta a Inicio.
    const ctx = {...contexto};
    if (actual === "apuntes") {
      delete ctx.seccion;
      return mostrar("asignatura", ctx, {reemplazar:true, forzar:true});
    }
    if (actual === "asignatura") {
      delete ctx.asignatura;
      return mostrar("asignaturas", ctx, {reemplazar:true, forzar:true});
    }
    if (actual === "asignaturas") {
      delete ctx.trimestre;
      delete ctx.asignatura;
      return mostrar("clase", ctx, {reemplazar:true, forzar:true});
    }
    if (actual === "clase") {
      // Al volver al selector de ramas se debe mostrar siempre
      // "SELECCIONAR", no conservar visualmente la rama anterior.
      delete ctx.rama;
      delete ctx.trimestre;
      delete ctx.asignatura;
      try { window.RamaActual?.limpiar?.(); } catch (_) { try { window.RamaActual?.guardar?.(""); } catch (_) {} }
      try { window.Estado?.guardar?.("rama", ""); } catch (_) {}
      return mostrar("inicio", ctx, {reemplazar:true, forzar:true});
    }
    return mostrar("inicio", {}, {reemplazar:true, forzar:true});
  };
  window.AppViews={
    mostrar,
    navegar,
    irInicio:()=>{
      let rama="";
      try { rama=String(window.Estado?.obtener?.("rama") || "").trim(); } catch (_) {}
      if(!rama){ try { rama=String(window.RamaActual?.obtener?.() || "").trim(); } catch (_) {} }
      return rama ? mostrar("clase",{rama},{reemplazar:true,forzar:true}) : mostrar("inicio",{},{reemplazar:true,forzar:true});
    },
    atras:volverAtras,
    obtener:()=>actual,
    contexto:()=>({...contexto})
  };
  // La aplicación es siempre /; cualquier query usada para recuperar contexto
  // se guarda y se elimina de la barra sin convertirla en una ruta visible.
  if (window.location.pathname !== "/" && window.history?.replaceState) {
    try { window.history.replaceState({}, document.title, "/"); } catch (_) {}
  }
  window.__mostrarVista=mostrar;
  window.addEventListener("app-navegar",e=>{const d=e.detail||{}; navegar(d.ruta||d.vista,d.contexto||{});});
  // La ruta inicial la decide autenticacion.js cuando Supabase ya ha resuelto la sesión.
  // No hacemos un segundo arranque aquí: hacerlo antes provocaba que una sesión
  // ya existente entrase primero en el selector y luego se corrigiera tarde.
  window.addEventListener("DOMContentLoaded", ()=>{
    if(window.Estado && typeof window.Estado.navegar==="function") {
      window.Estado.navegar=(r,d={})=>navegar(r,d);
    }
  },{once:true});
})();
