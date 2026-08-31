/* RamaActual del Visor: persistencia/selección. La obtención de ramas vive en ../servicios/rama-api.js. */
window.RamaActual = window.RamaActual || (() => {
  const KEY='rama_actual';
  const obtener=()=>{
    const q=new URLSearchParams(location.search).get('rama');
    if(q?.trim()){guardar(q.trim());return q.trim();}
    try{const c=JSON.parse(localStorage.getItem('visor_contexto')||'{}'); if(c.todas===true)return ''; if(c.rama)return String(c.rama).trim();}catch(_){ }
    try{return localStorage.getItem(KEY)||'';}catch(_){return '';}
  };
  const guardar=(rama)=>{
    const r=String(rama||'').trim();
    try{if(r)localStorage.setItem(KEY,r);else localStorage.removeItem(KEY); const c=JSON.parse(localStorage.getItem('visor_contexto')||'{}'); localStorage.setItem('visor_contexto',JSON.stringify({...c,rama:r,todas:!r}));}catch(_){ }
  };
  const pintarSeleccionActual=(select)=>{const r=obtener();if(!select)return r;if(r&&!Array.from(select.options).some(o=>o.value===r)){const o=document.createElement('option');o.value=r;o.textContent=r;select.appendChild(o);}select.value=r;return r;};
  const poblarSelector=async(select)=>{if(!select)return[];const ramas=await (window.RamaAPI?.poblarSelector?window.RamaAPI.poblarSelector(select):Promise.resolve([]));pintarSeleccionActual(select);window.RamaUI?.ensureAllBranchesOption(select,'TODAS LAS RAMAS');if(obtener())select.value=obtener();return ramas;};
  return {obtener,guardar,listarRamas:()=>window.RamaAPI?.listarRamas?.()||Promise.resolve([]),pintarSeleccionActual,poblarSelector};
})();
