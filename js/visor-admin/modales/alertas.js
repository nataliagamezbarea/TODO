/* MODALES DE ALERTA Y CONFIRMACION (< 80 lineas) - usan #customModal del HTML */

function showBlocker(msg) {
  const b = document.getElementById('blocker');
  const t = document.getElementById('blockerText');
  if (t) t.textContent = msg || 'Procesando...';
  if (b) b.classList.add('on');
}

function hideBlocker() {
  const b = document.getElementById('blocker');
  if (b) b.classList.remove('on');
}

function _customModalBase(title, message, icon, color) {
  const modal = document.getElementById('customModal');
  if (!modal) return null;
  const iconEl = document.getElementById('customModalIcon');
  const titleEl = document.getElementById('customModalTitle');
  const msgEl = document.getElementById('customModalText');
  const box = document.getElementById('customModalBox');
  if (box) box.style.border = `2px solid ${color}`;
  if (iconEl) {
    iconEl.innerHTML = icon;
    iconEl.style.color = color;
  }
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.innerHTML = (message || '').replace(/\n/g, '<br/>');
  modal.classList.add('on');
  return modal;
}

function showCustomAlert(title, message, icon = '<i class="fa-solid fa-circle-info"></i>', color = '#38bdf8') {
  return new Promise((resolve) => {
    const modal = _customModalBase(title, message, icon, color);
    if (!modal) {
      alert(`${title}

${message}`);
      resolve();
      return;
    }
    const btnOk = document.getElementById('customModalOkBtn');
    const btnCancel = document.getElementById('customModalCancelBtn');
    if (btnCancel) btnCancel.style.display = 'none';
    if (!btnOk) {
      modal.classList.remove('on');
      resolve();
      return;
    }
    const cerrar = () => {
      modal.classList.remove('on');
      btnOk.onclick = null;
      resolve();
    };
    btnOk.onclick = cerrar;
  });
}

function showCustomConfirm(title, message, icon = '<i class="fa-solid fa-triangle-exclamation"></i>', color = '#ef4444') {
  return new Promise((resolve) => {
    const modal = _customModalBase(title, message, icon, color);
    if (!modal) {
      resolve(confirm(`${title}

${message}`));
      return;
    }
    const btnOk = document.getElementById('customModalOkBtn');
    const btnCancel = document.getElementById('customModalCancelBtn');
    if (btnCancel) btnCancel.style.display = '';
    const cerrarOk = (e) => {
      if (e && e.key) return;
      modal.classList.remove('on');
      btnOk.onclick = null;
      if (btnCancel) btnCancel.onclick = null;
      resolve(true);
    };
    const cerrarCancel = (e) => {
      if (e && e.key) return;
      modal.classList.remove('on');
      btnOk.onclick = null;
      if (btnCancel) btnCancel.onclick = null;
      resolve(false);
    };
    btnOk.onclick = cerrarOk;
    if (btnCancel) btnCancel.onclick = cerrarCancel;
  });
}


/* VISOR_FORCE_ALL_BRANCHES
   El visor de documentos debe ofrecer TODAS LAS RAMAS aunque la carga de ramas
   llegue después. No sustituir el selector por una única rama durante la carga. */
(function () {
  function normalizarSelectorRamasVisor() {
  const selects = Array.from(document.querySelectorAll(
    'select[id*="rama" i], select[id*="branch" i], select[name*="rama" i], select[name*="branch" i]'
  ));

  selects.forEach(select => {
    // SELECCIONAR siempre primero.
    let def = Array.from(select.options).find(o =>
      o.value === "" || o.dataset.defaultBranch === "1" ||
      o.textContent.trim().toUpperCase() === "SELECCIONAR"
    );

    if (!def) {
      def = document.createElement("option");
      def.value = "";
      def.textContent = "SELECCIONAR";
      def.dataset.defaultBranch = "1";
      select.insertBefore(def, select.firstChild);
    } else {
      def.dataset.defaultBranch = "1";
      if (select.firstChild !== def) select.insertBefore(def, select.firstChild);
    }

    // TODAS LAS RAMAS SIEMPRE AL FINAL.
    Array.from(select.options).forEach(o => {
      if (
        o.value === "__ALL_BRANCHES__" ||
        o.dataset.allBranches === "1" ||
        /TODAS\s+LAS\s+RAMAS/i.test(o.textContent || "")
      ) {
        o.remove();
      }
    });

    const allOpt = document.createElement("option");
    allOpt.value = "__ALL_BRANCHES__";
    allOpt.textContent = "— TODAS LAS RAMAS —";
    allOpt.dataset.allBranches = "1";
    select.appendChild(allOpt);

    // Si el visor se abrió desde el botón general, TODAS queda seleccionada.
    if (sessionStorage.getItem("visorAdminBranchMode") === "all") {
      select.value = "__ALL_BRANCHES__";
    }
  });
}

  window.normalizarSelectorRamasVisor = normalizarSelectorRamasVisor;
  document.addEventListener("DOMContentLoaded", normalizarSelectorRamasVisor);
  const obs = new MutationObserver(normalizarSelectorRamasVisor);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
