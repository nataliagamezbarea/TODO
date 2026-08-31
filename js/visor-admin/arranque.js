window.__APP_VISTA="visor";
/* Oculta la ruta del visor antes del primer pintado, conservando su contexto. */
(() => {
  const p = new URLSearchParams(location.search);
  if (!p.toString() && location.pathname === "/") return;
  try {
    const previo = JSON.parse(localStorage.getItem("visor_contexto") || "{}");
    const archivo = p.get("archivo") || "";
    const contexto = {
      ...previo,
      ...(p.get("rama") ? { rama: p.get("rama") } : {}),
      ...(p.get("asignatura") ? { asignatura: p.get("asignatura") } : {}),
      ...(p.get("trimestre") ? { trimestre: p.get("trimestre") } : {}),
      ...(archivo ? { archivo, directo: true, abrirLista: false } : {}),
      ...(p.get("todas") ? { todas: true, abrirLista: !archivo } : {}),
      ...(p.get("return") ? { returnPath: p.get("return") } : {})
    };
    if (p.has("pos")) localStorage.setItem("visor_pos", p.get("pos"));
    localStorage.setItem("visor_contexto", JSON.stringify(contexto));
    history.replaceState({ visorUrlOculta: true }, document.title, window.location.pathname);
  } catch (_) {}
})();

window.__APP_VISTA = "visor";

window.__configurarPdfWorker = function configurarPdfWorker() {
  if (!window.pdfjsLib || !window.pdfjsLib.GlobalWorkerOptions) return false;
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('/visor-admin/lib/pdf.worker.min.js', window.location.origin).toString();
  if (window.pdfjsLib.VerbosityLevel) window.pdfjsLib.GlobalWorkerOptions.verbosity = window.pdfjsLib.VerbosityLevel.ERRORS;
  return true;
};
window.__configurarPdfWorker();