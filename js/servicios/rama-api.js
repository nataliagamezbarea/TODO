/* Servicio único de ramas compartido por la aplicación principal y Visor Admin. */
window.RamaAPI = window.RamaAPI || (() => {
  const CACHE = "cache_ramas_lista";
  const sort = (lista) => (Array.isArray(lista) ? [...lista] : [])
    .map(x => String(x || '').trim()).filter(Boolean)
    .filter(x => x.toLowerCase() !== 'master')
    .filter((x,i,a) => a.indexOf(x) === i)
    .sort((a,b) => a.localeCompare(b, 'es', {sensitivity:'base'}));
  const cacheGet = () => {
    try { const x=JSON.parse(localStorage.getItem(CACHE)||sessionStorage.getItem(CACHE)||'[]'); return sort(x); } catch(_) { return []; }
  };
  const cacheSet = (ramas) => { try { localStorage.setItem(CACHE, JSON.stringify(sort(ramas))); } catch(_) {} };
  const token = () => {
    const c=window.GITHUB_CONFIG||{};
    let t=typeof c.obtenerTokenSeguro==='function'?c.obtenerTokenSeguro():(c.token||'');
    if(!t) try { t=localStorage.getItem('cache_gh_token')||sessionStorage.getItem('cache_gh_token')||''; } catch(_) {}
    return t;
  };
  const repo = () => {
    const c=window.GITHUB_CONFIG||{};
    let r=c.repo||'';
    if(!r) try { r=localStorage.getItem('gh_repo')||sessionStorage.getItem('gh_repo')||''; } catch(_) {}
    return String(r||'').trim();
  };
  async function listarRamas(){
    // Primero el endpoint del Visor si existe; así ambos proyectos comparten
    // el mismo punto de acceso cuando están detrás del backend del Visor.
    try {
      const h={Accept:'application/json'};
      const sc=window.supabaseClient;
      if(sc?.auth?.getSession){ const {data}=await sc.auth.getSession(); if(data?.session?.access_token) h.Authorization=`Bearer ${data.session.access_token}`; }
      const r=await fetch('/api/ramas',{headers:h,cache:'no-store'});
      if(r.ok){ const d=await r.json(); if(Array.isArray(d) && d.length){ const out=sort(d); cacheSet(out); return out; } }
    } catch(_) {}
    // Después GitHub directo para la aplicación principal.
    const rpo=repo();
    if(rpo){
      try {
        const h={Accept:'application/vnd.github+json'}; const t=token(); if(t) h.Authorization=`Bearer ${t}`;
        const r=await fetch(`https://api.github.com/repos/${rpo}/branches?per_page=100`,{headers:h,cache:'no-store'});
        if(r.ok){ const d=await r.json(); const out=sort((Array.isArray(d)?d:[]).map(x=>x.name)); if(out.length){ cacheSet(out); return out; } }
      } catch(_) {}
    }
    // Finalmente Supabase Storage/caché.
    try {
      if(window.Permisos?.listarRamasStorage){ const d=await window.Permisos.listarRamasStorage(); const out=sort(d); if(out.length){ cacheSet(out); return out; } }
    } catch(_) {}
    return cacheGet();
  }
  async function poblarSelector(select, opciones={}){
    if(!select) return [];
    const placeholder=opciones.placeholder||'SELECCIONAR';
    select.innerHTML='';
    const p=document.createElement('option'); p.value=''; p.textContent=placeholder; p.disabled=opciones.disablePlaceholder!==false; select.appendChild(p);
    const cached=cacheGet();
    cached.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;select.appendChild(o);});
    const ramas=await listarRamas();
    if(ramas.length){
      const valores=new Set(Array.from(select.options).map(o=>o.value));
      ramas.forEach(r=>{if(!valores.has(r)){const o=document.createElement('option');o.value=r;o.textContent=r;select.appendChild(o);}});
    }
    return ramas;
  }
  return {listarRamas,poblarSelector,cacheGet,cacheSet,sort};
})();

window.RamaUI = window.RamaUI || {
  ensureAllBranchesOption(select, texto='— TODAS LAS RAMAS —') {
    if(!select) return;
    let def=Array.from(select.options).find(o=>o.value===''||o.dataset.defaultBranch==='1');
    if(!def){def=document.createElement('option');def.value='';def.textContent='SELECCIONAR';def.dataset.defaultBranch='1';}
    if(def.parentElement===select) select.insertBefore(def,select.firstChild); else select.prepend(def);
    Array.from(select.options).forEach(o=>{if(o.dataset.allBranches==='1'||o.value==='__ALL_BRANCHES__')o.remove();});
    const all=document.createElement('option');all.value='__ALL_BRANCHES__';all.textContent=texto;all.dataset.allBranches='1';select.appendChild(all);
  }
};
window.ensureAllBranchesOption = window.RamaUI.ensureAllBranchesOption;
