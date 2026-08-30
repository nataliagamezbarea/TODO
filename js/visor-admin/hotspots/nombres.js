/* CREACION DE HOTSPOTS DE NOMBRES (< 85 lineas) */

function _crearHotspotNombre(nh, pageDiv, isLeft, it, p) {
  const activo = (it.inc_interior !== false);
  if (!isLeft && !activo) return;

  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (nh.left !== undefined ? nh.left : 5) + '%';
  box.style.top = (nh.top !== undefined ? nh.top : 5) + '%';
  box.style.width = (nh.width !== undefined ? nh.width : 30) + '%';
  box.style.height = (nh.height !== undefined ? nh.height : 4) + '%';

  box.className = activo ? 'blue-name-hotspot' : 'gray-name-hotspot';
  box.title = activo ? (nh.manual ? 'Nombre (Recuadro manual)' : 'Nombre (Activo para borrar)') : 'Nombre (Desactivado)';
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openNombrePopup === 'function') openNombrePopup(nh, e, box);
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, nh, p.page_num, 'nombre');
  }

  pageDiv.appendChild(box);
}




