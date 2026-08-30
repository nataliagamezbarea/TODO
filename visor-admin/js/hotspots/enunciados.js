/* CREACION DE HOTSPOTS DE ENUNCIADOS (< 85 lineas) */

function _crearHotspotEnunciado(sh, pageDiv, isLeft, it, p) {
  const activo = (sh.include !== false && it.include !== false);
  const tieneNuevo = !!(sh.new && sh.new.trim());
  const esCustom = !!sh.custom;
  if (!isLeft && !activo) return;

  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (sh.left !== undefined ? sh.left : 5) + '%';
  box.style.top = (sh.top !== undefined ? sh.top : 5) + '%';
  box.style.width = (sh.width !== undefined ? sh.width : 90) + '%';
  box.style.height = (sh.height !== undefined ? sh.height : 7.5) + '%';

  box.className = !activo ? 'gray-hotspot' : 'red-hotspot';
  box.title = !activo ? 'Enunciado desactivado (Clic para activar)' : (tieneNuevo ? `Enunciado (Sustitución: "${sh.new}")` : (esCustom ? 'Enunciado creado manualmente' : 'Enunciado'));
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openEnunciadoPopup === 'function') openEnunciadoPopup(sh, e, box);
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, sh, p.page_num, 'enunciado');
  }
  pageDiv.appendChild(box);
}

