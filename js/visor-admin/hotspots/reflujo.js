/* CREACION DE HOTSPOTS DE INICIO DE REFLUJO (< 85 lineas) */

function _crearHotspotReflujo(rh, pageDiv, isLeft, it, p) {
  if (!isLeft) return;
  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (rh.left !== undefined ? rh.left : 5) + '%';
  box.style.top = (rh.top !== undefined ? rh.top : 10) + '%';
  box.style.width = (rh.width !== undefined ? rh.width : 90) + '%';
  box.style.height = (rh.height !== undefined ? rh.height : 6) + '%';

  box.className = 'reflow-hotspot';
  box.title = 'Punto de inicio de reflujo manual (Clic para eliminar / volver a auto)';
  box.onclick = async (e) => {
    e.stopPropagation();
    if (confirm('¿Deseas eliminar este punto de inicio de reflujo manual y volver al cálculo automático?')) {
      await fetch('/api/recuadro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: (it?._rama || grad), archivo: it.archivo, tipo: 'reflujo',
          page_num: p.page_num, eliminar: true
        })
      });
      if (typeof openPos === 'function' && typeof POS !== 'undefined') openPos(POS);
      if (typeof refreshRightIframe === 'function') refreshRightIframe();
    }
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, rh, p.page_num, 'reflujo');
  }

  pageDiv.appendChild(box);
}
