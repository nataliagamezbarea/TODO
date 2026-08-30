/* ALIASES GLOBALES PARA BOTONES DEL HTML */
function compileCurrentApunte() { return confirmGenerateApunteLatex(); }

function verApunteActual() {
  const it = ITEMS[POS];
  if (!it) return;
  const nombre = it.nombre_apunte || (it.latex_compilado ? (it.archivo || '').replace(/\.pdf$/i, '') : '');
  if (!nombre) return;
  (async()=>{ const r=await fetch('/api/ver_apunte?grado='+encodeURIComponent(grad)+'&nombre_apunte='+encodeURIComponent(nombre)); if(!r.ok)return; const b=await r.blob(); const u=URL.createObjectURL(b); window.open(u,'_blank'); setTimeout(()=>URL.revokeObjectURL(u),60000); })();
}

async function compileAllApuntes() {
  showBlocker('Lanzando compilación de todos los apuntes del grado en GitHub Actions...');
  try {
    const res = await fetch('/api/compilar_todos_apuntes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: grad })
    });
    const data = await res.json();
    hideBlocker();
    if (data.ok) {
      const num = data.compilados || 0;
      const noLanz = (data.no_lanzados || []).length;
      if (typeof showCustomAlert === 'function') {
        let msg;
        if (num > 0) {
          msg = `✓ Lanzados ${num} apuntes en GitHub Actions (Docker + LaTeX). Se compilan en remoto y se actualizarán al terminar.`;
        } else {
          msg = 'No se pudo lanzar ningún apunte en GitHub Actions.';
        }
        if (noLanz > 0) msg += ` ${noLanz} no se pudieron lanzar (revisa gh_token/gh_repo_general).`;
        await showCustomAlert('Compilación lanzada', msg, '<i class="fa-brands fa-github"></i>', num > 0 ? '#3b82f6' : '#ef4444');
      }
    } else {
      if (typeof showCustomAlert === 'function') {
        await showCustomAlert('Error en Apuntes', data.msg || data.error || 'Error al compilar apuntes.', '<i class="fa-solid fa-triangle-exclamation"></i>', '#ef4444');
      }
    }
  } catch (err) {
    hideBlocker();
    console.error('Error al compilar todos los apuntes:', err);
  }
}

