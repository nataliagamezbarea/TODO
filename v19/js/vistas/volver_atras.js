document.addEventListener("click", (event) => {
  const enlace = event.target.closest?.("#volver-atras");
  if (!enlace) return;
  event.preventDefault();
  if (window.AppViews?.atras) window.AppViews.atras();
});

function ensureAllBranchesOption(select) {
  if (!select) return;
  let defaultOpt = Array.from(select.options).find(o => o.value === "" || o.dataset.defaultBranch === "1");
  if (!defaultOpt) {
    defaultOpt = document.createElement("option");
    defaultOpt.value = ""; defaultOpt.textContent = "SELECCIONAR"; defaultOpt.dataset.defaultBranch = "1";
  }
  select.insertBefore(defaultOpt, select.firstChild);
  Array.from(select.options).forEach(o => { if (o.dataset.allBranches === "1" || o.value === "__ALL_BRANCHES__") o.remove(); });
  const allOpt = document.createElement("option");
  allOpt.value = "__ALL_BRANCHES__"; allOpt.textContent = "— TODAS LAS RAMAS —"; allOpt.dataset.allBranches = "1";
  select.appendChild(allOpt);
}
