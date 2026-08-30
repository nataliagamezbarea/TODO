/* DESCARGA DE PDF ACTUAL (< 50 lineas) */

function descargarPDFActual() {
  if (typeof ITEMS === 'undefined' || !ITEMS[POS] || !grad) return;
  const it = ITEMS[POS];
  const enc = (document.getElementById('cbInc') && document.getElementById('cbInc').checked) ? '1' : '0';
  const int = (document.getElementById('cbInt') && document.getElementById('cbInt').checked) ? '1' : '0';
  const col = (document.getElementById('cbCol') && document.getElementById('cbCol').checked) ? '1' : '0';
  const net = (typeof isAutoDelInternetActive === 'function' && isAutoDelInternetActive()) ? '1' : '0';

  const modo = it.decision === 'original' ? 'old' : 'new';
  const qs = `archivo=${encodeURIComponent(it.archivo)}&mode=${modo}&enc=${enc}&int=${int}&col=${col}&net=${net}&download=1`;
  const urlDescarga = `/api/preview/${grad}?${qs}`;

  const a = document.createElement('a');
  a.href = urlDescarga;
  a.download = it.archivo.split('/').pop() || 'documento.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

window.descargarPDFActual = descargarPDFActual;
