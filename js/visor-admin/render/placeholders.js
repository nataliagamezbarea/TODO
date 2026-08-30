/* CREACION DE WRAPPERS Y PLACEHOLDERS (< 50 lineas) */

function crearPlaceholdersDocumento(total, anchoDisp, el) {
  const altoEst = Math.round(anchoDisp * 1.414);
  const wrappers = [];
  for (let i = 0; i < total; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'doc-page pdfjs-page';
    wrapper.style.position = 'relative';
    wrapper.style.minHeight = altoEst + 'px';
    wrapper.style.width = anchoDisp + 'px';
    wrapper.style.margin = '0 auto 12px auto';
    wrapper.dataset.paginaIdx = String(i);
    wrapper.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:${altoEst}px;color:#94a3b8;font-size:13px;background:rgba(255,255,255,0.03);border-radius:4px;gap:8px"><i class="fa-regular fa-file-pdf" style="font-size:36px;color:#64748b"></i><span>Cargando página ${i + 1}…</span></div>`;
    el.appendChild(wrapper);
    wrappers.push(wrapper);
  }
  return wrappers;
}

