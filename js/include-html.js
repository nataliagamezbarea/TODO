// Utilidad ligera para incluir fragmentos HTML en elementos por id o por atributo data-include
// Uso básico desde cualquier página:
// <div id="header"></div>
// <script src="/js/include-html.js"></script>
// <script>cargar('header','/paginas/partials/header.html')</script>

window.cargar = async function cargar(id, archivo) {
  try {
    const el = document.getElementById(id);
    if (!el) return;
    const resp = await fetch(archivo, {cache: 'no-cache'});
    if (!resp.ok) throw new Error('No se pudo cargar ' + archivo + ' (' + resp.status + ')');
    el.innerHTML = await resp.text();
  } catch (e) {
    console.error(e);
  }
};

// Auto-carga: busca elementos con atributo data-include="ruta.html" y los carga
(async function autoLoad() {
  if (typeof window === 'undefined' || !document) return;
  await Promise.resolve(); // permitir que el DOM se construya
  const nodes = document.querySelectorAll('[data-include]');
  for (const n of nodes) {
    const src = n.getAttribute('data-include');
    if (!src) continue;
    try {
      const resp = await fetch(src, {cache: 'no-cache'});
      if (!resp.ok) { console.error('No se pudo cargar', src, resp.status); continue; }
      n.innerHTML = await resp.text();
    } catch (e) {
      console.error(e);
    }
  }
})();
