function anadirOverlaysPagina(wrapper, p, it, isLeft, opciones = {}) {
  if (!p || !wrapper) return;
  const meta = (!isLeft && opciones && opciones.metaOriginalPagina) ? opciones.metaOriginalPagina : p;

  const mostrarEnc = (opciones.enc !== false);
  const mostrarNom = (opciones.int !== false);
  const mostrarCol = (opciones.col !== false);

  if (mostrarEnc) {
    const stHotspots = (!isLeft && Array.isArray(p.statement_hotspots) && p.statement_hotspots.length > 0)
      ? p.statement_hotspots
      : (meta.statement_hotspots || p.statement_hotspots || []);
    if (Array.isArray(stHotspots)) {
      stHotspots.forEach(sh => { try { _crearHotspotEnunciado(sh, wrapper, isLeft, it, isLeft ? meta : p); } catch (_e) {} });
    }
  }

  if (mostrarNom && Array.isArray(meta.name_hotspots)) {
    meta.name_hotspots.forEach(nh => { try { _crearHotspotNombre(nh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (mostrarCol && Array.isArray(meta.school_hotspots)) {
    meta.school_hotspots.forEach(sh => { try { _crearHotspotColegio(sh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (Array.isArray(meta.reflow_hotspots) && typeof _crearHotspotReflujo === 'function') {
    meta.reflow_hotspots.forEach(rh => { try { _crearHotspotReflujo(rh, wrapper, isLeft, it, meta); } catch (_e) {} });
  }

  if (isLeft && Array.isArray(p.image_hotspots)) {
    p.image_hotspots.forEach(ih => { try { _crearHotspotImagen(ih, wrapper, isLeft, it, p); } catch (_e) {} });
  }

  if (isLeft && typeof attachDrawingToPage === 'function') {
    try { attachDrawingToPage(wrapper, p, it); } catch (_e) {}
  }
}
