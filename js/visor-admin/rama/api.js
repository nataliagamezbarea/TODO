// Las ramas se consultan directamente desde GitHub.
// No depende de /api/ramas ni de ningún backend.
window.RamaAPI = (() => {
  const RAMAS_RESPALDO = [];

  const listarRamas = async () => {
    try {
      const config = window.GITHUB_CONFIG || {};
      const repo = String(
        config.repo || config.repoPublico ||
        "nataliagamezbarea/grados_informaticos_public"
      ).trim();
      if (!repo) return RAMAS_RESPALDO;

      let token = "";
      try {
        if (typeof config.obtenerTokenSeguro === "function") {
          token = String(config.obtenerTokenSeguro() || "").trim();
        } else {
          token = String(config.token || "").trim();
        }
      } catch (_) {}

      const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(
        `https://api.github.com/repos/${repo}/branches?per_page=100`,
        { headers, cache: "no-store" }
      );

      if (!res.ok) return RAMAS_RESPALDO;

      const datos = await res.json();
      if (!Array.isArray(datos)) return RAMAS_RESPALDO;

      return datos
        .map(r => String(r?.name || "").trim())
        .filter(r => r && r.toLowerCase() !== "master");
    } catch (e) {
      console.warn("[RAMAS] No se pudieron obtener las ramas desde GitHub:", e);
      return RAMAS_RESPALDO;
    }
  };

  return { listarRamas, RAMAS_RESPALDO };
})();

/* Selector de ramas: siempre conserva SELECCIONAR y permite TODAS las ramas */
function ensureAllBranchesOption(select) {
  if (!select) return;

  let defaultOpt = Array.from(select.options).find(o =>
    o.value === "" || o.dataset.defaultBranch === "1"
  );

  if (!defaultOpt) {
    defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "SELECCIONAR";
    defaultOpt.dataset.defaultBranch = "1";
  }

  select.insertBefore(defaultOpt, select.firstChild);

  Array.from(select.options).forEach(o => {
    if (o.dataset.allBranches === "1" || o.value === "__ALL_BRANCHES__") {
      o.remove();
    }
  });

  const allOpt = document.createElement("option");
  allOpt.value = "__ALL_BRANCHES__";
  allOpt.textContent = "— TODAS LAS RAMAS —";
  allOpt.dataset.allBranches = "1";
  select.appendChild(allOpt);
}
