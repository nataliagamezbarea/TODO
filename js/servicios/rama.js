window.RamaActual = window.RamaActual || (() => {
  const CLAVE_LOCAL='rama_actual';
  const obtener=()=>{
    const q=new URLSearchParams(location.search).get('rama');
    if(q?.trim()){guardar(q.trim());return q.trim();}
    const e=window.Estado?.obtener?.('rama')||''; if(e.trim()) return e.trim();
    try{return sessionStorage.getItem(CLAVE_LOCAL)||'';}catch(_){return '';}
  };
  const guardar=(rama)=>{
    const r=String(rama||'').trim();
    try{if(r)sessionStorage.setItem(CLAVE_LOCAL,r);else sessionStorage.removeItem(CLAVE_LOCAL);}catch(_){ }
    try{window.Estado?.guardar?.('rama',r);}catch(_){ }
  };
  const listarRamas=()=>window.RamaAPI?window.RamaAPI.listarRamas():Promise.resolve([]);
  const poblarSelector=async(select)=>{
    const ramas=await (window.RamaAPI?.poblarSelector?window.RamaAPI.poblarSelector(select):Promise.resolve([]));
    const actual=obtener(); if(actual && !Array.from(select.options).some(o=>o.value===actual)){const o=document.createElement('option');o.value=actual;o.textContent=actual;select.appendChild(o);} if(actual)select.value=actual;
    return ramas;
  };
  return {obtener,guardar,listarRamas,poblarSelector};
})();
window.ensureAllBranchesOption=window.RamaUI?.ensureAllBranchesOption||window.ensureAllBranchesOption;
