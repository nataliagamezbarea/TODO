(() => {
  const destino = document.getElementById('contenido');
  const carga = document.getElementById('app-loading');
  const VISTAS = window.NavegacionApp.VISTAS;
  const vistaInicial = () => {
    const guardada = window.NavegacionApp.vistaActual();
    if (guardada && VISTAS[guardada]) return guardada;
    const invitado = sessionStorage.getItem('esInvitado') === 'true';
    const token = localStorage.getItem('sb-lztatgnlplpduiatmlrv-auth-token');
    return invitado || token ? 'inicio' : 'login';
  };
  const resolver = (href, base) => { try { return new URL(href, base).href; } catch (_) { return href; } };
  const cargarCSS = async (doc, baseUrl) => {
    for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))) {
      const href = resolver(link.getAttribute('href'), baseUrl);
      if (!href) continue;
      if (document.head.querySelector(`link[data-vista-css="${CSS.escape(href)}"]`)) continue;
      const nuevo = document.createElement('link'); nuevo.rel='stylesheet'; nuevo.href=href; nuevo.dataset.vistaCss=href; document.head.appendChild(nuevo);
    }
  };
  const cargarScript = (src, code, key) => new Promise((resolve,reject) => {
    if (src) {
      const s=document.createElement('script'); s.src=src; s.dataset.vistaScript=key||src;
      s.onload=()=>resolve(); s.onerror=()=>reject(new Error('No se pudo cargar '+src));
      document.head.appendChild(s); return;
    }
    try {
      const s=document.createElement('script'); s.textContent=code||''; s.dataset.vistaInline='1';
      document.head.appendChild(s); resolve();
    } catch(e){ reject(e); }
  });
  async function cargarVista(vista, contexto={}) {
    window.__APP_VISTA=vista;
    window.NavegacionApp.guardar(vista,contexto);
    const url=new URL(VISTAS[vista], location.origin).href;
    const res=await fetch(url); if(!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status}`);
    const html=await res.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const baseHref=doc.querySelector('base')?.getAttribute('href') || '/';
    const baseUrl=resolver(baseHref, location.origin+'/');
    await cargarCSS(doc, baseUrl);
    if(doc.title) document.title=doc.title;
    const scripts=[...doc.head.querySelectorAll('script'),...doc.body.querySelectorAll('script')];
    scripts.forEach(s=>s.remove());
    destino.innerHTML=doc.body.innerHTML;
    if(carga) carga.hidden=true;
    // Original scripts are executed in their original order, once per root page load.
    for(const s of scripts){
      const src=s.getAttribute('src');
      if(src && /SUPABASETOKEN_/i.test(src)) continue;
      await cargarScript(src ? resolver(src,baseUrl) : '', src ? '' : s.textContent, src ? resolver(src,baseUrl) : `inline-${Math.random()}`);
    }
    document.body.dataset.vista=vista;
    window.dispatchEvent(new CustomEvent('vista-cargada',{detail:{vista,contexto}}));
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const v=vistaInicial(); const ctx=window.NavegacionApp.contextoActual();
    try { await cargarVista(v,ctx); } catch(e) { console.error(e); if(carga){ carga.textContent='No se pudo cargar la aplicación.'; carga.hidden=false; } }
  }, {once:true});
})();
