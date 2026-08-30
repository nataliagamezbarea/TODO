/* RENDERIZADO DE ESTADÍSTICAS Y CONTADORES (< 50 lineas) */

function renderTabs() {
  const tabs = document.getElementById('tabs');
  if (tabs) tabs.remove();
}

function renderStats() {
  const st = document.getElementById('stats');
  if (!st || !DATA[grad]) return;
  const tot = DATA[grad].total_archivos;
  const enc = DATA[grad].entries.filter(e => e.include).length;
  const ren = DATA[grad].entries.filter(e => e.cambia_nombre && e.inc_renombre !== false).length + DATA[grad].no_cambian.filter(n => n.cambia_nombre && n.inc_renombre !== false).length;
  const lim = DATA[grad].entries.filter(e => e.inc_interior).length + DATA[grad].no_cambian.filter(n => n.inc_interior).length;
  const apu = DATA[grad].entries.filter(e => e.inc_apunte).length + DATA[grad].no_cambian.filter(n => n.inc_apunte).length;
  const nApplied = DATA[grad].entries.filter(e => e.decision === 'applied').length + DATA[grad].no_cambian.filter(n => n.decision === 'applied').length;
  const nOriginal = DATA[grad].entries.filter(e => e.decision === 'original').length + DATA[grad].no_cambian.filter(n => n.decision === 'original').length;

  st.innerHTML =
    `<div class="stat"><b style="color:#ffd166">${tot}</b>archivos totales</div>` +
    `<div class="stat"><b style="color:#ef4444">${enc}</b>enunciados confirmados</div>` +
    `<div class="stat"><b style="color:#8b5cf6">${ren}</b>renombres .pdf</div>` +
    `<div class="stat"><b style="color:#3b82f6">${lim}</b>limpiezas nombres</div>` +
    `<div class="stat"><b style="color:#10b981">${apu}</b>apuntes</div>` +
    `<div class="stat"><b style="color:#34d399">${nApplied}</b>aplicados</div>` +
    `<div class="stat"><b style="color:#fbbf24">${nOriginal}</b>originales</div>` +
    `<div class="legend">` +
    `<span><span class="dot" style="background:#ef4444"></span> Rojo/Gris: Enunciado</span>` +
    `<span><span class="dot" style="background:#f97316"></span> Naranja: Creado por Ti</span>` +
    `<span><span class="dot" style="background:#3b82f6"></span> Azul/Gris: Nombres</span>` +
    `<span><span class="dot" style="background:#f59e0b"></span> Ámbar/Gris: Colegios</span>` +
    `</div>`;
}
