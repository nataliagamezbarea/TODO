/* ACCIONES Y SUBIDA DE IMAGENES (< 90 lineas) */

async function handleImageAction(act, extra, targetIh) {
  const ih = targetIh || selectedImageIh;
  if (!ih) return;
  const it = ITEMS[POS];
  closeImgPopup();
  showBlocker(act === 'borrar' && extra && extra.global
    ? 'Guardando borrado de imagen (también en otros PDFs)...'
    : 'Guardando acción sobre imagen...');
  try {
    await fetch('/api/image_action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grado: grad,
        archivo: it.archivo,
        img_id: ih.id,
        accion: act,
        ruta: (extra && extra.ruta) ? extra.ruta : '',
        cita: (extra && extra.cita) ? extra.cita : '',
        global: !!(extra && extra.global),
        page_num: ih.page_num,
        img_idx: ih.img_idx
      })
    });
    hideBlocker();
    if (act === 'borrar' && extra && extra.global) {
      await showCustomAlert('Imagen Registrada Globalmente', '✓ Se borrará POR DEFECTO en todos los PDFs donde aparezca igual.', '<i class="fa-solid fa-trash-arrow-up"></i>', '#dc2626');
    } else if (act === 'conservar' && extra && extra.global) {
      await showCustomAlert('Imagen Protegida Globalmente', '✓ Se CONSERVARÁ en todos los PDFs donde aparezca igual.', '<i class="fa-solid fa-shield-halved"></i>', '#059669');
    }
    if (typeof syncInternetCheckboxes === 'function') syncInternetCheckboxes();
    if (typeof refreshRightIframe === 'function') refreshRightIframe();
    openPos(POS);
  } catch (e) {
    hideBlocker();
    console.error('Error al guardar acción sobre imagen:', e);
  }
}

function triggerUploadImage() {
  const inp = document.getElementById('inputImageFile');
  if (inp) { inp.value = ''; inp.click(); }
}

function uploadImageFile(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0], ih = selectedImageIh;
  if (!ih) return;
  const it = ITEMS[POS];

  showBlocker('Subiendo imagen de reemplazo...');
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const res = await fetch('/api/upload_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: grad, archivo: it.archivo, img_id: ih.id,
          nombre_imagen: file.name, datos_base64: e.target.result
        })
      });
      const data = await res.json();
      hideBlocker();
      if (data.ok) handleImageAction('reemplazar', { ruta: data.ruta }, ih);
    } catch (err) {
      hideBlocker();
      console.error('Error al subir imagen:', err);
    }
  };
  reader.readAsDataURL(file);
}
