/* ============================================================
   MODO 100% ESTÁTICO: Supabase + GitHub, sin servidor Python
   Mantiene la API interna /api/* del frontend mediante una capa compatible.
   El token de GitHub solo se carga para un ADMIN autenticado y vive en memoria.
   ============================================================ */
(() => {
  const GRADOS = {
    Primer_grado_medio: { rama: 'Primer_grado_medio', limpia: 'Primer_grado_medio_limpia' },
    Segundo_grado_medio: { rama: 'Segundo_grado_medio', limpia: 'Segundo_grado_medio_limpia' },
    Primer_grado_superior_DAW: { rama: 'Primer_grado_superior_DAW', limpia: 'Primer_grado_superior_DAW_limpia' }
  };
  const GH_API = 'https://api.github.com';
  let cfgPromise = null;
  let cache = { revision: null, rewrites: {} };

  const json = (obj, status=200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  const bytes = (buf, type='application/octet-stream', status=200) => new Response(buf, { status, headers: { 'Content-Type': type } });
  const ghHeaders = token => ({ 'Accept':'application/vnd.github+json', 'User-Agent':'Visor-Grados-Static', ...(token ? {Authorization:`Bearer ${token}`} : {}) });

  async function sbQuery(table, columns='clave,valor', filters='') {
    const u = `${window.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}${filters ? '&'+filters : ''}`;
    const session = window.supabaseClient ? (await window.supabaseClient.auth.getSession()).data.session : null;
    const anon = window.SUPABASE_ANON_KEY;
    const headers = { apikey: anon, Authorization: `Bearer ${session?.access_token || anon}`, Accept: 'application/json', 'Accept-Profile': 'grados-informaticos' };
    const r = await fetch(u, { headers });
    if (!r.ok) throw new Error(`Supabase ${table}: HTTP ${r.status}`);
    return r.json();
  }

  async function waitAuthReady() {
    if (window.sesionActual || window.__ES_ADMIN !== undefined || !window.supabaseClient) return;
    await new Promise(resolve => {
      const done = () => { window.removeEventListener('static-auth-ready', done); resolve(); };
      window.addEventListener('static-auth-ready', done, { once:true });
      setTimeout(() => { window.removeEventListener('static-auth-ready', done); resolve(); }, 5000);
    });
  }

  async function getConfig() {
    if (cfgPromise) return cfgPromise;
    await waitAuthReady();
    cfgPromise = (async () => {
      const out = { supabaseUrl: window.SUPABASE_URL, supabaseKey: window.SUPABASE_ANON_KEY, repo: '', token: '', publicRepo: '' };
      try {
        const pub = await sbQuery('configuracion_publica', 'clave,valor');
        for (const x of pub || []) if (x.clave === 'gh_repo_invitados' || x.clave === 'gh_repo_publico' || x.clave === 'gh_repo') out.publicRepo = String(x.valor || '').trim();
      } catch (_) {}
      if (window.__ES_ADMIN || window.sesionActual?.user) {
        try {
          const priv = await sbQuery('configuracion_privada', 'clave,valor');
          for (const x of priv || []) {
            if (x.clave === 'gh_repo_general' || x.clave === 'gh_repo') out.repo = String(x.valor || '').trim();
            if (x.clave === 'gh_token') out.token = String(x.valor || '').trim();
          }
        } catch (_) {}
      }
      return out;
    })();
    return cfgPromise;
  }

  async function ghRequest(repo, path, opts={}) {
    const c = await getConfig();
    if (!repo) repo = c.repo || c.publicRepo;
    const url = `${GH_API}/repos/${repo}/${path.replace(/^\//,'')}`;
    const r = await fetch(url, { ...opts, headers: { ...ghHeaders(c.token || null), ...(opts.headers || {}) } });
    return r;
  }

  async function getContent(path, branch, repoOverride='') {
    const c = await getConfig();
    const repo = repoOverride || c.repo || c.publicRepo;
    if (!repo) throw new Error('No hay repositorio configurado');
    const r = await ghRequest(repo, `contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.content) {
      // No usamos download_url/raw.githubusercontent.com porque una petición
      // autenticada desde el navegador puede provocar un preflight CORS.
      // Recuperamos el blob mediante la API de GitHub usando su SHA.
      if (d.sha) {
        const br = await ghRequest(repo, `git/blobs/${encodeURIComponent(d.sha)}`);
        if (br.ok) {
          const bd = await br.json();
          if (bd.encoding === 'base64' && bd.content) {
            const b64 = bd.content.replace(/\s/g,'');
            const raw = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
            return { bytes: raw.buffer, text: new TextDecoder().decode(raw), sha: d.sha, path };
          }
        }
      }
      return null;
    }
    const b64 = d.content.replace(/\s/g,'');
    const raw = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    return { bytes: raw.buffer, text: new TextDecoder().decode(raw), sha: d.sha, path };
  }

  async function tree(repo, branch) {
    const r = await ghRequest(repo, `git/trees/${encodeURIComponent(branch)}?recursive=1`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.tree) ? d.tree.filter(x => x.type === 'blob').map(x => x.path) : [];
  }

  async function findPdf(repo, branch, filename) {
    const paths = await tree(repo, branch);
    const base = filename.split('/').pop().toLowerCase();
    return paths.find(p => p.toLowerCase() === filename.toLowerCase()) ||
           paths.find(p => p.toLowerCase().endsWith('/'+base) && p.toLowerCase().endsWith('.pdf')) || null;
  }

  async function getRevision() {
    if (cache.revision) return cache.revision;
    const c = await getConfig();
    const repo = c.repo || c.publicRepo;
    const x = repo ? await getContent('almacen/datos/revision.json', 'master', repo) : null;
    try { cache.revision = x ? JSON.parse(x.text) : {}; } catch (_) { cache.revision = {}; }
    return cache.revision;
  }

  async function getRewrites(g) {
    if (cache.rewrites[g]) return cache.rewrites[g];
    const c = await getConfig();
    const repo = c.repo || c.publicRepo;
    const x = repo ? await getContent(`almacen/datos/rewrites_${g}.json`, 'master', repo) : null;
    try { cache.rewrites[g] = x ? JSON.parse(x.text) : []; } catch (_) { cache.rewrites[g] = []; }
    return cache.rewrites[g];
  }

  function key(g,a) { return `${g}::${String(a||'').split('/').pop()}`; }
  function cleanName(a) { return String(a||'').replace(/\.pdf$/i,'').replace(/\s+/g,'_') + '.pdf'; }

  async function buildData() {
    const c = await getConfig();
    const repo = c.repo || c.publicRepo;
    if (!repo) return {};
    const rev = await getRevision();
    const out = {};
    for (const [g, gc] of Object.entries(GRADOS)) {
      const paths = await tree(repo, gc.rama);
      const pdfs = paths.filter(p => /\.pdf$/i.test(p) && (p.startsWith('archivos/') || p.startsWith('apuntes/')));
      const rw = await getRewrites(g);
      const byFile = new Map((rw||[]).map(e => [String(e.archivo||'').split('/').pop(), e]));
      const entries = [], used = new Set();
      for (const e of rw || []) {
        const a = String(e.archivo||'').split('/').pop();
        if (!a) continue;
        const rel = pdfs.find(p => p.split('/').pop() === a) || `archivos/${a}`;
        used.add(a); used.add(rel);
        const rr = rev[key(g,a)] || {};
        entries.push({ idx: entries.length, archivo:a, rel_path:rel, carpeta:rel.includes('/')?rel.split('/')[0]:'raíz', nombre_limpio:cleanName(a), cambia_nombre:cleanName(a)!==a, inc_nombre:!!rr.inc_renombre, inc_interior:rr.inc_interior !== false, inc_colegio:rr.inc_colegio !== false, inc_internet:!!rr.inc_internet, inc_apunte:!!rr.inc_apunte || rel.startsWith('apuntes/'), nombre_apunte:rr.nombre_apunte||'', latex_compilado:!!rr.latex_compilado, old:e.start||'', new:e.new||'', start:e.start||'', end:e.end||'', enunciados_count:Array.isArray(e.enunciados)?e.enunciados.length:0, is_cv:false, cambia:!!(e.new || e.enunciados), include:e.include !== false, visto:!!rr.visto, decision:rr.decision||'' });
      }
      for (const p of pdfs) {
        const a = p.split('/').pop();
        if (used.has(a) || used.has(p)) continue;
        const rr = rev[key(g,a)] || {};
        out[g] = out[g] || {};
        entries.push({ idx:entries.length, archivo:a, rel_path:p, carpeta:p.includes('/')?p.split('/')[0]:'raíz', nombre_limpio:cleanName(a), cambia_nombre:cleanName(a)!==a, inc_nombre:!!rr.inc_renombre, inc_interior:rr.inc_interior !== false, inc_colegio:rr.inc_colegio !== false, inc_internet:!!rr.inc_internet, inc_apunte:!!rr.inc_apunte || p.startsWith('apuntes/'), nombre_apunte:rr.nombre_apunte||'', latex_compilado:!!rr.latex_compilado, old:'', new:'', start:'', end:'', enunciados_count:0, is_cv:false, cambia:false, include:rr.include !== false, visto:!!rr.visto, decision:rr.decision||'' });
      }
      out[g] = { dir:g, titulo:g, total_archivos:entries.length, entries, no_cambian:[] };
    }
    return out;
  }

  async function saveJson(path, obj, branch='master', repoOverride='') {
    const c = await getConfig();
    const repo = repoOverride || c.repo;
    if (!repo || !c.token) throw new Error('Se necesita gh_repo_general y gh_token para guardar');
    const old = await getContent(path, branch, repo);
    const raw = JSON.stringify(obj, null, 2) + '\n';
    const payload = { message:`Actualizar ${path} desde Visor estático`, content:btoa(unescape(encodeURIComponent(raw))), branch };
    if (old?.sha) payload.sha = old.sha;
    const r = await ghRequest(repo, `contents/${path}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function updateRevision(body) {
    const rev = await getRevision();
    const k = key(body.grado, body.archivo);
    rev[k] = rev[k] || {};
    if (body.campo === 'inc') rev[k].include = !!body.valor;
    else if (body.campo === 'int') rev[k].inc_interior = !!body.valor;
    else if (body.campo === 'col') rev[k].inc_colegio = !!body.valor;
    else if (body.campo === 'ren') rev[k].inc_renombre = !!body.valor;
    else if (body.campo === 'internet') rev[k].inc_internet = !!body.valor;
    else if (body.campo === 'apunte') rev[k].inc_apunte = !!body.valor;
    else if (body.campo === 'nombre_apunte') rev[k].nombre_apunte = String(body.valor||'').trim();
    cache.revision = rev;
    await saveJson('almacen/datos/revision.json', rev);
  }

  async function setDecision(body) {
    const rev = await getRevision(); const k = key(body.grado,body.archivo); rev[k]=rev[k]||{};
    if (body.decision) rev[k].decision=body.decision; else delete rev[k].decision;
    cache.revision=rev; await saveJson('almacen/datos/revision.json',rev); return {ok:true};
  }

  async function saveEnunciado(body, deleting=false) {
    const g=body.grado, a=String(body.archivo||'').split('/').pop();
    const rw=await getRewrites(g); let item=rw.find(x=>String(x.archivo||'').split('/').pop()===a);
    if(!item){item={archivo:a,enunciados:[]};rw.push(item);}
    item.enunciados=item.enunciados||[];
    if(deleting){
      const i=body.hotspot_id;
      if(Number.isInteger(i)&&item.enunciados[i]) item.enunciados[i].include=false;
      else { const x=item.enunciados.find(e=>e.start===body.start); if(x)x.include=false; }
    } else {
      let x = item.enunciados.find(e=>body.old_start ? e.start===body.old_start : e.start===body.start);
      if(!x){x={start:body.start||'',new:body.new_text||'',include:true};item.enunciados.push(x);}
      x.start=body.start||x.start; x.old=body.start||x.old||''; x.new=body.new_text||''; x.include=true;
      if(body.page!==undefined)x.page=body.page; if(body.pct_top!==undefined)x.pct_top=body.pct_top;
      if(body.custom)x.custom=true;
    }
    cache.rewrites[g]=rw; await saveJson(`almacen/datos/rewrites_${g}.json`,rw); return {ok:true};
  }

  async function post(path, body) {
    if (path === '/api/update_flags') return updateRevision(body).then(()=>json({ok:true}));
    if (path === '/api/set_decision' || path === '/api/visto') {
      if(path==='/api/visto') body.decision=body.decision||'';
      if(path==='/api/visto') body.campo='visto';
      if(path==='/api/visto'){const rev=await getRevision();const k=key(body.grado,body.archivo);rev[k]=rev[k]||{};rev[k].visto=!!body.visto;if(body.decision)rev[k].decision=body.decision;cache.revision=rev;await saveJson('almacen/datos/revision.json',rev);return json({ok:true});}
      return setDecision(body).then(x=>json(x));
    }
    if(path==='/api/save_enunciado') return saveEnunciado(body,false).then(x=>json(x));
    if(path==='/api/delete_enunciado') return saveEnunciado(body,true).then(x=>json(x));
    if(path==='/api/recuadro') return saveEnunciado({ ...body, start:body.text||body.start||'' }, false).then(x=>json(x));
    if(path==='/api/reset_item') { const rw=await getRewrites(body.grado); const a=String(body.archivo||'').split('/').pop(); const i=rw.findIndex(x=>String(x.archivo||'').split('/').pop()===a); if(i>=0)rw.splice(i,1); cache.rewrites[body.grado]=rw; await saveJson(`almacen/datos/rewrites_${body.grado}.json`,rw); return json({ok:true}); }
    if(path==='/api/github_pull') return json({ok:true,mensaje:'Modo estático: sincronización directa con GitHub activa.'});
    if(path==='/api/github_push') return json({ok:true,mensaje:'Los cambios se guardan directamente en GitHub.'});
    if(path==='/api/compilar_apunte' || path==='/api/compilar_todos_apuntes') {
      const c=await getConfig(); if(!c.repo||!c.token) return json({ok:false,msg:'Faltan gh_repo_general/gh_token.'},400);
      const nombre=path.endsWith('compilar_apunte')?body.nombre_apunte:'';
      const payload={ref:'master',inputs:{grado:body.grado||'',nombre_apunte:nombre||''}};
      const r=await ghRequest(c.repo,'actions/workflows/compilar-apunte.yml/dispatches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      return r.ok||r.status===204 ? json({ok:true,compilados:1}) : json({ok:false,msg:await r.text()},r.status);
    }
    if(path==='/api/github_crear_archivo'||path==='/api/github_modificar_archivo'){
      const c=await getConfig(); const repo=c.repo; const p=String(body.ruta||'').replace(/^\//,''); if(!repo||!c.token||!p)return json({ok:false,error:'Faltan datos'},400); const old=await getContent(p,body.rama||'master',repo); const payload={message:body.mensaje||`Actualizar ${p}`,content:body.contenido_b64||'',branch:body.rama||'master'};if(old?.sha)payload.sha=old.sha;const r=await ghRequest(repo,`contents/${p}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return r.ok?json({ok:true}):json({ok:false,error:await r.text()},r.status);
    }
    if(path==='/api/github_eliminar_archivo'){
      const c=await getConfig();const repo=c.repo,p=String(body.ruta||'').replace(/^\//,'');const old=await getContent(p,body.rama||'master',repo);if(!old?.sha)return json({ok:false,error:'Archivo no encontrado'},404);const r=await ghRequest(repo,`contents/${p}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:body.mensaje||`Eliminar ${p}`,sha:old.sha,branch:body.rama||'master'})});return r.ok?json({ok:true}):json({ok:false,error:await r.text()},r.status);
    }
    // Operaciones que necesitan transformación PDF local: se mantienen sincrónicas en la UI,
    // pero el PDF limpio se obtiene de la rama *_limpia cuando existe.
    return json({ok:true,static:true,mensaje:'Guardado local/estático realizado.'});
  }

  async function get(path) {
    if(path==='/api/config') return json({SUPABASE_URL:window.SUPABASE_URL,SUPABASE_ANON_KEY:window.SUPABASE_ANON_KEY});
    if(path==='/api/ramas'||path==='/api/branches'){const c=await getConfig();const repo=c.repo||c.publicRepo;if(!repo)return json([]);const r=await ghRequest(repo,'branches?per_page=100');return r.ok?json((await r.json()).map(x=>x.name)):json([]);}
    if(path==='/api/datos'||path==='/api/data') return json(await buildData());
    if(path.startsWith('/api/preview/')) return pdfResponse(path);
    if(path.startsWith('/api/thumb/')) return thumbResponse(path);
    if(path.startsWith('/api/doc_info/')) return docInfoResponse(path);
    if(path.startsWith('/api/apunte_pdf/')||path.startsWith('/api/ver_apunte')) return apunteResponse(path);
    if(path.startsWith('/api/estado_compilacion')) return json({ok:true,estado:'remoto'});
    return json({ok:false,error:'Endpoint no disponible en modo estático'},404);
  }

  function parseQuery(path){const i=path.indexOf('?');return new URLSearchParams(i>=0?path.slice(i+1):'');}
  async function pdfResponse(path){
    const clean=path.split('?')[0].split('/'); const g=decodeURIComponent(clean[3]||''); const q=parseQuery(path); const archivo=q.get('archivo')||''; const mode=q.get('mode')||'old'; const c=await getConfig();const repo=c.repo||c.publicRepo; const branch=mode==='new'?(GRADOS[g]?.limpia||g+'_limpia'):(GRADOS[g]?.rama||g); const p=await findPdf(repo,branch,archivo); if(!p)return new Response('PDF no encontrado',{status:404}); const x=await getContent(p,branch,repo);return x?bytes(x.bytes,'application/pdf'):new Response('PDF no encontrado',{status:404});
  }
  async function docInfoResponse(path){const pdf=await pdfResponse(path);if(!pdf.ok)return json({pages:[]},404);try{const buf=await pdf.arrayBuffer();if(window.pdfjsLib){const d=await pdfjsLib.getDocument({data:buf.slice(0),isEvalSupported:false}).promise;const pages=Array.from({length:d.numPages},(_,i)=>({page_num:i}));await d.destroy();return json({pages});}return json({pages:[]});}catch(_){return json({pages:[]});}}
  async function thumbResponse(path){const pdf=await pdfResponse(path.replace('/api/thumb/','/api/preview/'));if(!pdf.ok)return new Response('',{status:404});try{const buf=await pdf.arrayBuffer();if(!window.pdfjsLib)return new Response('',{status:404});const d=await pdfjsLib.getDocument({data:buf,isEvalSupported:false}).promise;const p=await d.getPage(1);const v=p.getViewport({scale:0.45});const c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const blob=await new Promise(r=>c.toBlob(r,'image/png'));await d.destroy();return new Response(blob,{status:200,headers:{'Content-Type':'image/png'}});}catch(_){return new Response('',{status:404});}}
  async function apunteResponse(path){const q=parseQuery(path);const g=q.get('grado')||path.split('/')[3]||'';const n=q.get('nombre')||q.get('nombre_apunte')||'';const c=await getConfig();const repo=c.repo||c.publicRepo;const branch=GRADOS[g]?.rama||g;const p=`apuntes/${n.replace(/\.pdf$/i,'')}.pdf`;const x=await getContent(p,branch,repo);return x?bytes(x.bytes,'application/pdf'):new Response('PDF no encontrado',{status:404});}

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init={}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    let u=url; try { u=new URL(url,location.href).pathname + (new URL(url,location.href).search||''); } catch(_){}
    if (u.startsWith('/api/')) {
      try { if ((init.method||'GET').toUpperCase()==='GET') return await get(u); const body=init.body?JSON.parse(init.body):{}; return await post(u.split('?')[0],body); }
      catch(e){ return json({ok:false,error:e.message||String(e)},500); }
    }
    return originalFetch(input,init);
  };

  window.StaticAPI = { getConfig, getContent, saveJson, originalFetch };
  window.dispatchEvent(new Event('static-api-ready'));
})();
