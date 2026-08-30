/* MANEJO DE FINALIZACION DE DIBUJO (< 60 lineas) */

async function procesarFinDibujo(drawBox, pageDiv, p, it, tipoElegido) {
  const rect = pageDiv.getBoundingClientRect();
  const w = parseFloat(drawBox.style.width || '0');
  const h = parseFloat(drawBox.style.height || '0');
  const l = parseFloat(drawBox.style.left || '0');
  const t = parseFloat(drawBox.style.top || '0');

  if (w > 10 && h > 10) {
    const pctLeft = ((l / rect.width) * 100).toFixed(2);
    const pctTop = ((t / rect.height) * 100).toFixed(2);
    const pctWidth = ((w / rect.width) * 100).toFixed(2);
    const pctHeight = ((h / rect.height) * 100).toFixed(2);

    if (tipoElegido === 'nombre' || tipoElegido === 'colegio' || tipoElegido === 'reflujo') {
      await guardarRecuadroNuevoDirecto(tipoElegido, it, p.page_num, pctLeft, pctTop, pctWidth, pctHeight);
      return;
    }

    showBlocker('Detectando texto en el recuadro...');
    try {
      const res = await fetch('/api/extract_box_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: grad, archivo: it.archivo, page_num: p.page_num,
          left: pctLeft, top: pctTop, width: pctWidth, height: pctHeight
        })
      });
      const data = await res.json();
      hideBlocker();
      const detectedText = (data.text && data.text.trim()) ? data.text.trim() : `[Zona Pág ${p.page_num + 1}: ${pctLeft}% x ${pctTop}%]`;
      window._selContext = { page: p.page_num, pct_top: parseFloat(pctTop) };
      openCrearEnunciadoModal(detectedText);
    } catch (_err) {
      hideBlocker();
      window._selContext = { page: p.page_num, pct_top: parseFloat(pctTop) };
      openCrearEnunciadoModal(`[Zona Pág ${p.page_num + 1}: ${pctLeft}% x ${pctTop}%]`);
    }
  } else {
    if (drawBox) drawBox.remove();
  }
}
