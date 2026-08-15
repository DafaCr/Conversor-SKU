// ============================================================
// SCRIPT.JS — Lógica del conversor
// No es necesario tocar este archivo para actualizar códigos.
// Todos los códigos viven en codigos.js
// ============================================================

(function () {
  "use strict";

  const input = document.getElementById("input-codigo");
  const resultado = document.getElementById("resultado");
  const resultadoValor = document.getElementById("resultado-valor");
  const btnCopiar = document.getElementById("btn-copiar");
  const contador = document.getElementById("contador");

  // "codigos" viene definido en codigos.js, cargado antes que este archivo
  const totalCodigos = typeof codigos === "object" ? Object.keys(codigos).length : 0;
  contador.textContent = totalCodigos + " código(s) cargados";

  // Solo permitir números en el input
  input.addEventListener("input", function () {
    const limpio = input.value.replace(/\D/g, "");
    if (limpio !== input.value) {
      input.value = limpio;
    }
  });

  // Mantener el foco siempre en el input, salvo que el usuario
  // esté interactuando con el botón de copiar u otro control.
  document.addEventListener("click", function (evento) {
    if (evento.target !== btnCopiar) {
      input.focus();
    }
  });

  window.addEventListener("load", function () {
    input.focus();
  });

  input.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      buscarCodigo();
    }
  });

  function buscarCodigo() {
    const codigoIngresado = input.value.trim();

    if (codigoIngresado === "") {
      return;
    }

    const sku = codigos[codigoIngresado];

    if (sku !== undefined) {
      mostrarResultadoOk(sku);
    } else {
      mostrarResultadoError();
    }

    // Dejar el código anterior seleccionado para que, al escribir
    // el siguiente, se reemplace automáticamente sin borrar a mano.
    input.select();
  }

  function mostrarResultadoOk(sku) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");
    resultadoValor.textContent = sku;

    btnCopiar.hidden = false;
    btnCopiar.classList.remove("copiado");
    btnCopiar.textContent = "Copiar";
    btnCopiar.dataset.valor = sku;
  }

  function mostrarResultadoError() {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultado.classList.add("resultado--error");
    resultadoValor.textContent = "CÓDIGO NO REGISTRADO";

    btnCopiar.hidden = true;
  }

  btnCopiar.addEventListener("click", function () {
    const valor = btnCopiar.dataset.valor;
    if (!valor) return;

    navigator.clipboard.writeText(valor).then(function () {
      btnCopiar.textContent = "¡Copiado!";
      btnCopiar.classList.add("copiado");
      setTimeout(function () {
        btnCopiar.textContent = "Copiar";
        btnCopiar.classList.remove("copiado");
      }, 1200);
    }).catch(function () {
      // Si el navegador bloquea el portapapeles (por ejemplo, sin HTTPS),
      // no rompemos nada; el usuario igual puede leer el SKU en pantalla.
    });
  });
})();
