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
    history.replaceState({ visorUrlOculta: true }, document.title, "/");
  } catch (_) {}
})();

window.__APP_VISTA = "visor";

if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    if (pdfjsLib.VerbosityLevel) pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS;
  }