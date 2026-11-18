// ============================================================
// THEME.JS — Interruptor de tema claro/oscuro
// ------------------------------------------------------------
// El tema ya se aplica antes de esto (ver el script pequeño en
// el <head> de cada página, que evita el parpadeo del color
// incorrecto al cargar). Este archivo solo conecta el botón.
// ============================================================

(function () {
  "use strict";

  const boton = document.getElementById("interruptor-tema");
  if (!boton) return;

  function temaActual() {
    return document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "oscuro";
  }

  function actualizarAria() {
    boton.setAttribute("aria-checked", temaActual() === "claro" ? "true" : "false");
  }

  actualizarAria();

  boton.addEventListener("click", function () {
    const nuevo = temaActual() === "claro" ? "oscuro" : "claro";
    document.documentElement.setAttribute("data-tema", nuevo);
    try {
      localStorage.setItem("tema", nuevo);
    } catch (error) {
      // Si el navegador bloquea localStorage (modo incógnito estricto,
      // por ejemplo), el tema simplemente no se recuerda entre visitas.
    }
    actualizarAria();
  });
})();