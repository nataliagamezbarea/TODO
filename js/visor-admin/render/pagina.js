/* RENDERIZADO DE CANVAS Y CAPA DE TEXTO PDF.JS (< 85 lineas) */

async function _renderPaginaPDFJS(doc, idx0, wrapper, escalaPreferida, elRef) {
  const pagina = await doc.getPage(idx0 + 1);
  const vp1 = pagina.getViewport({ scale: 1 });
  const anchoDisp = Math.max(280, elRef.clientWidth - 32);
  let escala = escalaPreferida || (anchoDisp / vp1.width);
  if (escala > 3.5) escala = 3.5;
  if (escala < 0.1) escala = 0.1;
  const viewport = pagina.getViewport({ scale: escala });

  wrapper.innerHTML = '';
  wrapper.style.width = `${viewport.width}px`;
  wrapper.style.minHeight = `${viewport.height}px`;
  wrapper.style.setProperty('--scale-factor', escala);


  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.display = 'block';
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  await pagina.render({ canvasContext: ctx, viewport: viewport }).promise;

  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'pdfTextLayer';
  textLayerDiv.style.position = 'absolute';
  textLayerDiv.style.left = '0';
  textLayerDiv.style.top = '0';
  textLayerDiv.style.width = `${viewport.width}px`;
  textLayerDiv.style.height = `${viewport.height}px`;
  textLayerDiv.style.setProperty('--scale-factor', escala);
  wrapper.appendChild(textLayerDiv);

  try {
    const textContent = await pagina.getTextContent();
    pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: []
    });
  } catch (_e) {}
}

