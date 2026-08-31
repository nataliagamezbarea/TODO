/* CORE DE COMPONENTES
   Este archivo NO genera HTML. Solo inicializa comportamiento común. */
(function () {
  "use strict";

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function bindOnce(el, event, handler) {
    if (!el || el.dataset.boundEvent === event) return;
    el.addEventListener(event, handler);
    el.dataset.boundEvent = event;
  }

  function initSearchBoxes() {
    qsa("[data-component='search-box']").forEach(box => {
      const input = qs(".component-search__input", box);
      const clear = qs("[data-search-clear]", box);
      if (!input) return;

      const update = () => {
        if (clear) clear.hidden = !input.value;
      };
      bindOnce(input, "input", update);
      if (clear) bindOnce(clear, "click", () => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      });
      update();
    });
  }

  function initModalShells() {
    qsa("[data-component='modal-shell']").forEach(modal => {
      qsa("[data-modal-close]", modal).forEach(btn => {
        bindOnce(btn, "click", () => {
          modal.hidden = true;
        });
      });
    });
  }

  function init() {
    initSearchBoxes();
    initModalShells();
    window.dispatchEvent(new CustomEvent("componentes:listos"));
  }

  window.ComponentesUI = Object.freeze({ qs, qsa, bindOnce, init });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
