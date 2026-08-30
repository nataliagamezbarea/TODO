/* MODAL EDITAR ENUNCIADO (< 70 lineas) */

function openEditarEnunciadoModal(sh, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  currentEditingHotspot = sh;
  const m = document.getElementById('modalEditarEnunciado');
  if (!m) return;
  const oldTextarea = document.getElementById('editarOldText');
  const newTextarea = document.getElementById('editarNewText');
  if (oldTextarea) oldTextarea.value = (sh && (sh.old || sh.start)) ? (sh.old || sh.start) : '';
  if (newTextarea) newTextarea.value = (sh && sh.new) ? sh.new : '';
  m.classList.add('on');
}

function closeEditarEnunciadoModal() {
  const m = document.getElementById('modalEditarEnunciado');
  if (m) m.classList.remove('on');
  currentEditingHotspot = null;
}

async function guardarEditarEnunciado() {
  const it = ITEMS[POS];
  const sh = currentEditingHotspot;
  const st = String(document.getElementById('editarOldText')?.value || '').trim();
  const ed = sh ? (sh.end || '') : '';
  const nw = document.getElementById('editarNewText').value;
  if (!st) {
    alert('Escribe el texto que quieres cambiar.');
    return;
  }

  const _scrollAntes = (typeof capturarPosicionVisores === 'function') ? capturarPosicionVisores() : null;
  if (typeof pedirRestauracionVisores === 'function') pedirRestauracionVisores(_scrollAntes);
  showBlocker('Guardando reescritura y actualizando vista previa...');
  try {
    await fetch('/api/save_enunciado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grado: grad, archivo: it.archivo, start: st, old_start: sh ? (sh.start || sh.old || '') : '', end: ed, new_text: nw, page: sh ? sh.page : undefined, pct_top: sh ? (sh.pct_top ?? sh.top) : undefined })
    });

    if (it.type === 'e') {
      await setInc(true);
    }

    closeEditarEnunciadoModal();
    await load();
    hideBlocker();
    refreshRightIframe();
    openPos(POS);
  } catch (e) {
    hideBlocker();
    console.error('Error al guardar enunciado:', e);
  }
}
