/* RENDERIZADO DE ESTADÍSTICAS Y CONTADORES (< 50 lineas) */

function renderTabs() {
  const tabs = document.getElementById('tabs');
  if (tabs) tabs.remove();
}

function renderStats() {
  const st = document.getElementById('stats');
  if (!st) return;
  const items = Array.isArray(ITEMS) ? ITEMS : [];
  st.hidden = false;
  st.style.display = 'grid';
  st.style.visibility = 'visible';
  st.style.opacity = '1';

  const tot = items.length;
  const enc = items.filter(e => e.type === 'e' && Number(e.enunciados_count || 0) > 0 && e.include !== false).length;
  const ren = items.filter(e => e.cambia_nombre && e.inc_renombre !== false).length;
  const lim = items.filter(e => e.inc_interior).length;
  const apu = items.filter(e => e.inc_apunte).length;
  const nApplied = items.filter(e => e.decision === 'applied').length;
  const nOriginal = items.filter(e => e.decision === 'original').length;

  const stat = (num, label, cls) =>
    `<div class="stat ${cls}"><b>${num}</b><span>${label}</span></div>`;

  st.innerHTML =
    stat(tot, 'archivos totales', 'stat-total') +
    stat(enc, 'enunciados confirmados', 'stat-enunciados') +
    stat(ren, 'renombres .pdf', 'stat-renombres') +
    stat(lim, 'limpiezas nombres', 'stat-nombres') +
    stat(apu, 'apuntes', 'stat-apuntes') +
    stat(nApplied, 'aplicados', 'stat-aplicados') +
    stat(nOriginal, 'originales', 'stat-originales') +
    `<div class="legend" aria-label="Leyenda de colores">
      <span><i class="dot dot-enunciado"></i>Enunciado</span>
      <span><i class="dot dot-creado"></i>Creado por ti</span>
      <span><i class="dot dot-nombre"></i>Nombres</span>
      <span><i class="dot dot-colegio"></i>Colegios</span>
    </div>`;
}
