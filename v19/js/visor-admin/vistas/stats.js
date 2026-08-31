/* RENDERIZADO DE ESTADÍSTICAS Y CONTADORES */

function mostrarStatsCargando(texto = 'CARGANDO...') {
  const st = document.getElementById('stats');
  if (!st) return;
  st.classList.add('stats-loading');
  st.innerHTML = `<div class="stats-loading-inner"><i class="fa-solid fa-circle-notch fa-spin"></i><span>${texto}</span></div>`;
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  if (tabs) tabs.remove();
}

function renderStats() {
  const st = document.getElementById('stats');
  if (!st) return;
  // Mientras ITEMS todavía no existe, nunca dejamos el bloque vacío.
  if (!Array.isArray(ITEMS)) {
    mostrarStatsCargando();
    return;
  }
  st.classList.remove('stats-loading');
  const items = ITEMS;
  const tot = items.length;
  const enc = items.filter(e => e.type === 'e' && e.include).length;
  const ren = items.filter(e => e.cambia_nombre && e.inc_renombre !== false).length;
  const lim = items.filter(e => e.inc_interior).length;
  const apu = items.filter(e => e.inc_apunte).length;
  const nApplied = items.filter(e => e.decision === 'applied').length;
  const nOriginal = items.filter(e => e.decision === 'original').length;
  st.innerHTML =
    `<div class="stat"><b style="color:#ffd166">${tot}</b>archivos totales</div>` +
    `<div class="stat"><b style="color:#ef4444">${enc}</b>enunciados confirmados</div>` +
    `<div class="stat"><b style="color:#8b5cf6">${ren}</b>renombres .pdf</div>` +
    `<div class="stat"><b style="color:#3b82f6">${lim}</b>limpiezas nombres</div>` +
    `<div class="stat"><b style="color:#10b981">${apu}</b>apuntes</div>` +
    `<div class="stat"><b style="color:#34d399">${nApplied}</b>aplicados</div>` +
    `<div class="stat"><b style="color:#fbbf24">${nOriginal}</b>originales</div>` +
    `<div class="legend"><span><span class="dot" style="background:#ef4444"></span> Rojo/Gris: Enunciado</span><span><span class="dot" style="background:#f97316"></span> Naranja: Creado por Ti</span><span><span class="dot" style="background:#3b82f6"></span> Azul/Gris: Nombres</span><span><span class="dot" style="background:#f59e0b"></span> Ámbar/Gris: Colegios</span></div>`;
}
