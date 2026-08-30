/* CREACION DE HOTSPOTS DE COLEGIOS E IMAGENES (< 85 lineas) */

function _crearHotspotColegio(sh, pageDiv, isLeft, it, p) {
  const activo = (it.inc_colegio !== false);
  if (!isLeft && !activo) return;

  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = (sh.left !== undefined ? sh.left : 5) + '%';
  box.style.top = (sh.top !== undefined ? sh.top : 5) + '%';
  box.style.width = (sh.width !== undefined ? sh.width : 40) + '%';
  box.style.height = (sh.height !== undefined ? sh.height : 6) + '%';

  box.className = activo ? 'school-hotspot' : 'gray-school-hotspot';
  box.title = activo ? (sh.manual ? 'Colegio (Recuadro manual)' : 'Colegio/Logo (Activo para borrar)') : 'Colegio/Logo (Desactivado)';
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openColegioPopup === 'function') openColegioPopup(sh, e, box);
  };
  if (isLeft && typeof anadirHandlesRedimensionamiento === 'function') {
    anadirHandlesRedimensionamiento(box, sh, p.page_num, 'colegio');
  }

  pageDiv.appendChild(box);
}





function _crearHotspotImagen(ih, pageDiv, isLeft, it, p) {
  if (!isLeft) return;
  const box = document.createElement('div');
  box.className = 'image-hotspot';
  box.style.position = 'absolute';
  box.style.left = (ih.left || 0) + '%';
  box.style.top = (ih.top || 0) + '%';
  box.style.width = (ih.width || 10) + '%';
  box.style.height = (ih.height || 10) + '%';
  box.title = `Imagen (${ih.id || 'img'}). Clic para opciones de reemplazo/borrado/internet.`;
  box.onclick = (e) => {
    e.stopPropagation();
    if (typeof openImagePopup === 'function') openImagePopup(ih, e);
  };
  pageDiv.appendChild(box);
}
