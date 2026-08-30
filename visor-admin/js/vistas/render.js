/* SECCIONES PRINCIPALES DE VISTA (< 60 lineas) */

function render() {
  renderStats();
  const c = document.getElementById('content');
  if (!c) return;
  c.innerHTML = '';

  const itemsVista = typeof obtenerItemsBusqueda === 'function' ? obtenerItemsBusqueda() : [
    ...(DATA[grad] ? DATA[grad].entries : []),
    ...(DATA[grad] ? DATA[grad].no_cambian : [])
  ];
  const archivosVista = new Set(itemsVista.map(it => it.archivo));
  const entriesVista = (DATA[grad] ? DATA[grad].entries : []).filter(it => archivosVista.has(it.archivo));
  const noCambianVista = (DATA[grad] ? DATA[grad].no_cambian : []).filter(it => archivosVista.has(it.archivo));

  const todosLatex = [
    ...entriesVista,
    ...noCambianVista
  ].filter(it => it.latex_compilado);

  if (todosLatex.length > 0) {
    const s0 = document.createElement('div');
    s0.className = 'sec';
    s0.innerHTML = '<h3><i class="fa-solid fa-file-circle-check" style="color:#34d399"></i> Apuntes LaTeX Ya Compilados (' + todosLatex.length + ')</h3>';
    const grid0 = document.createElement('div');
    grid0.className = 'grid';
    renderProgressiveGrid(grid0, todosLatex);
    s0.appendChild(grid0);
    c.appendChild(s0);
  }

  const s1 = document.createElement('div');
  s1.className = 'sec';
  s1.innerHTML = '<h3><i class="fa-solid fa-pen-fancy" style="color:#f87171"></i> Archivos con Reescritura de Enunciado (' + entriesVista.length + ')</h3>';

  const gEntriesBySub = groupBySubfolder(entriesVista);
  Object.keys(gEntriesBySub).sort().forEach(sub => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'subfolder-group';
    groupWrap.innerHTML = `<div class="subfolder-header"><i class="fa-solid fa-folder-open"></i> Subapartado: <b>${sub}</b> (${gEntriesBySub[sub].length} archivos)</div>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    renderProgressiveGrid(grid, gEntriesBySub[sub]);
    groupWrap.appendChild(grid);
    s1.appendChild(groupWrap);
  });
  c.appendChild(s1);

  const s2 = document.createElement('div');
  s2.className = 'sec';
  s2.innerHTML = '<h3><i class="fa-solid fa-user-slash" style="color:#3b82f6"></i> Archivos de Apuntes y Limpieza de Nombres (' + noCambianVista.length + ')</h3>';

  const gNoCambBySub = groupBySubfolder(noCambianVista);
  Object.keys(gNoCambBySub).sort().forEach(sub => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'subfolder-group';
    groupWrap.innerHTML = `<div class="subfolder-header"><i class="fa-solid fa-folder-open"></i> Subapartado: <b>${sub}</b> (${gNoCambBySub[sub].length} archivos)</div>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    renderProgressiveGrid(grid, gNoCambBySub[sub]);
    groupWrap.appendChild(grid);
    s2.appendChild(groupWrap);
  });
  c.appendChild(s2);
}
