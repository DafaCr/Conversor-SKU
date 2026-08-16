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
  const resultadoNombre = document.getElementById("resultado-nombre");
  const btnCopiar = document.getElementById("btn-copiar");
  const contador = document.getElementById("contador");
  const listaResultados = document.getElementById("lista-resultados");
  const listaItems = document.getElementById("lista-items");

  // "codigos" viene definido en codigos.js, cargado antes que este archivo
  const totalCodigos = typeof codigos === "object" ? Object.keys(codigos).length : 0;
  contador.textContent = totalCodigos + " código(s) cargados";

  // Ya no restringimos el input solo a números: ahora también se
  // puede escribir el nombre del producto para buscarlo.

  // Mantener el foco siempre en el input, salvo que el usuario
  // esté interactuando con el botón de copiar u otro control.
  document.addEventListener("click", function (evento) {
    const esBotonCopiar = evento.target === btnCopiar;
    const esItemDeLista = evento.target.closest && evento.target.closest(".lista-item");
    if (!esBotonCopiar && !esItemDeLista) {
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
    const consulta = input.value.trim();

    if (consulta === "") {
      return;
    }

    // 1. Coincidencia exacta por código de barras (lo más común: escaneo)
    const productoExacto = codigos[consulta];

    if (productoExacto) {
      ocultarListaResultados();
      mostrarResultadoOk(productoExacto.skus, productoExacto.nombre);
    } else {
      // 2. No coincide como código exacto: buscamos por nombre,
      //    sin distinguir mayúsculas/minúsculas, coincidencia parcial.
      const consultaMinuscula = consulta.toLowerCase();
      const coincidencias = Object.values(codigos).filter(function (producto) {
        return producto.nombre.toLowerCase().indexOf(consultaMinuscula) !== -1;
      });

      if (coincidencias.length === 1) {
        ocultarListaResultados();
        mostrarResultadoOk(coincidencias[0].skus, coincidencias[0].nombre);
      } else if (coincidencias.length > 1) {
        mostrarResultadoVacio();
        mostrarListaResultados(coincidencias);
      } else {
        ocultarListaResultados();
        mostrarResultadoError();
      }
    }

    // Dejar el texto anterior seleccionado para que, al escribir
    // el siguiente, se reemplace automáticamente sin borrar a mano.
    input.select();
  }

  function mostrarResultadoOk(skus, nombre) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");

    const textoSku = skus.join(" + ");
    resultadoValor.textContent = textoSku;
    resultadoNombre.textContent = nombre || "";

    btnCopiar.hidden = false;
    btnCopiar.dataset.valor = textoSku;

    // Copiar automáticamente en cuanto aparece el resultado.
    copiarAlPortapapeles(textoSku);
  }

  function mostrarResultadoError() {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultadoValor.textContent = "CÓDIGO NO REGISTRADO";
    resultadoNombre.textContent = "";

    btnCopiar.hidden = true;

    // Reiniciar la animación de sacudida aunque sea un error
    // justo después de otro error (para que se repita cada vez).
    resultado.classList.remove("resultado--error");
    void resultado.offsetWidth; // fuerza un reflow
    resultado.classList.add("resultado--error");
  }

  function mostrarResultadoVacio() {
    resultado.classList.remove("resultado--ok", "resultado--error");
    resultado.classList.add("resultado--vacio");
    resultadoValor.textContent = "—";
    resultadoNombre.textContent = "";
    btnCopiar.hidden = true;
  }

  function mostrarListaResultados(coincidencias) {
    listaItems.innerHTML = "";

    coincidencias.forEach(function (producto) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "lista-item";

      const nombreSpan = document.createElement("span");
      nombreSpan.className = "lista-item-nombre";
      nombreSpan.textContent = producto.nombre;

      const skuSpan = document.createElement("span");
      skuSpan.className = "lista-item-sku";
      skuSpan.textContent = producto.skus.join(" + ");

      boton.appendChild(nombreSpan);
      boton.appendChild(skuSpan);

      boton.addEventListener("click", function () {
        ocultarListaResultados();
        mostrarResultadoOk(producto.skus, producto.nombre);
        input.value = "";
        input.focus();
      });

      listaItems.appendChild(boton);
    });

    listaResultados.hidden = false;
  }

  function ocultarListaResultados() {
    listaResultados.hidden = true;
    listaItems.innerHTML = "";
  }

  function copiarAlPortapapeles(valor) {
    if (!navigator.clipboard) {
      // El navegador no soporta la API de portapapeles (por ejemplo,
      // si la página se abre como archivo local en vez de por HTTPS).
      btnCopiar.textContent = "Copiar";
      btnCopiar.classList.remove("copiado");
      return;
    }

    navigator.clipboard.writeText(valor).then(function () {
      btnCopiar.textContent = "¡Copiado!";
      btnCopiar.classList.add("copiado");
      setTimeout(function () {
        btnCopiar.textContent = "Copiar";
        btnCopiar.classList.remove("copiado");
      }, 1200);
    }).catch(function () {
      // Si el navegador bloquea el copiado automático (algunos exigen
      // que el copiado ocurra tras un clic directo del usuario), no
      // rompemos nada: el botón "Copiar" sigue funcionando manualmente.
      btnCopiar.textContent = "Copiar";
      btnCopiar.classList.remove("copiado");
    });
  }

  btnCopiar.addEventListener("click", function () {
    const valor = btnCopiar.dataset.valor;
    if (!valor) return;
    copiarAlPortapapeles(valor);
  });
})();